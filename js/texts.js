export const APP_TITLE = "Correlation Guesser";

export const TEXTS = {
  round: "Runde",
  lives: "Leben",
  coins: "Münzen",
  averageError: "Ø Fehler",
  averageErrorAccessible: "Durchschnittlicher Fehler",
  highscore: "Highscore",
  startGame: "Spiel starten",
  gameRules: "Spielregeln",
  rulesTitle: "Spielregeln",
  rulesStart: "Du startest mit 3 Leben und 0 Münzen.",
  rulesPerfect: "Fehler bis 0,05: +1 Leben und +5 Münzen.",
  rulesClose: "Fehler bis 0,10: +1 Münze.",
  rulesMiss: "Fehler über 0,10: −1 Leben.",
  pearsonPrompt: "Schätze Pearson r",
  spearmanPrompt: "Schätze Spearman ρ",
  guessLabel: "Deine Schätzung",
  numberInputLabel: "Zahlenfeld für deine Schätzung",
  submitGuess: "Schätzung bestätigen",
  continue: "Weiter",
  finish: "Zum Endbildschirm",
  newGame: "Neues Spiel",
  resolutionTitle: "Auflösung",
  estimate: "Deine Schätzung",
  error: "Fehler",
  pearson: "Pearson r",
  spearman: "Spearman ρ",
  regressionSlope: "Steigung b",
  invalidGuess: "Bitte gib eine Zahl zwischen −1 und 1 ein.",
  gameOverTitle: "Spiel beendet",
  gameOverMessage: "Keine Leben mehr.",
  gameOverCoins: "Münzen dieser Runde",
  noChange: "Keine Änderung",
  life: "Leben",
  group: "Gruppe",
  invalidHighscore: "Der gespeicherte Highscore ist ungültig und wird ignoriert.",
  highscoreLoadError: (message) => `Der Highscore konnte nicht geladen werden: ${message}`,
  highscoreSaveError: (message) => `Der Highscore konnte nicht gespeichert werden: ${message}`,
  groupCorrelation: (group, correlation, slope) => (
    `Gruppe ${group}: r = ${correlation}, b = ${slope}`
  ),
  roundResult: (estimate, error, rewards) => (
    `${TEXTS.estimate}: ${estimate} · ${TEXTS.error}: ${error}. ${rewards}.`
  ),
  scenarioExplanations: {
    monotonIncreasing: "Die Punkte steigen durchgehend, aber nicht auf einer Geraden. Spearman bewertet die Rangfolge und liegt deshalb näher an +1.",
    monotonDecreasing: "Die Punkte fallen durchgehend, aber nicht auf einer Geraden. Spearman bewertet die Rangfolge und liegt deshalb näher an −1.",
    ausreisser: "Ein einzelner Ausreißer kann Pearson stark verschieben. Spearman nutzt Ränge und bleibt gegenüber diesem Punkt oft stabiler.",
    uform: "Die Punktwolke zeigt einen klaren, aber nicht linearen oder monotonen Zusammenhang. Deshalb können Pearson und Spearman nahe 0 liegen.",
    simpsonIncreasing: "Insgesamt steigt y mit x, innerhalb jeder Gruppe fällt y jedoch. Dieser Richtungswechsel heißt Simpson-Paradoxon.",
    simpsonDecreasing: "Insgesamt fällt y mit x, innerhalb jeder Gruppe steigt y jedoch. Dieser Richtungswechsel heißt Simpson-Paradoxon.",
    normalDifference: "Pearson beschreibt lineare, Spearman monotone Zusammenhänge. Ihre Abweichung kann auf eine gekrümmte Beziehung oder einen Ausreißer hinweisen.",
  },
};

export function explanationFor(scenario, metrics) {
  if (scenario.type === "normal") {
    return Math.abs(metrics.pearson - metrics.spearman) > 0.1
      ? TEXTS.scenarioExplanations.normalDifference
      : "";
  }
  if (scenario.type === "monoton") {
    return metrics.spearman > 0
      ? TEXTS.scenarioExplanations.monotonIncreasing
      : TEXTS.scenarioExplanations.monotonDecreasing;
  }
  if (scenario.type === "simpson") {
    return metrics.pearson > 0
      ? TEXTS.scenarioExplanations.simpsonIncreasing
      : TEXTS.scenarioExplanations.simpsonDecreasing;
  }
  return TEXTS.scenarioExplanations[scenario.type] ?? "";
}
