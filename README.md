# Motor Winding Calculator

Desktop **PMSM** tool (radial surface-magnet and axial TORUS) for winding layout, catalog materials, an analytical field map, and an oscilloscope of the operating point. It is a fast, cited design aid — not a replacement for Ansys / FEMM.

Original slot-star algorithm © 2010 [Felix Niessen](https://caendle.de) (Bewicklungsrechner XL), GNU GPL v3. This repository is a derived work under the same licence.

## Run from source

Python 3.11+ on Windows:

```bash
py -m pip install -r requirements.txt
py app.py
```

A new project opens as a working 12-slot / 10-pole example (Sato et al., *Machines* 2023, Table 1). Change slots, poles, voltage or speed and press **Licz**. Geometry, magnet grade, lamination and wire already have sources on the right.

## Build the Windows exe

```bash
py -m pip install -r requirements.txt
py -m PyInstaller --noconfirm --windowed --name PMSM-Calculator --add-data "data;data" app.py
```

The exe is `dist\PMSM-Calculator\PMSM-Calculator.exe`.

## What the numbers are

| Block | Source |
| --- | --- |
| Slot-star, kw DFT | Bewicklungsrechner XL; 12/10 kw = 0.933 (Cros & Viarouge 2002) |
| kp, kd, Carter, Bg circuit | Pyrhönen, Jokinen, Hrabovcová, *Design of Rotating Electrical Machines* |
| ke, kt | Hendershot & Miller / Hanselman |
| Axial TORUS geometry | Mahmoudi et al., PIER 129 (2012), Gieras sizing equations |
| NdFeB N35–N52 | Arnold Magnetic Technologies grade sheets |
| Magnet wire | Elektrisola IEC 60317 table |
| M250-35A / M400-50A | Cogent / Tata Steel SURA catalogs |

The coloured air-gap map is the analytical rectangular-magnet plateau, not a finite-element mesh.

Induction machines are out of scope.

## Tests

```bash
py -m pytest tests -q
```
