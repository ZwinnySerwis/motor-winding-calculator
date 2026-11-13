# Handoff

## 2026-11-13

### For the next agent
Read this file first — **only the latest dated section** is current. Older sections are history. Then skim the files in **Read next**. Do not re-litigate closed decisions. Continue from **Next**.

### Goal
Aplikacja desktopowa (exe, Python + PySide6) do projektowania PMSM promieniowych i osiowych TORUS: uzwojenie, katalog materiałów ze źródłem, presety z literatury, mapa B z modelu analitycznego i oscyloskop punktu pracy. Nie zastępuje Ansysa.

### Closed decisions
- Silnik indukcyjny całkowicie poza zakresem.
- Aplikacja to plik exe / `py app.py`, nie strona w przeglądarce. Stary `index.html` zostaje w repo jako Bewicklungsrechner XL.
- Dokumentacja wewnętrzna Tesli nie wchodzi do kodu ani do repo. Źródła: podręczniki (Pyrhönen, Hendershot/Miller, Hanselman, Gieras) i karty producentów.
- Mapa pola to plateau magnesu prostokątnego, nie siatka MES.
- GPL-3, dzieło pochodne Bewicklungsrechner XL (Felix Niessen, 2010).
- Dwa typy: radialny SPM i osiowy TORUS (dwa wirniki, jeden stojan). Inne topologie osiowe czekają.
- Nowy projekt otwiera się z wypełnionym presetem 12/10.

### Done
- Silnik uzwojeń: `core/winding.py` — gwiazda żłobków, kp/kd/kw, tabela cewek. Testy 12/10 (kw=0.933), 12/8, 12/14, 18/16, 36/6, 48/8 w `tests/test_winding.py`.
- Katalog: `data/materials.json` (Arnold N35–N52, Elektrisola IEC 60317, Cogent M250-35A / M400-50A) i `data/presets.json` (Sato 12/10; Mahmoudi/Gieras TORUS 18/6).
- Model: `core/radial.py`, `core/axial.py`, `core/magnetic.py`, `core/simulate.py`, `core/project.py`.
- UI: `app.py`, `ui/main_window.py`, `ui/drawings.py` — formularz, rysunek, suwak wirnika, oscyloskop pyqtgraph, tabela cewek, JSON zapisz/otwórz.
- Exe: `dist/PMSM-Calculator/PMSM-Calculator.exe` (build lokalny, folder `dist/` w `.gitignore`). Spec: `PMSM-Calculator.spec`.
- 9 testów pytest przechodzi.

### Next
1. W UI nie jest podpięta reguła skalowania ze `data/presets.json` (`g_over_D`, `lm_over_g`, …) — po zmianie średnicy szczelina/magnes/jarzmo powinny iść ze stosunków presetu, dopóki pole nie jest nadpisane.
2. Cieńszy exe: `--collect-submodules pyqtgraph` wciągnął `pyqtgraph.examples` (~179 MB). Zbudować bez tego.
3. Dopracować rysunki (łuki magnesów Qt `arcTo` mogą być przekręcone) i ewentualnie porównać dwa projekty JSON obok siebie.
4. Czekać na feedback użytkownika (Michał) z uruchomionego exe.

### Read next
- `README.md` — jak uruchomić i skąd liczby
- `core/winding.py` — silnik uzwojeń i DFT kw
- `core/project.py` — jedyny entry point obliczeń
- `data/presets.json` / `data/materials.json` — presety i cytowania
- `ui/main_window.py` — okno i formularz
- `app.py` — start

### Git
- Branch: `main`
- Last commit: `1019042` Add desktop PMSM calculator with cited presets and handoff briefing.
- Remote: `origin` = https://github.com/ZwinnySerwis/motor-winding-calculator.git — push w tym handoffie

### Paste prompt
> Przeczytaj @HANDOFF.md — tylko najnowszy wpis (ostatni, z datą) jest aktualny; starsze to historia. Potem otwórz pliki z sekcji Read next i krótko potwierdź, że rozumiesz stan. Nie powtarzaj zamkniętych decyzji. Zaczynamy od: podpiąć w UI regułę skalowania średnicy z `data/presets.json` (szczelina, grubość magnesu, jarzmo idą ze stosunków presetu, dopóki pole nie jest nadpisane).
