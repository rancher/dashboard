const UNIT_TO_MS =
  {
    ms: 1,
    s:  1000,
    m:  60 * 1000,
    h:  60 * 60 * 1000,
    d:  24 * 60 * 60 * 1000,
    w:  7 * 24 * 60 * 60 * 1000,
    y:  365 * 24 * 60 * 60 * 1000
  };

const DURATION_REGEX = /^(?:([0-9]+)y)?(?:([0-9]+)w)?(?:([0-9]+)d)?(?:([0-9]+)h)?(?:([0-9]+)m)?(?:([0-9]+)s)?(?:([0-9]+)ms)?$/;

export function toMilliseconds(input) {
  if (!input) {
    return 0;
  }
  const d = `${ input }`.match(DURATION_REGEX);

  if (d) {
    const properties = d.slice(1);
    const numberD = properties.map((value) => ([null, undefined].includes(value) ? 0 : Number(value)));
    const data = {};

    [
      data.y,
      data.w,
      data.d,
      data.h,
      data.m,
      data.s,
      data.ms
    ] = numberD;

    return Object.keys(data).reduce((total, unit) => (total + ((data[unit] || 0) * UNIT_TO_MS[unit])), 0);
  }

  return 0;
}

export function toSeconds(input) {
  return Math.floor(toMilliseconds(input) / 1000);
}
