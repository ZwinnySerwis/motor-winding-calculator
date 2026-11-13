from core.project import compute_project, default_project, load_preset


def test_radial_preset_runs():
    machine, trace = compute_project(default_project())
    assert machine.kind == "radial"
    assert machine.winding.slots == 12
    assert abs(machine.winding.kw1 - 0.933) < 0.01
    assert 0.4 < machine.Bg < 1.2
    assert machine.ke_Vs_per_rad > 0
    assert machine.kt_Nm_per_Apeak > 0
    assert machine.R_hot > 0
    assert len(trace.ia) > 100
    assert trace.torque.mean() > 0


def test_axial_preset_runs():
    machine, trace = compute_project(load_preset("axial_torus_18_6"))
    assert machine.kind == "axial"
    assert machine.winding.slots == 18
    assert machine.winding.poles == 6
    assert machine.Bg > 0.3
    assert machine.ke_Vs_per_rad > 0
    assert len(trace.B_gap) == 360
