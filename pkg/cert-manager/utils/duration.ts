/**
 * cert-manager durations are Go duration strings, e.g. `2160h0m0s`, `720h`, `90m`.
 * Go's ParseDuration accepts h/m/s (and smaller units cert-manager has no use for), but
 * notably *not* days - so a "90 days" choice in the UI has to be written out as `2160h`.
 * https://pkg.go.dev/time#ParseDuration
 */
export const DURATION_UNITS = ['d', 'h', 'm', 's'] as const;

export type DurationUnit = typeof DURATION_UNITS[number];

const SECONDS_PER_UNIT: Record<DurationUnit, number> = {
  d: 86400,
  h: 3600,
  m: 60,
  s: 1,
};

/** Only h/m/s are valid Go units, so `d` never appears in a parsed string. */
const GO_DURATION = /^(\d+(?:\.\d+)?)(h|m|s)/;

export interface DurationParts {
  value: number;
  unit: DurationUnit;
}

/**
 * Total seconds for a Go duration string, or null if it is absent or unparseable.
 */
export function parseDuration(duration?: string | null): number | null {
  if (!duration) {
    return null;
  }

  let rest = duration.trim();

  if (!rest) {
    return null;
  }

  let seconds = 0;
  let matched = false;

  while (rest.length) {
    const match = rest.match(GO_DURATION);

    if (!match) {
      return null;
    }

    seconds += parseFloat(match[1]) * SECONDS_PER_UNIT[match[2] as DurationUnit];
    rest = rest.slice(match[0].length);
    matched = true;
  }

  return matched ? seconds : null;
}

/**
 * Split a duration into the largest whole unit that represents it exactly, for display in a
 * value + unit pair of inputs. Days are preferred because certificate lifetimes are quoted
 * in days far more often than in hours.
 */
export function durationToParts(duration?: string | null): DurationParts | null {
  const seconds = parseDuration(duration);

  if (seconds === null) {
    return null;
  }

  const unit = DURATION_UNITS.find((u) => seconds >= SECONDS_PER_UNIT[u] && seconds % SECONDS_PER_UNIT[u] === 0);

  return unit ? { value: seconds / SECONDS_PER_UNIT[unit], unit } : { value: seconds, unit: 's' };
}

/**
 * Build a Go duration string. Days are converted to hours because Go cannot parse `d`.
 * Returns undefined for an empty value so the field can be omitted from the spec entirely.
 */
export function partsToDuration(value?: number | string | null, unit: DurationUnit = 'h'): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }

  if (unit === 'd') {
    return `${ numeric * 24 }h`;
  }

  return `${ numeric }${ unit }`;
}
