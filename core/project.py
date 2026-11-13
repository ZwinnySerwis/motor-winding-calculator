"""Project JSON and the single 'compute everything' entry point."""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

from core.axial import analyse_axial
from core.magnetic import MachineResult
from core.materials import catalog
from core.radial import analyse_radial
from core.simulate import Trace, simulate
from core.winding import compute_winding


DEFAULT_PRESET = "radial_12_10"


def default_project() -> dict[str, Any]:
    cat = catalog()
    preset = deepcopy(cat.presets[DEFAULT_PRESET])
    return {
        "preset_id": DEFAULT_PRESET,
        "machine_type": preset["machine_type"],
        "geometry": deepcopy(preset["geometry"]),
        "operating": deepcopy(preset["operating"]),
        "source": preset["source"],
        "overridden": [],
    }


def load_preset(preset_id: str) -> dict[str, Any]:
    cat = catalog()
    preset = deepcopy(cat.presets[preset_id])
    return {
        "preset_id": preset_id,
        "machine_type": preset["machine_type"],
        "geometry": deepcopy(preset["geometry"]),
        "operating": deepcopy(preset["operating"]),
        "source": preset["source"],
        "overridden": [],
    }


def save_project(path: Path, project: dict[str, Any]) -> None:
    path.write_text(json.dumps(project, indent=2), encoding="utf-8")


def load_project(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    base = default_project()
    base.update({k: data[k] for k in base if k in data})
    if "geometry" in data:
        base["geometry"].update(data["geometry"])
    if "operating" in data:
        base["operating"].update(data["operating"])
    return base


def compute_project(project: dict[str, Any]) -> tuple[MachineResult, Trace]:
    cat = catalog()
    g = project["geometry"]
    op = project["operating"]
    magnet = cat.magnet(g["magnet_id"])
    steel = cat.steel(g["steel_id"])
    wire = cat.wire(g["wire_id"])
    winding = compute_winding(
        int(g["slots"]),
        int(g["poles"]),
        int(g.get("layers", 2)),
        int(g.get("coil_span", 1)),
        int(g.get("turns_per_coil", 1)),
        int(g.get("parallel_paths", 1)),
        str(g.get("connection", "Y")),
        float(g.get("skew_slots", 0)),
    )
    sources = [project.get("source", "")]
    common = dict(
        winding=winding,
        slots=int(g["slots"]),
        poles=int(g["poles"]),
        layers=int(g.get("layers", 2)),
        coil_span=int(g.get("coil_span", 1)),
        turns_per_coil=int(g.get("turns_per_coil", 1)),
        parallel_paths=int(g.get("parallel_paths", 1)),
        connection=str(g.get("connection", "Y")),
        magnet=magnet,
        steel=steel,
        wire=wire,
        strands=int(g.get("strands", 1)),
        current_a=float(op["current_a"]),
        speed_rpm=float(op["speed_rpm"]),
        temp_cu=float(op.get("temp_copper_C", 80)),
        temp_magnet=float(op.get("temp_magnet_C", 60)),
        sources=sources,
    )
    if project["machine_type"] == "axial":
        machine = analyse_axial(
            **common,
            outer_d_m=float(g["outer_d_mm"]) * 1e-3,
            inner_d_m=float(g["inner_d_mm"]) * 1e-3,
            magnet_thickness_m=float(g["magnet_thickness_mm"]) * 1e-3,
            airgap_m=float(g["airgap_mm"]) * 1e-3,
            stator_thickness_m=float(g["stator_thickness_mm"]) * 1e-3,
            rotor_yoke_m=float(g["rotor_yoke_mm"]) * 1e-3,
            slot_depth_m=float(g.get("slot_depth_mm", 11)) * 1e-3,
            slot_width_m=float(g.get("slot_width_mm", 6)) * 1e-3,
            pole_arc_frac=float(g.get("pole_arc_frac", 0.7)),
            skew_slots=float(g.get("skew_slots", 0)),
        )
    else:
        machine = analyse_radial(
            **common,
            stator_od_m=float(g["stator_od_mm"]) * 1e-3,
            stator_id_m=float(g["stator_id_mm"]) * 1e-3,
            rotor_od_m=float(g["rotor_od_mm"]) * 1e-3,
            stack_m=float(g["stack_mm"]) * 1e-3,
            airgap_m=float(g["airgap_mm"]) * 1e-3,
            yoke_m=float(g["yoke_mm"]) * 1e-3,
            tooth_width_m=float(g["tooth_width_mm"]) * 1e-3,
            slot_opening_m=float(g.get("slot_opening_mm", 3)) * 1e-3,
            magnet_thickness_m=float(g["magnet_thickness_mm"]) * 1e-3,
            magnet_width_m=float(g["magnet_width_mm"]) * 1e-3,
            skew_slots=float(g.get("skew_slots", 0)),
        )
    trace = simulate(machine)
    return machine, trace
