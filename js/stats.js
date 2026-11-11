export function mean(values) {
  if (values.length === 0) {
    return NaN;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function ranks(values) {
  const sorted = values
    .map((value, index) => ({ value, index }))
    .sort((left, right) => left.value - right.value);
  const result = Array(values.length);

  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].value === sorted[start].value) {
      end += 1;
    }

    const averageRank = ((start + 1) + end) / 2;
    for (let index = start; index < end; index += 1) {
      result[sorted[index].index] = averageRank;
    }
    start = end;
  }

  return result;
}

function isValidPair(x, y) {
  return x.length === y.length && x.length >= 3;
}

function covarianceNumerator(x, y, xMean, yMean) {
  return x.reduce(
    (sum, value, index) => sum + (value - xMean) * (y[index] - yMean),
    0,
  );
}

export function pearson(x, y) {
  if (!isValidPair(x, y)) {
    return NaN;
  }

  const xMean = mean(x);
  const yMean = mean(y);
  const xVarianceNumerator = covarianceNumerator(x, x, xMean, xMean);
  const yVarianceNumerator = covarianceNumerator(y, y, yMean, yMean);

  if (xVarianceNumerator === 0 || yVarianceNumerator === 0) {
    return NaN;
  }

  return covarianceNumerator(x, y, xMean, yMean)
    / Math.sqrt(xVarianceNumerator * yVarianceNumerator);
}

export function spearman(x, y) {
  if (!isValidPair(x, y)) {
    return NaN;
  }

  return pearson(ranks(x), ranks(y));
}

export function linearRegression(x, y) {
  if (!isValidPair(x, y)) {
    return { a: NaN, b: NaN };
  }

  const xMean = mean(x);
  const yMean = mean(y);
  const xVarianceNumerator = covarianceNumerator(x, x, xMean, xMean);

  if (xVarianceNumerator === 0) {
    return { a: NaN, b: NaN };
  }

  const b = covarianceNumerator(x, y, xMean, yMean) / xVarianceNumerator;
  return { a: yMean - b * xMean, b };
}
