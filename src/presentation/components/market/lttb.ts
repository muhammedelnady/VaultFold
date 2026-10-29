/**
 * Largest Triangle Three Buckets (LTTB) downsampling algorithm.
 * Downsamples high-frequency price arrays to <= targetPoints (default 40)
 * while preserving peaks, valleys, and overall visual profile.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function downsampleLTTB(data: readonly number[], threshold = 40): number[] {
  if (data.length <= threshold || threshold <= 2) {
    return [...data];
  }

  const sampled: number[] = new Array(threshold);
  const dataLength = data.length;

  const every = (dataLength - 2) / (threshold - 2);

  let a = 0;
  sampled[0] = data[a]!;

  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * every) + 1, dataLength);
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += j;
      avgY += data[j]!;
    }
    avgX /= avgRangeLength || 1;
    avgY /= avgRangeLength || 1;

    const rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * every) + 1, dataLength);

    const pointAX = a;
    const pointAY = data[a]!;

    let maxArea = -1;
    let nextA = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const area =
        Math.abs((pointAX - avgX) * (data[j]! - pointAY) - (pointAX - j) * (avgY - pointAY)) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }

    sampled[i + 1] = data[nextA]!;
    a = nextA;
  }

  sampled[threshold - 1] = data[dataLength - 1]!;
  return sampled;
}

export function buildSparklineSvgPath(
  data: readonly number[],
  width: number,
  height: number,
  padding = 2,
): string {
  if (data.length === 0) {
    return "";
  }
  if (data.length === 1) {
    const y = height / 2;
    return `M 0 ${y} L ${width} ${y}`;
  }

  let min = data[0]!;
  let max = data[0]!;
  for (let i = 1; i < data.length; i++) {
    const val = data[i]!;
    if (val < min) min = val;
    if (val > max) max = val;
  }

  const range = max - min;
  const usableHeight = height - padding * 2;
  const stepX = width / (data.length - 1);

  return data.reduce((path, val, idx) => {
    const x = Math.round(idx * stepX * 10) / 10;
    const normalizedY =
      range === 0 ? usableHeight / 2 : usableHeight - ((val - min) / range) * usableHeight;
    const y = Math.round((normalizedY + padding) * 10) / 10;

    return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, "");
}
