from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from core.paths import data_dir

MU0 = 4e-7 * 3.141592653589793
RHO_CU_20 = 1.724e-8
ALPHA_CU = 0.00393
DENSITY_CU = 8960.0


@dataclass
class MagnetGrade:
    id: str
    name: str
    Br_T: float
    HcB_kAm: float
    HcJ_kAm: float
    BHmax_kJm3: float
    alpha_Br_pct_per_C: float
    alpha_HcJ_pct_per_C: float
    Tmax_C: float
    density_kg_m3: float
    mur: float
    manufacturer: str
    document: str
    url: str = ""
    checked: str = ""

    def Br_at(self, temp_C: float) -> float:
        return self.Br_T * (1.0 + self.alpha_Br_pct_per_C / 100.0 * (temp_C - 20.0))


@dataclass
class MagnetShape:
    id: str
    name: str
    kind: str
    length_mm: float
    width_mm: float
    thickness_mm: float
    manufacturer: str
    document: str
    checked: str = ""


@dataclass
class Wire:
    id: str
    name: str
    d_bare_mm: float
    d_grade2_max_mm: float
    R20_ohm_per_m: float
    standard: str
    manufacturer: str
    document: str
    url: str = ""
    checked: str = ""

    @property
    def area_m2(self) -> float:
        d = self.d_bare_mm * 1e-3
        return 3.141592653589793 * d * d / 4.0


@dataclass
class Steel:
    id: str
    name: str
    thickness_mm: float
    P15_50_W_kg_typical: float
    P15_50_W_kg_max: float
    density_kg_m3: float
    stacking_factor: float
    manufacturer: str
    document: str
    url: str = ""
    checked: str = ""


class Catalog:
    def __init__(self, path: Path | None = None) -> None:
        raw = json.loads((path or data_dir() / "materials.json").read_text(encoding="utf-8"))
        self.magnets = {m["id"]: MagnetGrade(**{k: m[k] for k in MagnetGrade.__dataclass_fields__ if k in m}) for m in raw["magnets"]}
        self.shapes = {m["id"]: MagnetShape(**{k: m[k] for k in MagnetShape.__dataclass_fields__ if k in m}) for m in raw["magnet_shapes"]}
        self.wires = {m["id"]: Wire(**{k: m[k] for k in Wire.__dataclass_fields__ if k in m}) for m in raw["wires"]}
        self.steels = {m["id"]: Steel(**{k: m[k] for k in Steel.__dataclass_fields__ if k in m}) for m in raw["steels"]}
        self.presets = json.loads((data_dir() / "presets.json").read_text(encoding="utf-8"))

    def magnet(self, ident: str) -> MagnetGrade:
        return self.magnets[ident]

    def wire(self, ident: str) -> Wire:
        return self.wires[ident]

    def steel(self, ident: str) -> Steel:
        return self.steels[ident]

    def shape(self, ident: str) -> MagnetShape | None:
        return self.shapes.get(ident)


_CATALOG: Catalog | None = None


def catalog() -> Catalog:
    global _CATALOG
    if _CATALOG is None:
        _CATALOG = Catalog()
    return _CATALOG
