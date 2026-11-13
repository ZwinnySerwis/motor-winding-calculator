"""Slot-star winding layout and winding factors.

The slot-to-phase assignment follows Bewicklungsrechner XL (Felix Niessen, 2010,
GPL-3): 60-degree phase belts stepped by 180 * poles / slots electrical degrees.

Winding factor of spatial order nu is the DFT of the slot current sheet, which is
the same construction as the original calculator and matches tabulated FSCW
values (12/10 kw1 = 0.933; Cros & Viarouge 2002). Pitch and distribution factors
use the classical formulae in Hendershot & Miller, *Design of Brushless
Permanent-Magnet Machines*, and Pyrhönen, Jokinen, Hrabovcová, *Design of
Rotating Electrical Machines*, ch. 2.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from math import gcd
from typing import Iterable


PHASES = ("A", "B", "C")
PHASE_INDEX = {"A": 0, "B": 1, "C": 2}


def _lcm(a: int, b: int) -> int:
    return abs(a * b) // gcd(a, b)


def sinc(x: float) -> float:
    if abs(x) < 1e-12:
        return 1.0
    return math.sin(x) / x


@dataclass(frozen=True)
class Coil:
    index: int
    phase: str
    go_slot: int
    return_slot: int
    polarity: int
    turns: int

    @property
    def sign(self) -> str:
        return "+" if self.polarity > 0 else "-"


@dataclass
class WindingResult:
    slots: int
    poles: int
    pole_pairs: int
    layers: int
    coil_span: int
    turns_per_coil: int
    parallel_paths: int
    connection: str
    q: float
    distributed: bool
    scheme: str
    slot_phases: list[str]
    balanced: bool
    coils: list[Coil]
    turns_per_phase: int
    kp: dict[int, float]
    kd: dict[int, float]
    kw: dict[int, float]
    kskew: dict[int, float]
    kso: dict[int, float]
    kw_total: dict[int, float]
    working_order: int
    kw1: float
    mmf_thd: float
    phase_vector_sum: dict[str, complex]
    gcd_slots_poles: int
    cogging_steps: int
    unipolar_pull_risk: bool
    assumptions: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "slots": self.slots,
            "poles": self.poles,
            "pole_pairs": self.pole_pairs,
            "layers": self.layers,
            "coil_span": self.coil_span,
            "turns_per_coil": self.turns_per_coil,
            "parallel_paths": self.parallel_paths,
            "connection": self.connection,
            "q": self.q,
            "distributed": self.distributed,
            "scheme": self.scheme,
            "balanced": self.balanced,
            "kw1": self.kw1,
            "working_order": self.working_order,
            "mmf_thd": self.mmf_thd,
            "gcd_slots_poles": self.gcd_slots_poles,
            "cogging_steps": self.cogging_steps,
            "unipolar_pull_risk": self.unipolar_pull_risk,
            "turns_per_phase": self.turns_per_phase,
            "kp": self.kp,
            "kd": self.kd,
            "kw": self.kw,
            "kskew": self.kskew,
            "kso": self.kso,
            "kw_total": self.kw_total,
            "coils": [
                {
                    "index": c.index,
                    "phase": c.phase,
                    "go_slot": c.go_slot,
                    "return_slot": c.return_slot,
                    "polarity": c.polarity,
                    "turns": c.turns,
                }
                for c in self.coils
            ],
            "warnings": self.warnings,
            "assumptions": self.assumptions,
        }


def _belt_letter(angle_deg: float) -> str:
    s = angle_deg % 360.0
    if s >= 330 or s < 30:
        return "A"
    if s < 90:
        return "b"
    if s < 150:
        return "C"
    if s < 210:
        return "a"
    if s < 270:
        return "B"
    return "c"


def assign_slot_star(slots: int, poles: int) -> tuple[str, bool, bool]:
    """Return (scheme, distributed, balanced) using the original 60-degree belts."""
    if slots % 3 != 0 or slots < 3:
        raise ValueError("Slot number must be divisible by 3 and at least 3.")
    if poles % 2 != 0 or poles < 2:
        raise ValueError("Pole number must be even and at least 2.")
    if poles == slots:
        raise ValueError("Pole number and slot number must be different.")

    q = slots / 3.0 / poles
    distributed = q >= 1.0
    step = 180.0 * poles / slots
    letters: list[str] = []
    counts = {ch: 0 for ch in "aAbBcC"}
    acc = 0.0
    for _ in range(slots):
        ch = _belt_letter(acc)
        letters.append(ch)
        counts[ch] += 1
        acc = (acc + step) % 360.0

    a, b, c = counts["a"], counts["b"], counts["c"]
    A, B, C = counts["A"], counts["B"], counts["C"]
    balanced = a == b == c and A == B == C and a + A > 0

    scheme = "".join(letters)
    if balanced and ("a" in scheme) and ("A" in scheme):
        while scheme[-1] in "aA":
            schema_last = scheme[-1]
            scheme = schema_last + scheme[:-1]

    if scheme[0] == "a":
        scheme = scheme.translate(str.maketrans("abcABC", "ABCabc"))

    pos_b = min((i for i, ch in enumerate(scheme) if ch in "bB"), default=0)
    pos_c = min((i for i, ch in enumerate(scheme) if ch in "cC"), default=0)
    if pos_b > pos_c:
        scheme = scheme.translate(str.maketrans("bcBC", "cbCB"))

    return scheme, distributed, balanced


def _phase_currents(t: float) -> dict[str, float]:
    ia = math.sin(t * 2 * math.pi)
    ib = math.sin(t * 2 * math.pi + 2 * math.pi / 3)
    ic = math.sin(t * 2 * math.pi - 2 * math.pi / 3)
    return {"a": ia, "b": ib, "c": ic, "-": 0.0}


def _signed_current(letter: str, phase_i: dict[str, float]) -> float:
    value = phase_i[letter.lower()]
    if letter == letter.lower():
        value = -value
    return value


def _slot_currents(scheme: str, t: float = 0.0, distributed: bool = False) -> list[float]:
    """Current-sheet sample used by the DFT winding-factor.

    Concentrated (q < 1): original Bewicklungsrechner XL mixing of adjacent
    slot sides (tooth-coil). Distributed (q >= 1): the conductor in the slot
    itself, which recovers the classical belt winding factor.
    """
    phase_i = _phase_currents(t)
    n = len(scheme)
    if distributed:
        return [_signed_current(ch, phase_i) for ch in scheme]
    sheet = [0.0] * n
    for i, ch in enumerate(scheme):
        s1 = _signed_current(ch, phase_i)
        prev = scheme[i - 1]
        s2 = phase_i[prev.lower()]
        # Return side of the previous coil: original calculator inverts uppercase.
        if prev != prev.lower():
            s2 = -s2
        sheet[i] = s1 + s2
        if s1 != 0 and s2 != 0:
            sheet[i] = (s1 + s2) / 2.0
    return sheet


def winding_factor_spectrum(
    scheme: str, max_order: int | None = None, distributed: bool = False
) -> dict[int, float]:
    """kw of spatial order n (pole-pair order) from the slot current sheet."""
    n_slots = len(scheme)
    if max_order is None:
        max_order = n_slots * 6
    sheet = _slot_currents(scheme, t=0.25, distributed=distributed)
    spectrum: dict[int, float] = {}
    for n in range(1, max_order + 1):
        re = 0.0
        im = 0.0
        for x, val in enumerate(sheet):
            ang = n * 2 * math.pi * x / n_slots
            re += val / n_slots * math.sin(ang)
            im += val / n_slots * math.cos(ang)
        spectrum[n] = round(2.0 * math.hypot(re, im), 5)
    return spectrum


def pitch_factor(harmonic: int, coil_span: int, slots: int, poles: int) -> float:
    """kp_h = sin(h * coil_span_elec / 2). Hendershot/Miller; Pyrhönen ch. 2."""
    span_elec = coil_span * math.pi * poles / slots
    return sinc_sin_half(harmonic * span_elec)


def sinc_sin_half(angle_rad: float) -> float:
    return math.sin(angle_rad / 2.0)


def distribution_factor(harmonic: int, q: float, slots: int, poles: int) -> float:
    """kd_h = sin(q h α / 2) / (q sin(h α / 2)), α = electrical slot pitch."""
    if q <= 0:
        return 0.0
    alpha = math.pi * poles / slots
    num = math.sin(q * harmonic * alpha / 2.0)
    den = q * math.sin(harmonic * alpha / 2.0)
    if abs(den) < 1e-12:
        return 1.0
    return num / den


def slot_opening_factor(order: int, slot_opening_m: float, stator_diameter_m: float) -> float:
    """kso from the original calculator: sinc(nu * b0 / D)."""
    if stator_diameter_m <= 0 or slot_opening_m <= 0:
        return 1.0
    return sinc(order * slot_opening_m / stator_diameter_m)


def skew_factor(order: int, skew_slots: float, slots: int) -> float:
    """ksk = sinc(pi * skew_slots * nu / Q). Pyrhönen ch. 2 / original calculator."""
    if skew_slots == 0:
        return 1.0
    return sinc(skew_slots * math.pi * order / slots)


def _coils_concentrated(scheme: str, turns: int, layers: int) -> list[Coil]:
    """One coil per tooth (double layer) or every other tooth (single layer)."""
    slots = len(scheme)
    step = 2 if layers == 1 else 1
    coils: list[Coil] = []
    idx = 1
    for k in range(0, slots, step):
        go = k + 1
        ret = (k + 1) % slots + 1
        letter = scheme[k]
        phase = letter.upper()
        if phase not in PHASES:
            continue
        polarity = 1 if letter.isupper() else -1
        coils.append(
            Coil(
                index=idx,
                phase=phase,
                go_slot=go,
                return_slot=ret,
                polarity=polarity,
                turns=turns,
            )
        )
        idx += 1
    return coils


def _coils_distributed(slots: int, poles: int, scheme: str, turns: int, coil_span: int) -> list[Coil]:
    """Double-layer distributed: one go side per slot, return span slots later."""
    coils: list[Coil] = []
    for k, letter in enumerate(scheme):
        phase = letter.upper()
        if phase not in PHASES:
            continue
        polarity = 1 if letter.isupper() else -1
        go = k + 1
        ret = (k + coil_span) % slots + 1
        coils.append(
            Coil(
                index=k + 1,
                phase=phase,
                go_slot=go,
                return_slot=ret,
                polarity=polarity,
                turns=turns,
            )
        )
    return coils


def compute_winding(
    slots: int,
    poles: int,
    layers: int = 2,
    coil_span: int | None = None,
    turns_per_coil: int = 1,
    parallel_paths: int = 1,
    connection: str = "Y",
    skew_slots: float = 0.0,
    slot_opening_m: float = 0.0,
    stator_diameter_m: float = 0.0,
) -> WindingResult:
    scheme, distributed, balanced = assign_slot_star(slots, poles)
    pole_pairs = poles // 2
    q = slots / 3.0 / poles
    if coil_span is None:
        coil_span = 1 if not distributed else max(1, round(slots / poles))
    coil_span = max(1, min(coil_span, slots - 1))
    layers = 2 if layers != 1 else 1
    connection = "D" if str(connection).upper().startswith("D") else "Y"
    parallel_paths = max(1, int(parallel_paths))
    turns_per_coil = max(1, int(turns_per_coil))

    if distributed:
        coils = _coils_distributed(slots, poles, scheme, turns_per_coil, coil_span)
    else:
        coils = _coils_concentrated(scheme, turns_per_coil, layers)

    coils_per_phase = {ph: 0 for ph in PHASES}
    for coil in coils:
        coils_per_phase[coil.phase] += 1
    series_coils = coils_per_phase["A"] / parallel_paths if parallel_paths else 0
    turns_per_phase = int(round(series_coils * turns_per_coil))

    spectrum = winding_factor_spectrum(scheme, distributed=distributed)
    working = pole_pairs
    harmonics = sorted(set([1, 5, 7, 11, 13, working] + list(range(1, min(slots * 2, 25) + 1))))
    kp: dict[int, float] = {}
    kd: dict[int, float] = {}
    kw: dict[int, float] = {}
    ksk: dict[int, float] = {}
    kso: dict[int, float] = {}
    kw_tot: dict[int, float] = {}
    for n in harmonics:
        electrical = n / working if working else n
        kp_n = abs(pitch_factor(electrical, coil_span, slots, poles))
        kw_n = spectrum.get(n, 0.0)
        if q >= 1:
            kd_n = abs(distribution_factor(electrical, q, slots, poles))
        else:
            kd_n = abs(kw_n / kp_n) if kp_n > 1e-9 else 0.0
        kp[n] = round(kp_n, 5)
        kd[n] = round(min(kd_n, 1.0) if q < 1 else kd_n, 5)
        kw[n] = round(kw_n, 5)
        ksk[n] = round(skew_factor(n, skew_slots, slots), 5)
        kso[n] = round(slot_opening_factor(n, slot_opening_m, stator_diameter_m), 5)
        kw_tot[n] = round(kw_n * ksk[n] * kso[n], 5)

    kw1 = kw_tot.get(working, kw.get(working, 0.0))
    fund = spectrum.get(working, 0.0) or 1.0
    rms_h = math.sqrt(sum(v * v for n, v in spectrum.items() if n != working))
    mmf_thd = rms_h / fund if fund else 0.0

    vectors = {ph: 0j for ph in PHASES}
    step = math.pi * poles / slots
    for i, letter in enumerate(scheme):
        ph = letter.upper()
        if ph not in vectors:
            continue
        sign = 1 if letter.isupper() else -1
        vectors[ph] += sign * complex(math.cos(i * step), math.sin(i * step))

    g = gcd(slots, poles)
    warnings: list[str] = []
    if not balanced:
        warnings.append("Phase belts are not balanced (unequal A/B/C coil sides).")
    if g <= 1:
        warnings.append("gcd(Q, 2p) = 1: unbalanced magnetic pull is possible.")

    assumptions = [
        "Conductors are concentrated at the slot centre (Pyrhönen ch. 2).",
        "kw(ν) is the DFT of the slot current sheet at one electrical instant (Bewicklungsrechner XL).",
        "kp uses coil span in electrical radians; kd uses the classical belt formula.",
        "Slot-opening and skew factors are sin(x)/x corrections, applied after kw.",
    ]

    return WindingResult(
        slots=slots,
        poles=poles,
        pole_pairs=pole_pairs,
        layers=layers,
        coil_span=coil_span,
        turns_per_coil=turns_per_coil,
        parallel_paths=parallel_paths,
        connection=connection,
        q=q,
        distributed=distributed,
        scheme=scheme,
        slot_phases=list(scheme),
        balanced=balanced,
        coils=coils,
        turns_per_phase=turns_per_phase,
        kp=kp,
        kd=kd,
        kw=kw,
        kskew=ksk,
        kso=kso,
        kw_total=kw_tot,
        working_order=working,
        kw1=kw1,
        mmf_thd=mmf_thd,
        phase_vector_sum=vectors,
        gcd_slots_poles=g,
        cogging_steps=_lcm(slots, poles),
        unipolar_pull_risk=g <= 1,
        assumptions=assumptions,
        warnings=warnings,
    )


def mmf_waveform(scheme: str, electrical_angle_rad: float, distributed: bool = False) -> list[float]:
    """Slot MMF samples for drawing, currents at the given electrical angle."""
    t = electrical_angle_rad / (2 * math.pi)
    return _slot_currents(scheme, t=t, distributed=distributed)


def iter_kw_table(result: WindingResult, orders: Iterable[int] | None = None) -> list[tuple[int, float, float, float]]:
    if orders is None:
        orders = sorted(result.kw)
    rows = []
    for n in orders:
        rows.append((n, result.kp.get(n, 0.0), result.kd.get(n, 0.0), result.kw_total.get(n, result.kw.get(n, 0.0))))
    return rows
