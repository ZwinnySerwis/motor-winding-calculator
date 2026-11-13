"""Axial-flux TORUS (two rotors, internal stator) analytical model.

Flux path: magnet – air-gap – stator – air-gap – magnet (NS TORUS).
Gieras, Wang, Kamper, *Axial Flux Permanent Magnet Brushless Machines*:
average diameter D = (Do+Di)/2, pole pitch π D / 2p, pole area
αi π (Ro² − Ri²) / 2p. Two gaps in series with two magnets:
Bg = Br / (1 + mur * g / lm).
"""

from __future__ import annotations

import math

from core.magnetic import apply_electric
from core.materials import MagnetGrade, Steel, Wire
from core.winding import WindingResult, compute_winding


def analyse_axial(
    winding: WindingResult | None = None,
    *,
    slots: int,
    poles: int,
    layers: int,
    coil_span: int,
    turns_per_coil: int,
    parallel_paths: int,
    connection: str,
    outer_d_m: float,
    inner_d_m: float,
    magnet_thickness_m: float,
    airgap_m: float,
    stator_thickness_m: float,
    rotor_yoke_m: float,
    slot_depth_m: float,
    slot_width_m: float,
    pole_arc_frac: float,
    skew_slots: float,
    magnet: MagnetGrade,
    steel: Steel,
    wire: Wire,
    strands: int,
    current_a: float,
    speed_rpm: float,
    temp_cu: float,
    temp_magnet: float,
    sources: list[str],
) -> object:
    winding = winding or compute_winding(
        slots, poles, layers, coil_span, turns_per_coil, parallel_paths, connection,
        skew_slots, slot_width_m, outer_d_m,
    )
    Br = magnet.Br_at(temp_magnet)
    Ro, Ri = outer_d_m / 2, inner_d_m / 2
    D = (outer_d_m + inner_d_m) / 2
    Lrad = (outer_d_m - inner_d_m) / 2
    tau_p = math.pi * D / poles
    pole_area = math.pi * (Ro**2 - Ri**2) / poles
    # Mean slot pitch at average radius
    slot_pitch = math.pi * D / slots
    tooth_width = max(slot_pitch - slot_width_m, 1e-4)
    tooth_area = tooth_width * Lrad
    yoke_area = 2 * (stator_thickness_m - slot_depth_m) * Lrad
    slot_area = slot_depth_m * slot_width_m
    conductors = 2 * turns_per_coil if layers == 2 else turns_per_coil

    stator_iron = (math.pi * (Ro**2 - Ri**2) * stator_thickness_m - slots * slot_area * Lrad)
    rotor_iron = 2 * math.pi * (Ro**2 - Ri**2) * rotor_yoke_m
    iron_mass = steel.density_kg_m3 * steel.stacking_factor * max(stator_iron + rotor_iron, 0)
    magnet_vol = 2 * poles * pole_arc_frac * pole_area * magnet_thickness_m
    magnet_mass = magnet.density_kg_m3 * magnet_vol

    # Two air-gaps in series, two magnets: extra_gap_factor=1 with lm = magnet
    # and Bg formula already uses one gap vs one magnet (Gieras NS TORUS).
    result = apply_electric(
        winding, magnet, steel, wire, strands, Br, magnet.mur, airgap_m, magnet_thickness_m,
        slot_pitch, slot_width_m, pole_arc_frac, pole_area, tooth_area, max(yoke_area, 1e-6),
        Lrad, Lrad, D, max(slot_area, 1e-8), conductors,
        iron_mass, magnet_mass, slot_depth_m, slot_width_m, tau_p,
        current_a, speed_rpm, temp_cu, "axial",
        {
            "outer_d_m": outer_d_m,
            "inner_d_m": inner_d_m,
            "magnet_thickness_m": magnet_thickness_m,
            "airgap_m": airgap_m,
            "stator_thickness_m": stator_thickness_m,
            "rotor_yoke_m": rotor_yoke_m,
            "slot_depth_m": slot_depth_m,
            "slot_width_m": slot_width_m,
            "pole_arc_frac": pole_arc_frac,
            "Lrad": Lrad,
            "D": D,
        },
        sources,
        extra_gap_factor=1.0,
    )
    return result
