# Prompts für Version 1.1.3: Inhalte, neue Figuren und Icons

## Vorbereitung

- `SPEC.md` durch die aktuelle Version ersetzen.
- `assets.zip` entpacken: Der Ordner `assets/sprites/` ersetzt den bisherigen vollständig (jetzt 24 Bilder, Magierin statt Zauberer). `assets/icons/` kommt neu dazu (15 Icons).
- Alles committen.
- Prompt B und C nacheinander verwenden. Nach jedem Prompt prüfen und committen.

---

## Prompt B: Inhalte

```
Lies SPEC.md Abschnitt 3, Abschnitt 9 „Layout im Detail“ und Abschnitt 10 „Endbildschirm“. Setze um, jeweils ohne andere Änderungen:

1. Endbildschirm: Figuren und Texte nach SPEC (bei neuem Rekord jubeln, sonst enttäuscht, kein „geschafft“ bei Niederlage).
2. Simpson-Auflösung: zusätzlich die Regressionsgerade über alle Punkte zeichnen, dicker, gestrichelt, dunkle neutrale Farbe, zuletzt gezeichnet.
3. Farben der Punktwolke und der Simpson-Gruppen in plot.js: keine Grün- oder Rottöne, die mit --pearson oder --spearman verwechselt werden können. Stattdessen z. B. Blau, Violett, Braun, Grau mit gutem Kontrast.
4. Hauptmenü: Figuren ab 900 px Fensterbreite mit Faktor 3.
5. Szenario „monoton“: mit kleinem Rauschen, Krümmung so wählen, dass die Punkte sichtbar über die Fläche verteilt sind statt sich unten zu drängen. Akzeptanz |ρ − r| ≥ 0,15 bleibt.
6. Szenario „uform“: x-Werte unabhängig ziehen statt Punkte zu spiegeln, damit r und ρ leicht um 0 schwanken. Akzeptanz: |r| ≤ 0,15 und |ρ| ≤ 0,15.
7. Spielansicht im Querformat: rechte Spalte gleich hoch wie der Plot, Inhalt über die Höhe verteilt (z. B. Eingabe unten bündig zum Plot), keine leere Fläche darunter.
8. Zahlenanzeige: −0,00 als 0,00 darstellen.
9. Lösche die leeren Dateien js/icons.js und note.txt.

test.html anpassen und grün halten. Halte danach an.
```

Prüfen:
- Absichtlich verlieren, einmal mit und einmal ohne neuen Rekord: Posen und Texte passend?
- Simpson-Fall: Gesamtgerade steigt (bzw. fällt), Gruppengeraden zeigen in die Gegenrichtung, gut unterscheidbar.
- Kein grüner oder roter Punkt mehr in der Wolke.
- Monotoner Fall und U-Form sehen natürlich gestreut aus.
- `test.html`: alles grün.

---

## Prompt C: Neue Figuren und Icons einbinden

```
Lies SPEC.md Abschnitt 10, Unterabschnitte „Figuren“, „Icons“, „Figuren im Spiel“, „Regression (Magierin)“ und „Hauptmenü“. Die Bilder in assets/sprites/ und assets/icons/ sind fertig, verändere sie nicht und zeichne keine eigenen Grafiken.

1. js/characters.js auf acht Posen erweitern (ruhe, zeigen, jubel, enttaeuscht, nachdenken, erklaeren, ueberrascht, winken), alle Posen einer Figur vorab laden.
2. Neue Posen im Spiel nach SPEC nutzen: Hauptmenü „winken“ beim Öffnen, Schätzphase „nachdenken“ nach 4 s ohne Eingabe. erklaeren und ueberrascht noch nicht verwenden.
3. Alle Icons aus assets/icons/ verwenden, wie in der Tabelle „Icons“ beschrieben. Die bisherigen Raster-Icons aus js/sprites.js werden damit überflüssig: entferne js/sprites.js und alle Verweise darauf.
4. Beschriftung der dritten Figur im Hauptmenü: „Regression“ (sie ist jetzt eine Magierin).
5. sprites-preview.html: je Figur alle acht Posen in 2× und 3×, darunter alle Icons in 1×, 2× und 3×.

Prüfe danach bei 1366 × 650, 1536 × 730 und 390 × 750, dass die größeren neuen Posen (z. B. Spear-man „zeigen“ und „jubel“) die Regeln aus SPEC Abschnitt 9 „Layout im Detail“ einhalten. Halte danach an und nenne mir, was ich prüfen soll.
```

Prüfen:
- `sprites-preview.html`: alle Posen und Icons scharf, nichts springt beim Wechsel.
- Hauptmenü: Figuren winken beim Öffnen.
- In einer Runde 5 s nichts tun: Figur denkt nach.
- Spearman-Runde bestätigen: Speer zeigt aufs Schild und verdeckt nichts.
- HUD, Spielregeln, Weiter- und Menü-Button tragen die neuen Icons.

---

## Danach

Version 1.1 ist abgeschlossen. Nächster Schritt: Version 1.2 (Didaktik) mit `PROMPTS-v1.2.md`. Dort kommen die Posen „erklaeren“ und „ueberrascht“ zum Einsatz.
