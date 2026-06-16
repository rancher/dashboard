export const SECONDS_PER = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
} as const;

export const UNIT_TO_MS = {
  ms: 1,
  s:  1000,
  m:  60 * 1000,
  h:  60 * 60 * 1000,
  d:  24 * 60 * 60 * 1000,
  w:  7 * 24 * 60 * 60 * 1000,
  y:  365 * 24 * 60 * 60 * 1000
} as const;

const DURATION_REGEX = /^(?:([0-9]+)y)?(?:([0-9]+)w)?(?:([0-9]+)d)?(?:([0-9]+)h)?(?:([0-9]+)m)?(?:([0-9]+)s)?(?:([0-9]+)ms)?$/;

export function toMilliseconds(input: string | number | null | undefined): number {
  if (!input) {
    return 0;
  }
  const d = `${ input }`.match(DURATION_REGEX);

  if (d) {
    const properties = d.slice(1);
    const numberD = properties.map((value) => ([null, undefined].includes(value) ? 0 : Number(value)));
    const data: Record<string, number> = {};

    [
      data.y,
      data.w,
      data.d,
      data.h,
      data.m,
      data.s,
      data.ms
    ] = numberD;

    return Object.keys(data).reduce((total, unit) => (total + ((data[unit] || 0) * (UNIT_TO_MS[unit as keyof typeof UNIT_TO_MS] || 0))), 0);
  }

  return 0;
}

export function toSeconds(input: string | number | null | undefined): number {
  return Math.floor(toMilliseconds(input) / 1000);
}

const DURATION_UNITS = [
  { divisor: SECONDS_PER.d, suffix: 'd' },
  { divisor: SECONDS_PER.h, suffix: 'h' },
  { divisor: SECONDS_PER.m, suffix: 'm' },
  { divisor: SECONDS_PER.s, suffix: 's' },
];

/**
 * Decomposes a total number of seconds into the largest whole time unit.
 * For example, 7200 returns { value: 2, unit: 3600 } (2 hours).
 * @param seconds - Total seconds to decompose
 * @returns An object with `value` (the count) and `unit` (the multiplier in seconds: 86400, 3600, 60, or 1)
 */
export function secondsToLargestUnit(seconds: number): { value: number, unit: number } {
  if (seconds <= 0) {
    return { value: seconds, unit: SECONDS_PER.s };
  }

  if (seconds % SECONDS_PER.d === 0) {
    return { value: seconds / SECONDS_PER.d, unit: SECONDS_PER.d };
  }
  if (seconds % SECONDS_PER.h === 0) {
    return { value: seconds / SECONDS_PER.h, unit: SECONDS_PER.h };
  }
  if (seconds % SECONDS_PER.m === 0) {
    return { value: seconds / SECONDS_PER.m, unit: SECONDS_PER.m };
  }

  return { value: seconds, unit: SECONDS_PER.s };
}

/**
 * Formats a duration in seconds into a human-readable string (e.g. "1d 3h 46m 40s").
 * Zero-value components are omitted. Returns "0s" for non-positive values.
 * @param seconds - Duration in seconds
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return '0s';
  }

  let remaining = seconds;

  return DURATION_UNITS
    .map(({ divisor, suffix }) => {
      const count = Math.floor(remaining / divisor);

      remaining %= divisor;

      return count > 0 ? `${ count }${ suffix }` : '';
    })
    .filter(Boolean)
    .join(' ');
}
