"""Golden winding-factor cases from literature and the original calculator."""

import math

from core.winding import assign_slot_star, compute_winding


def test_12_10_scheme_and_kw():
    scheme, distributed, balanced = assign_slot_star(12, 10)
    assert scheme == "AabBCcaABbcC"
    assert not distributed
    assert balanced
    w = compute_winding(12, 10, layers=2, coil_span=1, turns_per_coil=30)
    assert w.working_order == 5
    assert abs(w.kw[5] - 0.933) < 0.002
    assert w.cogging_steps == 60
    assert w.q == 0.4
    assert len(w.coils) == 12
    assert w.turns_per_phase == 4 * 30


def test_12_8_kw():
    w = compute_winding(12, 8)
    assert abs(w.kw[w.working_order] - 0.866) < 0.01
    assert w.scheme
    assert w.balanced


def test_12_14_kw_like_12_10():
    w = compute_winding(12, 14)
    assert abs(w.kw[w.working_order] - 0.933) < 0.01


def test_18_16_concentrated():
    w = compute_winding(18, 16)
    assert not w.distributed
    assert w.balanced
    assert w.kw[w.working_order] > 0.9


def test_36_6_distributed_full_pitch():
    w = compute_winding(36, 6, coil_span=6)
    assert w.distributed
    assert abs(w.q - 2.0) < 1e-9
    # Classical full-pitch q=2: kd = 0.9659, kp = 1, kw ≈ 0.966 (Pyrhönen ch. 2)
    assert abs(w.kp[w.working_order] - 1.0) < 0.02
    assert abs(w.kw[w.working_order] - 0.966) < 0.01


def test_48_8_distributed():
    w = compute_winding(48, 8, coil_span=6)
    assert w.distributed
    assert abs(w.q - 2.0) < 1e-9
    assert w.kw[w.working_order] > 0.9
    assert w.cogging_steps == math.lcm(48, 8)


def test_rejects_bad_inputs():
    import pytest

    with pytest.raises(ValueError):
        compute_winding(10, 8)
    with pytest.raises(ValueError):
        compute_winding(12, 7)
    with pytest.raises(ValueError):
        compute_winding(12, 12)
