# Prompts für Version 1.1.2: Layout, Navigation, Feinschliff

## Vorbereitung

- `SPEC.md` durch die aktuelle Version ersetzen und committen.
- Prompt A und B nacheinander verwenden, nicht gleichzeitig. Nach jedem Prompt prüfen und committen.

---

## Prompt A: Layout und Navigation

```
Lies SPEC.md Abschnitt 9, besonders „Layout im Detail“ und „Start und Navigation“. Setze das um:

1. Zentrierter Spielblock mit Maximalbreite, Statusleiste über die volle Blockbreite, darunter Plot links und rechte Spalte, beide oben bündig und gleich hoch, ohne große Leerräume rechts.
2. Fester Bereich für die Figur auf Basis der Ruhe-Pose. Höhere Posen dürfen nach SPEC Abschnitt 9 „Layout im Detail“ begrenzt herausragen und Rahmen überlappen, aber nie Text, Zahlen, Icons oder Bedienelemente verdecken und nie abgeschnitten werden.
3. Button „Menü“ in der Statusleiste mit Rückfrage in der Oberfläche (kein confirm()).
4. Endbildschirm als eigene Ansicht ohne Statusleiste und Plot, mit „Neues Spiel“ und „Hauptmenü“.
5. Button „Schätzung bestätigen“ nur so breit wie sein Inhalt.
6. Die Auflösung muss bei 1366 × 650 ohne eigene Scrollleiste passen, auch im Simpson-Fall (kompakter setzen, nichts weglassen).

Prüfe danach selbst bei 1366 × 650, 1536 × 730, 1920 × 950, 1280 × 720, 1024 × 768, iPad hoch und quer sowie 390 × 750. Halte an und nenne mir, was ich prüfen soll.
```

Prüfen:
- In den Entwicklertools (F12 → Device Toolbar) die Prüfgrößen durchgehen.
- Je eine Pearson- und eine Spearman-Runde bis zur Auflösung spielen. Bei Jubel ragt die Figur am weitesten heraus: Verdeckt sie etwas, z. B. die Herz-Slots?
- „Menü“ während einer Runde: Rückfrage erscheint, „Nein“ setzt das Spiel fort, „Ja“ führt ins Hauptmenü.
- Absichtlich verlieren: Endbildschirm ohne Plot und Statusleiste, beide Buttons funktionieren.

---

## Prompt B: Inhalte

```
Lies SPEC.md Abschnitt 10, Unterabschnitt „Endbildschirm“. Setze um, jeweils ohne andere Änderungen:

1. Endbildschirm: Figuren und Texte nach SPEC (bei neuem Rekord jubeln, sonst enttäuscht, kein „geschafft“ bei Niederlage).
2. Simpson-Auflösung: zusätzlich die Regressionsgerade über alle Punkte zeichnen, dicker, gestrichelt, dunkle neutrale Farbe, zuletzt gezeichnet.
3. Farben der Punktwolke und der Simpson-Gruppen in plot.js: keine Grün- oder Rottöne, die mit --pearson oder --spearman verwechselt werden können. Stattdessen z. B. Blau, Violett, Braun, Grau mit gutem Kontrast.
4. Hauptmenü: Figuren ab 900 px Fensterbreite mit Faktor 3.
5. Szenario „monoton“: Laut SPEC Abschnitt 3 mit kleinem Rauschen. Aktuell liegen die Punkte exakt auf der Kurve und drängen sich unten. Kleines Rauschen ergänzen und die Krümmung so wählen, dass die Punkte sichtbar über die Fläche verteilt sind. Die Akzeptanzbedingung |ρ − r| ≥ 0,15 bleibt, test.html muss grün bleiben.
6. Lösche die leeren Dateien js/icons.js und note.txt.

Halte danach an.
```

Prüfen:
- Endbildschirm einmal mit und einmal ohne neuen Rekord: passende Posen und Texte.
- Simpson-Fall: Gesamtgerade steigt, Gruppengeraden fallen, beides gut unterscheidbar.
- Monotoner Fall: Punkte über die Fläche verteilt, leicht gestreut.
- `test.html`: alles grün.

---

## Danach

Wenn A und B passen, ist Version 1.1 abgeschlossen. Nächster Schritt: Version 1.2 (Didaktik) mit `PROMPTS-v1.2.md`. Die Figurenbilder deines Chefs können jederzeit dazwischen eingetauscht werden, solange die Dateinamen gleich bleiben.
