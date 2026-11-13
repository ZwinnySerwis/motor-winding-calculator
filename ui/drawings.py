"""Analytical machine drawings and air-gap field map (not FEA)."""

from __future__ import annotations

import math

from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QColor, QFont, QPainter, QPainterPath, QPen
from PySide6.QtWidgets import QWidget

from core.magnetic import MachineResult
from core.simulate import Trace

PHASE = {"A": QColor("#e74c3c"), "B": QColor("#3498db"), "C": QColor("#27ae60")}


def _b_color(b: float, bmax: float) -> QColor:
    if bmax <= 1e-9:
        return QColor(200, 200, 200)
    x = max(-1.0, min(1.0, b / bmax))
    if x >= 0:
        return QColor(int(255 * x), 40, 40)
    return QColor(40, 80, int(255 * (-x)))


class MachineCanvas(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.machine: MachineResult | None = None
        self.trace: Trace | None = None
        self.rotor_deg = 0.0
        self.mode = "radial"
        self.setMinimumSize(420, 420)

    def set_data(self, machine: MachineResult | None, trace: Trace | None, rotor_deg: float) -> None:
        self.machine = machine
        self.trace = trace
        self.rotor_deg = rotor_deg
        if machine:
            self.mode = machine.kind
        self.update()

    def paintEvent(self, _event) -> None:
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.fillRect(self.rect(), QColor("#f4f1ea"))
        if self.machine is None:
            painter.drawText(self.rect(), Qt.AlignCenter, "Naciśnij Licz, aby narysować maszynę.")
            return
        if self.mode == "axial":
            self._paint_axial(painter)
        else:
            self._paint_radial(painter)
        painter.setPen(QColor("#333"))
        painter.setFont(QFont("Segoe UI", 8))
        painter.drawText(8, 16, "Mapa B — model analityczny (nie MES)")

    def _paint_radial(self, p: QPainter) -> None:
        m = self.machine
        g = m.geometry
        side = min(self.width(), self.height()) - 24
        cx, cy = self.width() / 2, self.height() / 2 + 8
        od = g["stator_od_m"]
        scale = side / od
        r_out = g["stator_od_m"] / 2 * scale
        r_bore = g["stator_id_m"] / 2 * scale
        r_rot = g["rotor_od_m"] / 2 * scale
        r_yoke = r_out - g["yoke_m"] * scale
        r_mag = r_rot - g["magnet_thickness_m"] * scale

        p.setPen(QPen(QColor("#444"), 1))
        p.setBrush(QColor("#c5cdd6"))
        p.drawEllipse(QPointF(cx, cy), r_out, r_out)
        p.setBrush(QColor("#f4f1ea"))
        p.drawEllipse(QPointF(cx, cy), r_bore, r_bore)

        slots = m.winding.slots
        poles = m.winding.poles
        scheme = m.winding.scheme
        for i in range(slots):
            a0 = -math.pi / 2 + 2 * math.pi * i / slots
            a1 = a0 + 2 * math.pi / slots
            path = QPainterPath()
            path.moveTo(cx + r_bore * math.cos(a0), cy + r_bore * math.sin(a0))
            path.lineTo(cx + r_yoke * math.cos(a0), cy + r_yoke * math.sin(a0))
            path.lineTo(cx + r_yoke * math.cos(a1), cy + r_yoke * math.sin(a1))
            path.lineTo(cx + r_bore * math.cos(a1), cy + r_bore * math.sin(a1))
            path.closeSubpath()
            p.setBrush(QColor("#9aa7b5"))
            p.setPen(QPen(QColor("#333"), 0.6))
            p.drawPath(path)
            mid = (a0 + a1) / 2
            rc = (r_bore + r_yoke) / 2
            letter = scheme[i]
            p.setBrush(PHASE.get(letter.upper(), QColor("gray")))
            p.drawEllipse(QPointF(cx + rc * math.cos(mid), cy + rc * math.sin(mid)), 6, 6)

        p.setBrush(QColor("#7f8c8d"))
        p.setPen(Qt.NoPen)
        p.drawEllipse(QPointF(cx, cy), r_mag, r_mag)

        rot = math.radians(self.rotor_deg)
        pole_pitch = 2 * math.pi / poles
        half = m.pole_arc_frac * pole_pitch / 2
        bmax = max(abs(x) for x in (self.trace.B_gap if self.trace else [m.Bg])) or 1
        for i in range(poles):
            a_c = -math.pi / 2 + i * pole_pitch + rot
            path = QPainterPath()
            path.moveTo(cx + r_mag * math.cos(a_c - half), cy + r_mag * math.sin(a_c - half))
            path.arcTo(QRectF(cx - r_rot, cy - r_rot, 2 * r_rot, 2 * r_rot),
                       math.degrees(-(a_c - half)), -math.degrees(2 * half))
            path.arcTo(QRectF(cx - r_mag, cy - r_mag, 2 * r_mag, 2 * r_mag),
                       math.degrees(-(a_c + half)), math.degrees(2 * half))
            path.closeSubpath()
            p.setBrush(_b_color(m.Bg if i % 2 == 0 else -m.Bg, bmax))
            p.setPen(QPen(QColor("#222"), 0.8))
            p.drawPath(path)

        # Air-gap colour ring
        if self.trace:
            n = len(self.trace.B_gap)
            r1, r2 = r_bore + 1, r_rot
            for i, b in enumerate(self.trace.B_gap):
                a0 = -math.pi / 2 + 2 * math.pi * i / n
                a1 = a0 + 2 * math.pi / n
                path = QPainterPath()
                path.moveTo(cx + r2 * math.cos(a0), cy + r2 * math.sin(a0))
                path.lineTo(cx + r1 * math.cos(a0), cy + r1 * math.sin(a0))
                path.lineTo(cx + r1 * math.cos(a1), cy + r1 * math.sin(a1))
                path.lineTo(cx + r2 * math.cos(a1), cy + r2 * math.sin(a1))
                path.closeSubpath()
                p.setPen(Qt.NoPen)
                p.setBrush(_b_color(b, bmax))
                p.drawPath(path)

        p.setPen(QPen(QColor("#111"), 1.6))
        p.setBrush(Qt.NoBrush)
        # Flux path arrows
        p.drawText(8, self.height() - 36, f"Bg={m.Bg:.2f} T  Bt={m.Bt:.2f} T  By={m.By:.2f} T  Bm={m.Bm:.2f} T")
        p.drawText(8, self.height() - 18, "Strzałki: magnes → szczelina → ząb → jarzmo (analitycznie)")

    def _paint_axial(self, p: QPainter) -> None:
        m = self.machine
        g = m.geometry
        w, h = self.width(), self.height()
        # Left: face. Right: meridional section.
        self._axial_face(p, QRectF(8, 24, w * 0.55 - 12, h - 48), m, g)
        self._axial_section(p, QRectF(w * 0.55, 24, w * 0.45 - 12, h - 48), m, g)

    def _axial_face(self, p: QPainter, rect: QRectF, m: MachineResult, g: dict) -> None:
        cx, cy = rect.center().x(), rect.center().y()
        Do, Di = g["outer_d_m"], g["inner_d_m"]
        scale = min(rect.width(), rect.height()) / Do * 0.9
        Ro, Ri = Do / 2 * scale, Di / 2 * scale
        p.setPen(QPen(QColor("#333"), 1))
        p.setBrush(QColor("#c5cdd6"))
        p.drawEllipse(QPointF(cx, cy), Ro, Ro)
        p.setBrush(QColor("#f4f1ea"))
        p.drawEllipse(QPointF(cx, cy), Ri, Ri)
        poles = m.winding.poles
        rot = math.radians(self.rotor_deg)
        half = m.pole_arc_frac * math.pi / poles
        bmax = m.Bg or 1
        for i in range(poles):
            a = -math.pi / 2 + i * 2 * math.pi / poles + rot
            path = QPainterPath()
            path.moveTo(cx + Ri * math.cos(a - half), cy + Ri * math.sin(a - half))
            path.arcTo(QRectF(cx - Ro, cy - Ro, 2 * Ro, 2 * Ro), math.degrees(-(a - half)), -math.degrees(2 * half))
            path.arcTo(QRectF(cx - Ri, cy - Ri, 2 * Ri, 2 * Ri), math.degrees(-(a + half)), math.degrees(2 * half))
            path.closeSubpath()
            p.setBrush(_b_color(m.Bg if i % 2 == 0 else -m.Bg, bmax))
            p.setPen(QPen(QColor("#222"), 0.7))
            p.drawPath(path)
        slots = m.winding.slots
        scheme = m.winding.scheme
        rm = (Ro + Ri) / 2
        for i, letter in enumerate(scheme):
            a = -math.pi / 2 + 2 * math.pi * (i + 0.5) / slots
            p.setBrush(PHASE.get(letter.upper(), QColor("gray")))
            p.setPen(Qt.NoPen)
            p.drawEllipse(QPointF(cx + rm * math.cos(a), cy + rm * math.sin(a)), 5, 5)
        p.setPen(QColor("#333"))
        p.drawText(rect.left() + 4, rect.top() + 14, "Widok osiowy (tarcza)")

    def _axial_section(self, p: QPainter, rect: QRectF, m: MachineResult, g: dict) -> None:
        layers = [
            ("jarzmo wirnika", g["rotor_yoke_m"], QColor("#7f8c8d")),
            ("magnes", g["magnet_thickness_m"], QColor("#c0392b")),
            ("szczelina", g["airgap_m"], QColor("#f1c40f")),
            ("stojan", g["stator_thickness_m"], QColor("#9aa7b5")),
            ("szczelina", g["airgap_m"], QColor("#f1c40f")),
            ("magnes", g["magnet_thickness_m"], QColor("#2980b9")),
            ("jarzmo wirnika", g["rotor_yoke_m"], QColor("#7f8c8d")),
        ]
        total = sum(h for _, h, _ in layers) or 1
        x0 = rect.left() + 40
        y0 = rect.top() + 30
        width = rect.width() - 70
        height = rect.height() - 70
        y = y0
        labels_b = {
            "magnes": m.Bm,
            "szczelina": m.Bg,
            "stojan": m.Bt,
            "jarzmo wirnika": m.By,
        }
        for name, thk, color in layers:
            hpx = thk / total * height
            p.setBrush(color)
            p.setPen(QPen(QColor("#222"), 1))
            p.drawRect(QRectF(x0, y, width, hpx))
            p.setPen(QColor("#111"))
            p.drawText(QRectF(x0, y, width, hpx), Qt.AlignCenter, f"{name}  B={labels_b.get(name, 0):.2f} T")
            y += hpx
        p.setPen(QPen(QColor("#111"), 2))
        p.drawLine(QPointF(x0 + width / 2, y0), QPointF(x0 + width / 2, y0 + height))
        p.drawText(rect.left() + 4, rect.top() + 14, "Przekrój południkowy TORUS")
        p.drawText(rect.left() + 4, rect.bottom() - 6, f"Bg={m.Bg:.2f} T  (analitycznie)")
