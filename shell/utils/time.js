import day from 'dayjs';

const FACTORS = [60, 60, 24];
const LABELS = ['sec', 'min', 'hour', 'day'];

// Diff two dates and return an object with values for presentation
// If 't' is also passed, 'string' property is set on the return object with the diff formatted as a string
// e.g. formats a date difference to return '1 day', '20 hours' etc
export function diffFrom(value, from, t) {
  const now = day();

  from = from || now;
  const diff = value.diff(now, 'seconds');

  let absDiff = Math.abs(diff);

  let next = 1;
  let label = '?';

  let i = 0;

  while ( absDiff >= FACTORS[i] && i < FACTORS.length ) {
    absDiff /= FACTORS[i];
    next *= Math.floor(FACTORS[i] / 10);
    i++;
  }

  if ( absDiff < 5 ) {
    label = Math.floor(absDiff * 10) / 10;
  } else {
    label = Math.floor(absDiff);
  }
  const ret = {
    diff,
    absDiff,
    label,
    unitsKey: `unit.${ LABELS[i] }`,
    units:    LABELS[i],
    next,
  };

  if (!!t) {
    ret.string = `${ ret.label } ${ t(ret.unitsKey, { count: ret.label }) }`;
  }

  return ret;
}

export function safeSetTimeout(timeout, callback, that) {
  if (timeout <= 2147483647) {
    // Max value setTimeout can take is max 32 bit int (about 24.9 days)
    return setTimeout(() => {
      callback.apply(that);
    }, timeout);
  }
}

export function getSecondsDiff(startDate, endDate) {
  return Math.round(
    Math.abs(Date.parse(endDate) - Date.parse(startDate)) / 1000
  );
}
