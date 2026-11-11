# SPEC: Correlation Guesser (Arbeitstitel)

Stand: 11.11.2026, Version 1 (erste nutzbare Version)

Der Name ist ein Arbeitstitel. Er steht nur an einer Stelle, als Konstante `APP_TITLE` in `js/texts.js`. index.html, Seitentitel und Überschriften lesen ihn von dort, damit eine spätere Umbenennung nur eine Zeile ändert.

## 1. Zweck und Zielgruppe

Lerntool zur Einführungsvorlesung Deskriptive Statistik im Medizinstudium. Die Vorlesung wird aufgezeichnet, das Tool wird live gezeigt und danach per Link aus Moodle zum Selbststudium genutzt.

Lernziele:
1. Pearson r aus einer Punktwolke grob einschätzen können.
2. Verstehen, dass Pearson lineare und Spearman monotone Zusammenhänge misst und dass sie sich bei gekrümmten Zusammenhängen und Ausreißern deutlich unterscheiden.
3. Erkennen, dass r ≈ 0 nicht „kein Zusammenhang“ bedeutet (U-Form).
4. Erkennen, dass ein Gesamtzusammenhang sich in Untergruppen umkehren kann (Simpson-Paradoxon).
5. Sehen, dass Steigung der Regressionsgeraden und Korrelation verschiedene Dinge sind.

Leitlinie: einfach halten. Keine Formeln im Tool. Erklärtexte höchstens 1–2 kurze Sätze.

## 2. Spielablauf

Ein einziger Modus. Jede Runde:

1. Eine Punktwolke erscheint. Darüber steht, welcher Koeffizient geschätzt werden soll: „Schätze Pearson r“ oder „Schätze Spearman ρ“.
2. Eingabe über Slider von −1 bis 1 (Schrittweite 0,01) und ein damit synchronisiertes Zahlenfeld. Komma und Punkt als Dezimaltrenner akzeptieren. Bestätigen per Button oder Enter.
3. Auflösung (siehe Abschnitt 5).
4. Button „Weiter“ startet die nächste Runde.

### Regeln (wie guessthecorrelation.com)

- Start mit 3 Leben und 0 Münzen.
- Fehler = |Schätzung − wahrer Wert des gefragten Koeffizienten|, gerundet auf 2 Nachkommastellen.
- Fehler ≤ 0,05: +1 Leben und +5 Münzen.
- 0,05 < Fehler ≤ 0,10: +1 Münze.
- Fehler > 0,10: −1 Leben.
- Kein Streak-Bonus, keine Obergrenze für Leben.
- Bei 0 Leben: Endbildschirm mit Münzen dieser Runde, Highscore und Button „Neues Spiel“.
- Highscore = höchste Münzsumme, gespeichert in `localStorage` pro Gerät. Kein Name, kein Server.
- Anzeige während des Spiels: Leben, Münzen, Rundennummer, laufender durchschnittlicher Fehler.

### Welcher Koeffizient wird gefragt?

- Normale Runden: strikt abwechselnd Pearson, Spearman, Pearson, …
- Runden „monoton“ und „Ausreißer“: mit 70 % Wahrscheinlichkeit Spearman, sonst Pearson.
- Runden „U-Form“ und „Simpson“: folgen der Abwechslung der normalen Runden.

## 3. Szenarien

Pro Runde wird mit 75 % ein normales Szenario und mit 25 % ein Sonderfall gezogen, ab Runde 1. Die vier Sonderfälle sind gleich wahrscheinlich. n wird pro Runde zufällig aus 20–150 gezogen (gleichverteilt). Alle Generatoren nutzen den Seed-RNG.

Jeder Generator gibt zurück: `{ type, points: [{x, y, group?}], groups? }`. r, ρ und b werden immer aus den tatsächlich erzeugten Punkten berechnet, nie aus Zielwerten.

**normal** (bivariat normal)
- Zielkorrelation ρ₀ gleichverteilt aus [−1, 1].
- x, z ~ N(0, 1), y = ρ₀·x + √(1 − ρ₀²)·z.

**monoton** (monoton, aber gekrümmt)
- x gleichverteilt, y = streng monotone, deutlich gekrümmte Funktion von x (z. B. exponentiell) plus kleines Rauschen. Vorzeichen zufällig.
- Akzeptieren nur, wenn |ρ − r| ≥ 0,15, sonst neu erzeugen.

**ausreisser** (einzelner Ausreißer)
- Normale Wolke mit |ρ₀| ≤ 0,3, dazu genau ein Punkt weit außerhalb (z. B. 4–6 Standardabweichungen in x und y).
- Akzeptieren nur, wenn |ρ − r| ≥ 0,15, sonst neu erzeugen.

**uform** (U-Form)
- x gleichverteilt symmetrisch um 0, y = x² plus Rauschen. Zufällig auch umgedreht (∩).
- r und ρ liegen beide nahe 0, obwohl der Zusammenhang deutlich zu sehen ist.

**simpson**
- 3 Gruppen. Innerhalb jeder Gruppe negative Korrelation (r_Gruppe ≤ −0,5). Die Gruppenzentren liegen entlang einer steigenden Diagonalen, sodass r gesamt positiv ist (≥ 0,3). Vorzeichen des Ganzen zufällig spiegeln.
- Akzeptieren nur, wenn Gesamt-r und alle Gruppen-r verschiedene Vorzeichen haben und die obigen Schwellen erfüllt sind.

### Darstellungsbereich

Nach der Erzeugung werden x und y jeweils linear auf den Bereich 5–95 transformiert. Achsen gehen von 0 bis 100 mit Teilstrichen bei 0, 25, 50, 75, 100. Achsenbeschriftung nur „x“ und „y“. Lineare Transformationen ändern r und ρ nicht. b wird auf den transformierten Werten berechnet. Das Diagramm ist quadratisch.

## 4. Optik

- Neutral hell, hoher Kontrast, gut lesbar auf Beamer und in Videoaufzeichnung.
- Pro Runde zufällig: Symbol (Kreis, Quadrat, Dreieck, Raute, Kreuz), Farbe aus einer festen Palette von 6 kontrastreichen Farben, Punktgröße und Transparenz in kleinen Grenzen. Innerhalb einer Runde sind alle Punkte gleich.
- Achsenskalierung bleibt immer gleich (siehe Abschnitt 3), weil die Skalierung die wahrgenommene Korrelation beeinflusst.
- Simpson-Runden sehen beim Schätzen aus wie alle anderen Runden: keine Gruppenfarben.

## 5. Auflösung

Immer:
- Pearson r und Spearman ρ nebeneinander, auf 2 Nachkommastellen. Der gefragte Wert ist hervorgehoben.
- Eigene Schätzung, Fehler und Ergebnis der Runde (z. B. „+5 Münzen, +1 Leben“).
- Regressionsgerade (kleinste Quadrate, y auf x) im Plot, dazu „Steigung b = …“.

Je nach Szenario ein Erklärsatz aus `js/texts.js`:
- normal: kein Text, außer |r − ρ| > 0,1.
- monoton: sinngemäß „Die Punkte steigen (fallen) immer, aber nicht auf einer Geraden. Spearman misst nur die Reihenfolge und ist deshalb näher an ±1.“
- ausreisser: Ausreißer im Plot markieren (z. B. Ring). Sinngemäß „Ein einzelner Punkt verschiebt Pearson stark. Spearman nutzt nur Ränge und bleibt fast unverändert.“
- uform: sinngemäß „Klarer Zusammenhang, aber keine Gerade und nicht monoton. Beide Koeffizienten liegen nahe 0.“
- simpson: Punkte nach Gruppe einfärben, Symbole je Gruppe unterschiedlich (farbenblind-tauglich). Je Gruppe eine eigene Regressionsgerade, dazu r je Gruppe. Sinngemäß „Insgesamt steigt y mit x, innerhalb jeder Gruppe fällt es. Das ist das Simpson-Paradoxon.“

Die Erklärtexte entwirft Copilot. Sie werden fachlich geprüft, bevor sie live gehen.

## 6. Statistik

- Pearson r: Standardformel, Stichprobe.
- Spearman ρ: Pearson r auf den Rängen. Bei Bindungen gemittelte Ränge.
- Regression: b = cov(x, y) / var(x), a = ȳ − b·x̄.
- Sonderfälle: n < 3 oder Varianz 0 liefern `NaN`, das darf in Szenarien nie vorkommen.

### Referenzwerte für Tests (`test.html`)

| Daten | r | ρ | b |
|---|---|---|---|
| x = 1..5, y = x | 1 | 1 | 1 |
| x = 1..5, y = −x | −1 | −1 | −1 |
| x = 1..5, y = x³ | 0,9431 | 1 | |
| x = [1,2,2,3], y = [1,2,3,4] (Bindung) | | 0,9487 | |
| Anscombe I (unten) | 0,8164 | 0,8182 | 0,5001 |

Anscombe I: x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5], y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68]

Toleranz 0,0001. Zusätzlich je Generator 200 Seeds durchlaufen und prüfen, dass alle Akzeptanzbedingungen aus Abschnitt 3 erfüllt sind und kein `NaN` auftritt.

## 7. Dateistruktur

```
index.html
css/style.css
js/rng.js        Seed-RNG (z. B. mulberry32) und Normalverteilung (Box-Muller)
js/stats.js      pearson, spearman, ranks, linearRegression
js/scenarios.js  Generatoren und Auswahl des Szenarios
js/plot.js       SVG-Plot, Symbole, Regressionsgeraden, Markierungen
js/game.js       Spielzustand, Regeln, Ablauf
js/texts.js      alle sichtbaren Texte
js/main.js       Einstieg, verbindet alles
test.html        Tests für stats.js und scenarios.js
README.md        Zweck, lokale Nutzung, Hinweis auf GitHub Pages
```

## 8. Nicht in Version 1

Sandbox mit verschiebbaren Punkten, eigener Sonderfall-Modus, Formeln, Kendall τ, R², Kovarianz, weitere Sonderfälle (Anscombe, eingeschränkter Wertebereich, Heteroskedastizität, Cluster), Englisch, Server, Mehrspieler.
