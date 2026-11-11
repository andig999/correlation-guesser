export function mulberry32(seed) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed) {
  const random = mulberry32(seed);
  let spareNormal;

  function integer(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError("Expected integer bounds with max >= min.");
    }

    return min + Math.floor(random() * (max - min + 1));
  }

  function normal() {
    if (spareNormal !== undefined) {
      const value = spareNormal;
      spareNormal = undefined;
      return value;
    }

    let first;
    do {
      first = random();
    } while (first === 0);

    const second = random();
    const magnitude = Math.sqrt(-2 * Math.log(first));
    const angle = 2 * Math.PI * second;
    spareNormal = magnitude * Math.sin(angle);
    return magnitude * Math.cos(angle);
  }

  return { random, integer, normal };
}
