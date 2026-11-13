"""Radial-flux SPM analytical model."""

from __future__ import annotations

import math

from core.magnetic import apply_electric
from core.materials import MagnetGrade, Steel, Wire
from core.winding import WindingResult, compute_winding


def analyse_radial(
    winding: WindingResult | None = None,
    *,
    slots: int,
    poles: int,
    layers: int,
    coil_span: int,
    turns_per_coil: int,
    parallel_paths: int,
    connection: str,
    stator_od_m: float,
    stator_id_m: float,
    rotor_od_m: float,
    stack_m: float,
    airgap_m: float,
    yoke_m: float,
    tooth_width_m: float,
    slot_opening_m: float,
    magnet_thickness_m: float,
    magnet_width_m: float,
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
        skew_slots, slot_opening_m, stator_od_m,
    )
    Br = magnet.Br_at(temp_magnet)
    Di = stator_id_m
    slot_pitch = math.pi * Di / slots
    pole_pitch = math.pi * Di / poles
    pole_arc = min(max(magnet_width_m / max(pole_pitch, 1e-9), 0.3), 0.95)
    # Slot area: trapezoid between bore and yoke inner.
    r_yoke_in = stator_od_m / 2 - yoke_m
    r_bore = Di / 2
    hs = max(r_yoke_in - r_bore, 1e-4)
    tooth_pitch_mid = math.pi * (r_bore + r_yoke_in)
    slot_width_mid = max(tooth_pitch_mid / slots - tooth_width_m, 1e-4)
    slot_area = hs * slot_width_mid
    tooth_area = tooth_width_m * stack_m
    yoke_area = 2 * yoke_m * stack_m
    pole_area = pole_pitch * stack_m
    tau_p = pole_pitch

    conductors = 2 * turns_per_coil if layers == 2 else turns_per_coil
    iron_vol = (math.pi / 4 * (stator_od_m**2 - Di**2) - slots * slot_area) * stack_m
    iron_vol += math.pi * ((rotor_od_m / 2 - magnet_thickness_m) ** 2) * stack_m * 0.5
    iron_mass = steel.density_kg_m3 * steel.stacking_factor * max(iron_vol, 0)
    magnet_vol = poles * magnet_width_m * magnet_thickness_m * stack_m
    magnet_mass = magnet.density_kg_m3 * magnet_vol

    result = apply_electric(
        winding, magnet, steel, wire, strands, Br, magnet.mur, airgap_m, magnet_thickness_m,
        slot_pitch, slot_opening_m, pole_arc, pole_area, tooth_area, yoke_area,
        stack_m, stack_m, (Di + stator_od_m) / 2, slot_area, conductors,
        iron_mass, magnet_mass, hs, slot_width_mid, tau_p,
        current_a, speed_rpm, temp_cu, "radial",
        {
            "stator_od_m": stator_od_m,
            "stator_id_m": stator_id_m,
            "rotor_od_m": rotor_od_m,
            "stack_m": stack_m,
            "airgap_m": airgap_m,
            "yoke_m": yoke_m,
            "tooth_width_m": tooth_width_m,
            "slot_opening_m": slot_opening_m,
            "magnet_thickness_m": magnet_thickness_m,
            "magnet_width_m": magnet_width_m,
            "hs": hs,
        },
        sources,
        extra_gap_factor=1.0,
    )
    return result
