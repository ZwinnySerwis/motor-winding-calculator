from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtGui import QAction
from PySide6.QtWidgets import (
    QComboBox,
    QDoubleSpinBox,
    QFileDialog,
    QFormLayout,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QScrollArea,
    QSlider,
    QSpinBox,
    QSplitter,
    QTableWidget,
    QTableWidgetItem,
    QTextEdit,
    QVBoxLayout,
    QWidget,
    QCheckBox,
)
import pyqtgraph as pg

from core.materials import catalog
from core.project import compute_project, default_project, load_preset, load_project, save_project
from ui.drawings import MachineCanvas


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("PMSM Winding & Machine Calculator")
        self.resize(1400, 900)
        self.project = default_project()
        self.machine = None
        self.trace = None
        self.cat = catalog()
        self._build()
        self._load_project_into_form(self.project)
        self.recalculate()

    def _build(self) -> None:
        root = QWidget()
        self.setCentralWidget(root)
        split = QSplitter(Qt.Horizontal)
        layout = QHBoxLayout(root)
        layout.addWidget(split)

        split.addWidget(self._left_panel())
        mid = QWidget()
        mid_l = QVBoxLayout(mid)
        self.canvas = MachineCanvas()
        mid_l.addWidget(self.canvas, 3)
        rotor_row = QHBoxLayout()
        rotor_row.addWidget(QLabel("Wirnik"))
        self.rotor_slider = QSlider(Qt.Horizontal)
        self.rotor_slider.setRange(0, 360)
        self.rotor_slider.valueChanged.connect(self._on_rotor)
        rotor_row.addWidget(self.rotor_slider)
        mid_l.addLayout(rotor_row)
        mid_l.addWidget(self._scope(), 2)
        split.addWidget(mid)
        split.addWidget(self._right_panel())
        split.setStretchFactor(0, 0)
        split.setStretchFactor(1, 1)
        split.setStretchFactor(2, 0)
        split.setSizes([340, 740, 320])

        file_menu = self.menuBar().addMenu("Plik")
        act_open = QAction("Otwórz JSON…", self)
        act_save = QAction("Zapisz JSON…", self)
        act_open.triggered.connect(self._open)
        act_save.triggered.connect(self._save)
        file_menu.addAction(act_open)
        file_menu.addAction(act_save)

    def _left_panel(self) -> QWidget:
        box = QWidget()
        box.setMinimumWidth(310)
        col = QVBoxLayout(box)
        col.addWidget(QLabel("Typ maszyny"))
        self.type_box = QComboBox()
        self.type_box.addItem("Promieniowy SPM", "radial")
        self.type_box.addItem("Osiowy TORUS", "axial")
        self.type_box.currentIndexChanged.connect(self._on_type)
        col.addWidget(self.type_box)

        col.addWidget(QLabel("Preset"))
        self.preset_box = QComboBox()
        for pid, preset in self.cat.presets.items():
            self.preset_box.addItem(preset["name"], pid)
        self.preset_box.currentIndexChanged.connect(self._on_preset)
        col.addWidget(self.preset_box)

        restore = QPushButton("Przywróć wartości presetu")
        restore.clicked.connect(self._restore_preset)
        col.addWidget(restore)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        form_host = QWidget()
        self.form = QFormLayout(form_host)
        scroll.setWidget(form_host)
        col.addWidget(scroll, 1)

        self.fields = {}
        def spin(name, lo, hi, step=1, decimals=0, suffix=""):
            w = QDoubleSpinBox() if decimals else QSpinBox()
            if decimals:
                w.setDecimals(decimals)
            w.setSingleStep(step)
            w.setRange(lo, hi)
            if suffix:
                w.setSuffix(suffix)
            self.fields[name] = w
            return w

        self.form.addRow("Żłobki Q", spin("slots", 3, 96, 3))
        self.form.addRow("Bieguny 2p", spin("poles", 2, 64, 2))
        self.form.addRow("Warstwy", spin("layers", 1, 2, 1))
        self.form.addRow("Skok cewki", spin("coil_span", 1, 24, 1))
        self.form.addRow("Zwoje / cewka", spin("turns_per_coil", 1, 400, 1))
        self.form.addRow("Drogi równoległe", spin("parallel_paths", 1, 12, 1))
        self.conn = QComboBox()
        self.conn.addItems(["Y", "D"])
        self.form.addRow("Połączenie", self.conn)

        self.radial_labels = []
        def rrow(label, key, *a, **k):
            w = spin(key, *a, **k)
            lab = QLabel(label)
            self.form.addRow(lab, w)
            self.radial_labels.append((lab, w))

        rrow("Stojan Øz mm", "stator_od_mm", 20, 800, 1, 1, " mm")
        rrow("Stojan Øw mm", "stator_id_mm", 10, 700, 1, 1, " mm")
        rrow("Wirnik Øz mm", "rotor_od_mm", 10, 700, 1, 1, " mm")
        rrow("Pakiet mm", "stack_mm", 5, 400, 1, 1, " mm")
        rrow("Szczelina mm", "airgap_mm", 0.1, 10, 0.1, 2, " mm")
        rrow("Jarzmo mm", "yoke_mm", 1, 80, 0.5, 1, " mm")
        rrow("Ząb mm", "tooth_width_mm", 1, 80, 0.5, 1, " mm")
        rrow("Otwarcie żłobka mm", "slot_opening_mm", 0.2, 30, 0.1, 1, " mm")
        rrow("Magnes grubość mm", "magnet_thickness_mm", 0.5, 40, 0.1, 1, " mm")
        rrow("Magnes szer. mm", "magnet_width_mm", 1, 80, 0.5, 1, " mm")

        self.axial_labels = []
        def arow(label, key, *a, **k):
            w = spin(key, *a, **k)
            lab = QLabel(label)
            self.form.addRow(lab, w)
            self.axial_labels.append((lab, w))

        arow("Ø zewnętrzna mm", "outer_d_mm", 20, 800, 1, 1, " mm")
        arow("Ø wewnętrzna mm", "inner_d_mm", 10, 700, 1, 1, " mm")
        arow("Grubość stojana mm", "stator_thickness_mm", 2, 80, 0.5, 1, " mm")
        arow("Jarzmo wirnika mm", "rotor_yoke_mm", 1, 40, 0.5, 1, " mm")
        arow("Głęb. żłobka mm", "slot_depth_mm", 1, 40, 0.5, 1, " mm")
        arow("Szer. żłobka mm", "slot_width_mm", 1, 40, 0.5, 1, " mm")
        arow("Łuk bieguna", "pole_arc_frac", 0.3, 0.95, 0.01, 2)

        self.magnet_box = QComboBox()
        for mag in self.cat.magnets.values():
            self.magnet_box.addItem(f"{mag.id}  Br={mag.Br_T:.2f} T", mag.id)
        self.form.addRow("Magnes (gatunek)", self.magnet_box)
        self.shape_box = QComboBox()
        for sh in self.cat.shapes.values():
            self.shape_box.addItem(sh.name, sh.id)
        self.shape_box.currentIndexChanged.connect(self._on_shape)
        self.form.addRow("Kształt magnesu", self.shape_box)
        self.steel_box = QComboBox()
        for st in self.cat.steels.values():
            self.steel_box.addItem(st.name, st.id)
        self.form.addRow("Blacha", self.steel_box)
        self.wire_box = QComboBox()
        for w in self.cat.wires.values():
            self.wire_box.addItem(w.name, w.id)
        self.form.addRow("Przewód IEC", self.wire_box)
        self.form.addRow("Żyły w ręku", spin("strands", 1, 20, 1))

        self.form.addRow("Napięcie V", spin("voltage_v", 1, 800, 1, 1, " V"))
        self.form.addRow("Prędkość rpm", spin("speed_rpm", 50, 20000, 50, 0, " rpm"))
        self.form.addRow("Prąd A rms", spin("current_a", 0.1, 500, 0.1, 1, " A"))
        self.form.addRow("θ miedzi °C", spin("temp_copper_C", 20, 180, 1, 0, " °C"))
        self.form.addRow("θ magnesu °C", spin("temp_magnet_C", 20, 180, 1, 0, " °C"))

        calc = QPushButton("Licz")
        calc.setDefault(True)
        calc.clicked.connect(self.recalculate)
        col.addWidget(calc)
        return box

    def _scope(self) -> QWidget:
        wrap = QWidget()
        lay = QVBoxLayout(wrap)
        lay.setContentsMargins(0, 0, 0, 0)
        self.plot = pg.PlotWidget()
        self.plot.setBackground("#111")
        self.plot.showGrid(x=True, y=True, alpha=0.3)
        self.plot.addLegend()
        self.curves = {
            "ia": self.plot.plot(pen=pg.mkPen("#e74c3c", width=2), name="ia"),
            "ib": self.plot.plot(pen=pg.mkPen("#3498db", width=2), name="ib"),
            "ic": self.plot.plot(pen=pg.mkPen("#2ecc71", width=2), name="ic"),
            "ea": self.plot.plot(pen=pg.mkPen("#f1c40f", width=1.5), name="ea"),
            "va": self.plot.plot(pen=pg.mkPen("#ecf0f1", width=1), name="va"),
            "T": self.plot.plot(pen=pg.mkPen("#9b59b6", width=2), name="T"),
        }
        self.v1 = pg.InfiniteLine(angle=90, movable=True, pen=pg.mkPen("#aaa", style=Qt.DashLine))
        self.v2 = pg.InfiniteLine(angle=90, movable=True, pen=pg.mkPen("#888", style=Qt.DashLine))
        self.plot.addItem(self.v1)
        self.plot.addItem(self.v2)
        lay.addWidget(self.plot)
        row = QHBoxLayout()
        self.checks = {}
        for key, title in (("ia", "ia"), ("ib", "ib"), ("ic", "ic"), ("ea", "SEM"), ("va", "u faz"), ("T", "Moment")):
            cb = QCheckBox(title)
            cb.setChecked(key in ("ia", "T"))
            cb.stateChanged.connect(self._refresh_scope)
            self.checks[key] = cb
            row.addWidget(cb)
        self.x_elec = QCheckBox("oś: stopnie el.")
        self.x_elec.stateChanged.connect(self._refresh_scope)
        row.addWidget(self.x_elec)
        row.addStretch(1)
        lay.addLayout(row)
        return wrap

    def _right_panel(self) -> QWidget:
        box = QWidget()
        box.setMinimumWidth(300)
        col = QVBoxLayout(box)
        col.addWidget(QLabel("Wyniki"))
        self.table = QTableWidget(0, 3)
        self.table.setHorizontalHeaderLabels(["Wielkość", "Wartość", "Uwaga"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        col.addWidget(self.table, 2)
        col.addWidget(QLabel("Cewki (dokument nawojowy)"))
        self.coils = QTableWidget(0, 5)
        self.coils.setHorizontalHeaderLabels(["#", "Faza", "Żłobek +", "Żłobek −", "Zwoje"])
        self.coils.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        col.addWidget(self.coils, 1)
        col.addWidget(QLabel("Źródło presetu / karta"))
        self.source = QTextEdit()
        self.source.setReadOnly(True)
        self.source.setMaximumHeight(140)
        col.addWidget(self.source)
        col.addWidget(QLabel("Ostrzeżenia"))
        self.warn = QTextEdit()
        self.warn.setReadOnly(True)
        self.warn.setMaximumHeight(110)
        col.addWidget(self.warn)
        self.live = QLabel()
        self.live.setWordWrap(True)
        col.addWidget(self.live)
        return box

    def _set_combo(self, box: QComboBox, ident: str) -> None:
        i = box.findData(ident)
        if i >= 0:
            box.setCurrentIndex(i)

    def _load_project_into_form(self, project: dict) -> None:
        g, op = project["geometry"], project["operating"]
        self.type_box.blockSignals(True)
        self.type_box.setCurrentIndex(0 if project["machine_type"] == "radial" else 1)
        self.type_box.blockSignals(False)
        self._set_combo(self.preset_box, project.get("preset_id", "radial_12_10"))
        for key, w in self.fields.items():
            val = g.get(key, op.get(key))
            if val is None:
                continue
            w.setValue(int(val) if isinstance(w, QSpinBox) else float(val))
        self.conn.setCurrentText(g.get("connection", "Y"))
        self._set_combo(self.magnet_box, g.get("magnet_id", "N45"))
        self._set_combo(self.shape_box, g.get("magnet_shape_id", "sato_16x3p5"))
        self._set_combo(self.steel_box, g.get("steel_id", "M250-35A"))
        self._set_combo(self.wire_box, g.get("wire_id", "d0.500"))
        self._toggle_geometry_rows()
        self.source.setPlainText(project.get("source", ""))

    def _read_form(self) -> dict:
        project = self.project
        g, op = project["geometry"], project["operating"]
        project["machine_type"] = self.type_box.currentData()
        for key, w in self.fields.items():
            if key in ("voltage_v", "speed_rpm", "current_a", "temp_copper_C", "temp_magnet_C"):
                op[key] = w.value()
            else:
                g[key] = int(w.value()) if isinstance(w, QSpinBox) else w.value()
        g["connection"] = self.conn.currentText()
        g["magnet_id"] = self.magnet_box.currentData()
        g["magnet_shape_id"] = self.shape_box.currentData()
        g["steel_id"] = self.steel_box.currentData()
        g["wire_id"] = self.wire_box.currentData()
        return project

    def _toggle_geometry_rows(self) -> None:
        axial = self.type_box.currentData() == "axial"
        for lab, w in self.radial_labels:
            lab.setVisible(not axial)
            w.setVisible(not axial)
        for lab, w in self.axial_labels:
            lab.setVisible(axial)
            w.setVisible(axial)

    def _on_type(self) -> None:
        self._toggle_geometry_rows()
        want = self.type_box.currentData()
        for i in range(self.preset_box.count()):
            pid = self.preset_box.itemData(i)
            if self.cat.presets[pid]["machine_type"] == want:
                self.preset_box.setCurrentIndex(i)
                break

    def _on_preset(self) -> None:
        pid = self.preset_box.currentData()
        if not pid:
            return
        self.project = load_preset(pid)
        self._load_project_into_form(self.project)
        self.recalculate()

    def _restore_preset(self) -> None:
        self._on_preset()

    def _on_shape(self) -> None:
        ident = self.shape_box.currentData()
        sh = self.cat.shape(ident) if ident else None
        if not sh:
            return
        if "magnet_thickness_mm" in self.fields:
            self.fields["magnet_thickness_mm"].setValue(sh.thickness_mm)
        if "magnet_width_mm" in self.fields and sh.width_mm:
            self.fields["magnet_width_mm"].setValue(sh.width_mm)

    def _on_rotor(self, value: int) -> None:
        if self.machine and self.trace:
            from core.magnetic import gap_B_waveform
            self.trace.B_gap = gap_B_waveform(
                self.machine.winding.poles, self.machine.pole_arc_frac,
                self.machine.Bg, 360, value * 3.14159265 / 180,
            )
            self.trace.rotor_angle = value * 3.14159265 / 180
            self.canvas.set_data(self.machine, self.trace, value)

    def recalculate(self) -> None:
        self.project = self._read_form()
        try:
            self.machine, self.trace = compute_project(self.project)
        except Exception as exc:
            QMessageBox.warning(self, "Błąd obliczeń", str(exc))
            return
        self.canvas.set_data(self.machine, self.trace, self.rotor_slider.value())
        self._fill_table()
        self._refresh_scope()
        mag = self.cat.magnet(self.project["geometry"]["magnet_id"])
        wire = self.cat.wire(self.project["geometry"]["wire_id"])
        steel = self.cat.steel(self.project["geometry"]["steel_id"])
        src = self.project.get("source", "")
        src += f"\n\nMagnes: {mag.manufacturer} — {mag.document}"
        src += f"\nPrzewód: {wire.manufacturer} — {wire.document}"
        src += f"\nBlacha: {steel.manufacturer} — {steel.document}"
        self.source.setPlainText(src)
        self.warn.setPlainText("\n".join(self.machine.warnings) or "Brak ostrzeżeń.")
        self.live.setText(
            f"n = {self.machine.speed_rpm:.0f} rpm   "
            f"T = {self.machine.T_mean:.3f} N·m   "
            f"Pcu = {self.machine.P_cu:.1f} W   "
            f"Pfe = {self.machine.P_fe:.1f} W   "
            f"η = {self.machine.efficiency*100:.1f} %"
        )

    def _fill_table(self) -> None:
        rows = self.machine.metrics_rows()
        w = self.machine.winding
        rows = [
            ("schemat", w.scheme, "gwiazda żłobków"),
            ("q", f"{w.q:.3f}", ""),
            ("cogging LCM", str(w.cogging_steps), "kroków / obrót"),
        ] + rows
        self.table.setRowCount(len(rows))
        for i, (a, b, c) in enumerate(rows):
            self.table.setItem(i, 0, QTableWidgetItem(a))
            self.table.setItem(i, 1, QTableWidgetItem(b))
            self.table.setItem(i, 2, QTableWidgetItem(c))
        coils = self.machine.winding.coils
        self.coils.setRowCount(len(coils))
        for i, c in enumerate(coils):
            go, ret = (c.go_slot, c.return_slot) if c.polarity > 0 else (c.return_slot, c.go_slot)
            for col, val in enumerate((str(c.index), c.phase, str(go), str(ret), str(c.turns))):
                self.coils.setItem(i, col, QTableWidgetItem(val))

    def _refresh_scope(self) -> None:
        if self.trace is None:
            return
        x = self.trace.elec_deg if self.x_elec.isChecked() else self.trace.t_ms
        data = {
            "ia": self.trace.ia,
            "ib": self.trace.ib,
            "ic": self.trace.ic,
            "ea": self.trace.ea,
            "va": self.trace.va,
            "T": self.trace.torque,
        }
        for key, curve in self.curves.items():
            if self.checks[key].isChecked():
                curve.setData(x, data[key])
                curve.show()
            else:
                curve.clear()
        self.plot.setLabel("bottom", "stopnie elektryczne" if self.x_elec.isChecked() else "czas ms")
        if len(x):
            self.v1.setValue(x[len(x) // 4])
            self.v2.setValue(x[len(x) // 2])

    def _open(self) -> None:
        path, _ = QFileDialog.getOpenFileName(self, "Otwórz projekt", "", "JSON (*.json)")
        if not path:
            return
        self.project = load_project(Path(path))
        self._load_project_into_form(self.project)
        self.recalculate()

    def _save(self) -> None:
        self.project = self._read_form()
        path, _ = QFileDialog.getSaveFileName(self, "Zapisz projekt", "projekt.json", "JSON (*.json)")
        if not path:
            return
        save_project(Path(path), self.project)
