import { createRng } from "./rng.js";
import { pearson, spearman } from "./stats.js";

const SPECIAL_TYPES = ["monoton", "ausreisser", "uform", "simpson"];

function assertGeneratorInput(rng, n) {
  if (!rng || typeof rng.random !== "function" || typeof rng.normal !== "function") {
    throw new TypeError("Expected an RNG with random() and normal() methods.");
  }
  if (!Number.isInteger(n) || n < 20 || n > 150) {
    throw new RangeError("Expected an integer sample size between 20 and 150.");
  }
}

function getValues(points, key) {
  return points.map((point) => point[key]);
}

function scalePoints(points) {
  const scale = (key) => {
    const values = getValues(points, key);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    if (maximum === minimum) {
      throw new RangeError(`Cannot scale points with zero variance on ${key}.`);
    }

    return values.map((value) => 5 + ((value - minimum) / (maximum - minimum)) * 90);
  };

  const x = scale("x");
  const y = scale("y");
  return points.map((point, index) => ({ ...point, x: x[index], y: y[index] }));
}

function buildScenario(type, points, extra = {}) {
  return { type, points: scalePoints(points), ...extra };
}

export function generateNormal(rng, n) {
  assertGeneratorInput(rng, n);
  const targetCorrelation = rng.random() * 2 - 1;
  const residualScale = Math.sqrt(1 - targetCorrelation ** 2);
  const points = Array.from({ length: n }, () => {
    const x = rng.normal();
    const z = rng.normal();
    return { x, y: targetCorrelation * x + residualScale * z };
  });
  return buildScenario("normal", points);
}

export function generateMonotonic(rng, n) {
  assertGeneratorInput(rng, n);
  const direction = rng.random() < 0.5 ? -1 : 1;
  const step = 2 / n;
  const x = Array.from({ length: n }, (_, index) => (
    -1 + (index + 0.5) * step + (rng.random() - 0.5) * 0.4 * step
  ));
  const curve = x.map((value) => Math.exp(6 * (value + 1)));
  const smallestGap = Math.min(...curve.slice(1).map((value, index) => value - curve[index]));
  const points = x.map((value, index) => ({
    x: value,
    y: direction * (curve[index] + (rng.random() - 0.5) * 0.4 * smallestGap),
  }));
  const scenario = buildScenario("monoton", points);

  if (Math.abs(pearson(getValues(scenario.points, "x"), getValues(scenario.points, "y"))
    - spearman(getValues(scenario.points, "x"), getValues(scenario.points, "y"))) < 0.15) {
    throw new Error("Monotonic scenario did not meet the correlation-difference threshold.");
  }
  return scenario;
}

export function generateOutlier(rng, n) {
  assertGeneratorInput(rng, n);

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const targetCorrelation = (rng.random() * 2 - 1) * 0.3;
    const residualScale = Math.sqrt(1 - targetCorrelation ** 2);
    const points = Array.from({ length: n - 1 }, () => {
      const x = rng.normal();
      const z = rng.normal();
      return { x, y: targetCorrelation * x + residualScale * z };
    });
    const xMean = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const yMean = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const xScale = Math.sqrt(points.reduce((sum, point) => sum + (point.x - xMean) ** 2, 0)
      / points.length);
    const yScale = Math.sqrt(points.reduce((sum, point) => sum + (point.y - yMean) ** 2, 0)
      / points.length);
    const distance = 4 + rng.random() * 2;
    points.push({
      x: xMean + (rng.random() < 0.5 ? -1 : 1) * distance * xScale,
      y: yMean + (rng.random() < 0.5 ? -1 : 1) * distance * yScale,
    });

    const scenario = buildScenario("ausreisser", points, { outlierIndex: n - 1 });
    const x = getValues(scenario.points, "x");
    const y = getValues(scenario.points, "y");
    if (Math.abs(pearson(x, y) - spearman(x, y)) >= 0.15) {
      return scenario;
    }
  }

  throw new Error("Could not generate an outlier scenario meeting the correlation-difference threshold.");
}

export function generateUForm(rng, n) {
  assertGeneratorInput(rng, n);
  const direction = rng.random() < 0.5 ? -1 : 1;
  const pairCount = Math.floor(n / 2);
  const points = [];

  for (let index = 0; index < pairCount; index += 1) {
    const x = rng.random();
    const y = direction * (x ** 2 + rng.normal() * 0.03);
    points.push({ x: -x, y }, { x, y });
  }
  if (n % 2 === 1) {
    points.push({ x: 0, y: direction * rng.normal() * 0.03 });
  }

  return buildScenario("uform", points);
}

export function generateSimpson(rng, n) {
  assertGeneratorInput(rng, n);
  const direction = rng.random() < 0.5 ? -1 : 1;
  const counts = [Math.floor(n / 3), Math.floor(n / 3), n - 2 * Math.floor(n / 3)];

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const points = [];
    counts.forEach((count, group) => {
      const center = (group - 1) * 3;
      for (let index = 0; index < count; index += 1) {
        const withinGroupX = rng.normal() * 0.4;
        points.push({
          x: center + withinGroupX,
          y: direction * (center - 0.9 * withinGroupX + rng.normal() * 0.1),
          group,
        });
      }
    });

    const scenario = buildScenario("simpson", points, { groups: [0, 1, 2] });
    const x = getValues(scenario.points, "x");
    const y = getValues(scenario.points, "y");
    const overall = pearson(x, y);
    const groupCorrelations = scenario.groups.map((group) => {
      const groupPoints = scenario.points.filter((point) => point.group === group);
      return pearson(getValues(groupPoints, "x"), getValues(groupPoints, "y"));
    });
    const oppositeSigns = groupCorrelations.every((correlation) => correlation * overall < 0);

    if (Math.abs(overall) >= 0.3
      && groupCorrelations.every((correlation) => Math.abs(correlation) >= 0.5)
      && oppositeSigns) {
      return scenario;
    }
  }

  throw new Error("Could not generate a Simpson scenario meeting the correlation thresholds.");
}

export function selectCoefficient(type, roundNumber, rng) {
  if (!Number.isInteger(roundNumber) || roundNumber < 1) {
    throw new RangeError("Expected a round number of at least 1.");
  }
  if (!rng || typeof rng.random !== "function") {
    throw new TypeError("Expected an RNG with a random() method.");
  }

  if (type === "monoton" || type === "ausreisser") {
    return rng.random() < 0.7 ? "spearman" : "pearson";
  }
  if (type === "normal" || type === "uform" || type === "simpson") {
    return roundNumber % 2 === 1 ? "pearson" : "spearman";
  }
  throw new RangeError(`Unknown scenario type: ${type}`);
}

export function createScenario(seed, roundNumber = 1) {
  const rng = createRng(seed);
  const n = rng.integer(20, 150);
  const type = rng.random() < 0.75
    ? "normal"
    : SPECIAL_TYPES[rng.integer(0, SPECIAL_TYPES.length - 1)];
  const generators = {
    normal: generateNormal,
    monoton: generateMonotonic,
    ausreisser: generateOutlier,
    uform: generateUForm,
    simpson: generateSimpson,
  };
  const scenario = generators[type](rng, n);
  return {
    ...scenario,
    seed,
    n,
    coefficient: selectCoefficient(type, roundNumber, rng),
  };
}
