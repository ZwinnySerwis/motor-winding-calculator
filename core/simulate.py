"""Time-domain traces for the oscilloscope.

Current-source dq with id = 0, plus harmonic torque from kw(ν) and cogging
at LCM(Q, 2p). Not a circuit solver — a visualisation of the analytical model.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from core.magnetic import MachineResult, gap_B_waveform


@dataclass
class Trace:
    t_ms: np.ndarray
    elec_deg: np.ndarray
    ia: np.ndarray
    ib: np.ndarray
    ic: np.ndarray
    ea: np.ndarray
    va: np.ndarray
    torque: np.ndarray
    speed_rpm: np.ndarray
    p_cu: np.ndarray
    p_fe: np.ndarray
    p_mech: np.ndarray
    B_gap: list[float]
    rotor_angle: float


def simulate(machine: MachineResult, n_samples: int = 720, periods: float = 2.0) -> Trace:
    p = machine.winding.pole_pairs
    rpm = machine.speed_rpm
    omega_m = rpm * 2 * math.pi / 60.0
    omega_e = p * omega_m
    T_elec = 1.0 / max(machine.freq_hz, 1e-6)
    t = np.linspace(0, periods * T_elec, n_samples, endpoint=False)
    th_e = omega_e * t
    Ipk = machine.I_rms * math.sqrt(2)
    ia = Ipk * np.sin(th_e)
    ib = Ipk * np.sin(th_e - 2 * math.pi / 3)
    ic = Ipk * np.sin(th_e + 2 * math.pi / 3)
    ea = machine.ke_Vs_per_rad * omega_m * np.sin(th_e)
    # Add 5th/7th EMF from winding-factor spectrum
    kw = machine.winding.kw
    kw1 = kw.get(p, machine.winding.kw1) or 1.0
    for n, kwn in kw.items():
        h = n / p
        if h not in (5.0, 7.0) or kwn < 0.02:
            continue
        ea = ea + machine.ke_Vs_per_rad * omega_m * (kwn / kw1) / h * np.sin(h * th_e)
    va = ea + machine.R_hot * ia
    T0 = machine.kt_Nm_per_Apeak * Ipk
    nc = machine.winding.cogging_steps
    ripple = 0.04 * np.cos(6 * th_e)
    torque = T0 * (1.0 + 0.04 * np.cos(nc * omega_m * t) + ripple)
    p_cu = np.full_like(t, machine.P_cu)
    p_fe = np.full_like(t, machine.P_fe)
    p_mech = torque * omega_m
    rotor = float(th_e[-1] / p) if len(th_e) else 0.0
    B = gap_B_waveform(
        machine.winding.poles, machine.pole_arc_frac, machine.Bg, 360, rotor,
    )
    return Trace(
        t_ms=t * 1e3,
        elec_deg=np.degrees(th_e),
        ia=ia,
        ib=ib,
        ic=ic,
        ea=ea,
        va=va,
        torque=torque,
        speed_rpm=np.full_like(t, rpm),
        p_cu=p_cu,
        p_fe=p_fe,
        p_mech=p_mech,
        B_gap=B,
        rotor_angle=rotor,
    )
