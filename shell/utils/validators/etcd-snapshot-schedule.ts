interface FieldBounds {
  min: number;
  max: number;
  names?: Map<string, number>;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const FIELDS: FieldBounds[] = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  {
    min: 1, max: 12, names: new Map(MONTHS.map((month, i) => [month, i + 1]))
  },
  {
    min: 0, max: 6, names: new Map(WEEKDAYS.map((day, i) => [day, i]))
  },
];

const PREDEFINED_SCHEDULES = ['@yearly', '@annually', '@monthly', '@weekly', '@daily', '@midnight', '@hourly'];
const EVERY_PREFIX = '@every ';
const TIMEZONE_PREFIX = /^(CRON_)?TZ=/;
const SCHEDULE_AFTER_TIMEZONE = /^(?:CRON_)?TZ=\S+ ([\s\S]*)$/;
const DURATION_COMPONENT = /(\d+\.?\d*|\.\d+)(ns|us|µs|μs|ms|s|m|h)/g;
const DURATION = new RegExp(`^(?:${ DURATION_COMPONENT.source })+$`);
const NANOSECONDS: Record<string, number> = {
  ns: 1, us: 1e3, µs: 1e3, μs: 1e3, ms: 1e6, s: 1e9, m: 6e10, h: 3.6e12
};
const MAX_DURATION_NANOSECONDS = 2 ** 63 - 1;

function parseValue(text: string, names?: Map<string, number>): number {
  const named = names?.get(text.toLowerCase());

  if (named !== undefined) {
    return named;
  }

  return /^\+?\d+$/.test(text) ? Number(text) : NaN;
}

function isValidRange(range: string, { min, max, names }: FieldBounds): boolean {
  const [values, step, ...extraSlashes] = range.split('/');
  const [low, high, ...extraHyphens] = values.split('-');
  let start = min;
  let end = max;

  if (low !== '*' && low !== '?') {
    if (extraHyphens.length) {
      return false;
    }
    start = parseValue(low, names);
    end = high === undefined ? start : parseValue(high, names);
  }

  if (extraSlashes.length) {
    return false;
  }

  if (step !== undefined) {
    if (!(parseValue(step) > 0)) {
      return false;
    }
    if (high === undefined) {
      end = max;
    }
  }

  return start >= min && end <= max && start <= end;
}

function isValidField(field: string, bounds: FieldBounds): boolean {
  const ranges = field.split(',').filter(Boolean);

  return ranges.length > 0 && ranges.every((range) => isValidRange(range, bounds));
}

function isValidDuration(duration: string): boolean {
  if (!DURATION.test(duration)) {
    return false;
  }

  const nanoseconds = [...duration.matchAll(DURATION_COMPONENT)].reduce((total, [, value, unit]) => total + Number(value) * NANOSECONDS[unit], 0);

  return nanoseconds <= MAX_DURATION_NANOSECONDS;
}

/**
 * Whether K3s and RKE2 can take etcd snapshots on this schedule (`etcd-snapshot-schedule-cron`), which they parse with
 * robfig/cron's standard parser: five fields (minute, hour, day of month, month, and day of week from 0 to 6), a
 * predefined schedule such as `@daily`, or `@every <duration>`, each optionally after a `CRON_TZ=<zone> ` or
 * `TZ=<zone> ` prefix. The zone name itself isn't checked, since it depends on the timezone data on the nodes.
 */
export function isValidEtcdSnapshotSchedule(schedule: string): boolean {
  let spec = schedule;

  if (TIMEZONE_PREFIX.test(spec)) {
    const afterTimezone = SCHEDULE_AFTER_TIMEZONE.exec(spec);

    if (!afterTimezone) {
      return false;
    }
    spec = afterTimezone[1].trim();
  }

  if (spec.startsWith('@')) {
    return PREDEFINED_SCHEDULES.includes(spec) || (spec.startsWith(EVERY_PREFIX) && isValidDuration(spec.slice(EVERY_PREFIX.length)));
  }

  const fields = spec.split(/\s+/).filter(Boolean);

  return fields.length === FIELDS.length && fields.every((field, i) => isValidField(field, FIELDS[i]));
}
