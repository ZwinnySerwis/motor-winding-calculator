"""Shared analytical magnetic-circuit pieces.

Air-gap flux: unsaturated surface-magnet circuit,
Bg = Br / (1 + mur * g_eff / lm)  (Hanselman; Pyrhönen ch. 6).
Carter factor: Pyrhönen eq. (3.5)–(3.7).
ke, kt from flux linkage: Hendershot & Miller / Hanselman (peak dq).
Iron loss scaled from catalog P15/50: P ~ B^2 (f/50)^1.5.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from core.materials import ALPHA_CU, DENSITY_CU, MU0, RHO_CU_20, MagnetGrade, Steel, Wire
from core.winding import WindingResult

ASSUMPTIONS = [
    "Unsaturated magnetic circuit, surface magnets, rectangular Bg plateau.",
    "Carter factor on slot opening only (Pyrhönen ch. 3).",
    "No saturation of tooth tips; compare Bt and By with 1.8 T / 1.5 T flags.",
    "Ld ≈ Lq (SPM). End-winding inductance is a Pyrhönen-order estimate.",
    "Iron loss uses catalog P15/50 scaled as (B/1.5)^2 (f/50)^1.5.",
]


def carter_factor(slot_pitch_m: float, slot_opening_m: float, gap_m: float) -> float:
    if gap_m <= 0 or slot_opening_m <= 0 or slot_pitch_m <= 0:
        return 1.0
    u = slot_opening_m / (2.0 * gap_m)
    gamma = (4.0 / math.pi) * (u * math.atan(u) - 0.5 * math.log(1.0 + u * u))
    kc = slot_pitch_m / (slot_pitch_m - gamma * gap_m)
    return max(kc, 1.0)


def airgap_plateau(Br: float, mur: float, gap_m: float, lm_m: float, kc: float) -> float:
    if lm_m <= 0:
        return 0.0
    return Br / (1.0 + mur * (kc * gap_m) / lm_m)


def fundamental_B(Bg: float, pole_arc_frac: float) -> float:
    """Peak of the fundamental, rectangular magnet (Pyrhönen 6.3)."""
    return (4.0 / math.pi) * Bg * math.sin(pole_arc_frac * math.pi / 2.0)


def copper_resistivity(temp_C: float) -> float:
    return RHO_CU_20 * (1.0 + ALPHA_CU * (temp_C - 20.0))


def iron_loss_w(steel: Steel, mass_kg: float, B_T: float, freq_hz: float) -> float:
    if mass_kg <= 0 or B_T <= 0 or freq_hz <= 0:
        return 0.0
    p15 = steel.P15_50_W_kg_typical
    return p15 * (B_T / 1.5) ** 2 * (freq_hz / 50.0) ** 1.5 * mass_kg


def inductance_spm(
    slots: int,
    poles: int,
    kw: float,
    nph: int,
    length_m: float,
    tau_p: float,
    g_eff: float,
    slot_height: float,
    slot_width: float,
    end_turn: float,
) -> tuple[float, float, float]:
    """Return (Ld, Lq, Lm). Pyrhönen ch. 6 magnetising + slot/end leakage estimate."""
    p = max(poles // 2, 1)
    if g_eff <= 0 or nph <= 0:
        return 0.0, 0.0, 0.0
    lm = MU0 * 1.5 * (kw * nph) ** 2 * length_m * tau_p / (math.pi**2 * p * g_eff)
    n_slot = 2.0 * nph / slots
    lam = 0.0
    if slot_width > 0 and slot_height > 0:
        lam = slot_height / (3.0 * slot_width) + 0.7
    l_slot = MU0 * length_m * slots * n_slot**2 * lam / 3.0
    l_end = MU0 * end_turn * nph**2 * 0.3 / p
    ld = lm + l_slot + l_end
    return ld, ld, lm


@dataclass
class MachineResult:
    kind: str
    winding: WindingResult
    Bg: float
    B1: float
    Bt: float
    By: float
    Bm: float
    flux_per_pole: float
    psi_pm: float
    ke_Vs_per_rad: float
    ke_Vpk_per_krpm: float
    kt_Nm_per_Apeak: float
    R20: float
    R_hot: float
    J_A_mm2: float
    fill: float
    copper_mass: float
    iron_mass: float
    magnet_mass: float
    Ld: float
    Lq: float
    Lm: float
    E_rms: float
    I_rms: float
    T_mean: float
    P_cu: float
    P_fe: float
    P_mech: float
    efficiency: float
    speed_rpm: float
    freq_hz: float
    slot_area_m2: float
    pole_arc_frac: float
    g_eff: float
    warnings: list[str] = field(default_factory=list)
    assumptions: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)
    geometry: dict = field(default_factory=dict)

    def metrics_rows(self) -> list[tuple[str, str, str]]:
        return [
            ("kw1", f"{self.winding.kw1:.3f}", "DFT of slot current sheet"),
            ("Bg plateau", f"{self.Bg:.3f} T", "unsaturated PM circuit"),
            ("B1 peak", f"{self.B1:.3f} T", "rectangular-magnet fundamental"),
            ("Bt tooth", f"{self.Bt:.3f} T", "flag if > 1.8 T"),
            ("By yoke", f"{self.By:.3f} T", "flag if > 1.5 T"),
            ("Bm magnet", f"{self.Bm:.3f} T", "load-line, no knee model"),
            ("Φ pole", f"{self.flux_per_pole*1e3:.3f} mWb", ""),
            ("ψpm", f"{self.psi_pm*1e3:.2f} mWb", "kw Nph Φ"),
            ("ke", f"{self.ke_Vs_per_rad:.4f} V s/rad", "phase peak / ωm"),
            ("kt", f"{self.kt_Nm_per_Apeak:.4f} N·m/A", "3/2 p ψpm, Iq peak"),
            ("R 20 °C", f"{self.R20:.4f} Ω", "IEC copper"),
            ("R hot", f"{self.R_hot:.4f} Ω", ""),
            ("J", f"{self.J_A_mm2:.2f} A/mm²", "Pyrhönen typical 4–8 A/mm²"),
            ("slot fill", f"{self.fill*100:.1f} %", "bare copper / slot area"),
            ("Ld ≈ Lq", f"{self.Ld*1e3:.3f} mH", "SPM assumption"),
            ("E rms", f"{self.E_rms:.1f} V", "phase"),
            ("I rms", f"{self.I_rms:.2f} A", ""),
            ("T mean", f"{self.T_mean:.3f} N·m", "id = 0"),
            ("P cu", f"{self.P_cu:.1f} W", ""),
            ("P fe", f"{self.P_fe:.1f} W", "Steinmetz from P15/50"),
            ("P mech", f"{self.P_mech:.1f} W", "T ω"),
            ("η", f"{self.efficiency*100:.1f} %", "Pmech / (Pmech+Pcu+Pfe)"),
            ("n", f"{self.speed_rpm:.0f} rpm", ""),
            ("f", f"{self.freq_hz:.1f} Hz", ""),
        ]


def _end_turn_length(distributed: bool, coil_span: int, slots: int, diameter_m: float) -> float:
    tau_coil = coil_span * math.pi * diameter_m / slots
    k_ew = 1.35 if distributed else 1.6
    return k_ew * tau_coil


def apply_electric(
    winding: WindingResult,
    magnet: MagnetGrade,
    steel: Steel,
    wire: Wire,
    strands: int,
    Br: float,
    mur: float,
    gap_m: float,
    lm_m: float,
    slot_pitch_m: float,
    slot_opening_m: float,
    pole_arc_frac: float,
    pole_area_m2: float,
    tooth_area_m2: float,
    yoke_area_m2: float,
    active_length_m: float,
    mean_turn_core_m: float,
    end_diameter_m: float,
    slot_area_m2: float,
    conductors_per_slot: int,
    iron_mass: float,
    magnet_mass: float,
    slot_height: float,
    slot_width: float,
    tau_p: float,
    current_a: float,
    speed_rpm: float,
    temp_cu: float,
    kind: str,
    geometry: dict,
    sources: list[str],
    extra_gap_factor: float = 1.0,
) -> MachineResult:
    kc = carter_factor(slot_pitch_m, slot_opening_m, gap_m)
    g_eff = kc * gap_m * extra_gap_factor
    Bg = airgap_plateau(Br, mur, gap_m * extra_gap_factor, lm_m, kc)
    B1 = fundamental_B(Bg, pole_arc_frac)
    flux = Bg * pole_arc_frac * pole_area_m2
    kfe = steel.stacking_factor
    Bt = flux / max(tooth_area_m2 * kfe, 1e-12)
    By = flux / max(yoke_area_m2 * kfe, 1e-12)
    Bm = Br * lm_m / (lm_m + mur * g_eff) if lm_m else 0.0

    nph = max(winding.turns_per_phase, 1)
    psi = winding.kw1 * nph * flux
    p = winding.pole_pairs
    ke = p * psi
    kt = 1.5 * p * psi
    ke_krpm = ke * (2 * math.pi * 1000 / 60)

    end_len = _end_turn_length(winding.distributed, winding.coil_span, winding.slots, end_diameter_m)
    lmt = 2 * mean_turn_core_m + 2 * end_len
    paths = winding.parallel_paths
    a_cu = wire.area_m2 * max(strands, 1) * paths
    rho = copper_resistivity(20)
    rho_h = copper_resistivity(temp_cu)
    R20 = rho * lmt * nph / max(a_cu, 1e-16)
    R_hot = rho_h * lmt * nph / max(a_cu, 1e-16)
    copper_mass = DENSITY_CU * lmt * nph * 3 * a_cu / max(paths, 1)

    I = max(current_a, 0.0)
    J = (I / max(paths, 1)) / max(wire.area_m2 * max(strands, 1), 1e-16) / 1e6
    fill = conductors_per_slot * wire.area_m2 * max(strands, 1) / max(slot_area_m2, 1e-16)

    omega_m = speed_rpm * 2 * math.pi / 60.0
    freq = p * speed_rpm / 60.0
    E_peak = ke * omega_m
    E_rms = E_peak / math.sqrt(2)
    I_peak = I * math.sqrt(2)
    T_mean = kt * I_peak
    P_cu = 3 * I * I * R_hot
    P_fe = iron_loss_w(steel, iron_mass, max(Bt, Bg), freq)
    P_mech = T_mean * omega_m
    denom = P_mech + P_cu + P_fe
    eta = P_mech / denom if denom > 0 else 0.0

    ld, lq, lm = inductance_spm(
        winding.slots, winding.poles, winding.kw1, nph, active_length_m, tau_p, max(g_eff, 1e-6),
        slot_height, slot_width, end_len,
    )

    warnings = list(winding.warnings)
    if Bt > 1.8:
        warnings.append(f"Tooth flux density {Bt:.2f} T exceeds 1.8 T (Pyrhönen typical limit).")
    if By > 1.5:
        warnings.append(f"Yoke flux density {By:.2f} T exceeds 1.5 T.")
    if fill > 0.55:
        warnings.append(f"Bare-copper slot fill {fill*100:.0f} % is above a practical random-wound 0.45–0.50.")
    if J > 10:
        warnings.append(f"Current density {J:.1f} A/mm² is high for natural cooling.")
    if Bm < 0.2:
        warnings.append("Magnet load-line Bm is low; check demagnetisation against HcJ.")
    if magnet.Tmax_C < 80:
        warnings.append(f"{magnet.id} catalog Tmax is {magnet.Tmax_C:.0f} °C.")

    return MachineResult(
        kind=kind,
        winding=winding,
        Bg=Bg,
        B1=B1,
        Bt=Bt,
        By=By,
        Bm=Bm,
        flux_per_pole=flux,
        psi_pm=psi,
        ke_Vs_per_rad=ke,
        ke_Vpk_per_krpm=ke_krpm,
        kt_Nm_per_Apeak=kt,
        R20=R20,
        R_hot=R_hot,
        J_A_mm2=J,
        fill=fill,
        copper_mass=copper_mass,
        iron_mass=iron_mass,
        magnet_mass=magnet_mass,
        Ld=ld,
        Lq=lq,
        Lm=lm,
        E_rms=E_rms,
        I_rms=I,
        T_mean=T_mean,
        P_cu=P_cu,
        P_fe=P_fe,
        P_mech=P_mech,
        efficiency=eta,
        speed_rpm=speed_rpm,
        freq_hz=freq,
        slot_area_m2=slot_area_m2,
        pole_arc_frac=pole_arc_frac,
        g_eff=g_eff,
        warnings=warnings,
        assumptions=ASSUMPTIONS + winding.assumptions,
        sources=sources,
        geometry=geometry,
    )


def gap_B_waveform(poles: int, pole_arc_frac: float, Bg: float, n_samples: int, rotor_angle_rad: float) -> list[float]:
    """Analytical air-gap B(θ) from a rectangular magnet plateau, rotated with the rotor."""
    values = []
    half = pole_arc_frac * math.pi / poles
    for i in range(n_samples):
        theta = 2 * math.pi * i / n_samples
        rel = (theta - rotor_angle_rad) % (2 * math.pi / poles)
        if rel > math.pi / poles:
            rel -= 2 * math.pi / poles
        values.append(Bg if abs(rel) < half else 0.0)
    # Flip sign every pole
    out = []
    for i, b in enumerate(values):
        pole = int(((2 * math.pi * i / n_samples) - rotor_angle_rad) % (2 * math.pi) * poles / (2 * math.pi))
        out.append(b if pole % 2 == 0 else -b)
    return out
