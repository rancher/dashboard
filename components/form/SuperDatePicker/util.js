import day from 'dayjs';

export const ALL_TYPES = {
  SECONDS_AGO: {
    key: 'SECONDS_AGO',
    computeAbsolute(value) {
      return day().subtract(value, 'seconds');
    }
  },
  MINUTES_AGO: {
    key: 'MINUTES_AGO',
    computeAbsolute(value) {
      return day().subtract(value, 'minutes');
    }
  },
  HOURS_AGO: {
    key: 'HOURS_AGO',
    computeAbsolute(value) {
      return day().subtract(value, 'hours');
    }
  },
  DAYS_AGO: {
    key: 'DAYS_AGO',
    computeAbsolute(value) {
      return day().subtract(value, 'days');
    }
  },
  WEEKS_AGO: {
    key: 'WEEKS_AGO',
    computeAbsolute(value) {
      return day().subtract(value, 'weeks');
    }
  },
  MONTHS_AGO: {
    key: 'MONTHS_AGO',
    computeAbsolute(value) {
      return day().subtract(value, 'months');
    }
  },
  YEARS_AGO: {
    key: 'YEARS_AGO',
    computeAbsolute(value) {
      return day().subtract(value, 'years');
    }
  },
  SECONDS_FROM_NOW: {
    key: 'SECONDS_FROM_NOW',
    computeAbsolute(value) {
      return day().add(value, 'seconds');
    }
  },
  MINUTES_FROM_NOW: {
    key: 'MINUTES_FROM_NOW',
    computeAbsolute(value) {
      return day().add(value, 'minutes');
    }
  },
  HOURS_FROM_NOW: {
    key: 'HOURS_FROM_NOW',
    computeAbsolute(value) {
      return day().add(value, 'hours');
    }
  },
  DAYS_FROM_NOW: {
    key: 'DAYS_FROM_NOW',
    computeAbsolute(value) {
      return day().add(value, 'days');
    }
  },
  WEEKS_FROM_NOW: {
    key: 'WEEKS_FROM_NOW',
    computeAbsolute(value) {
      return day().add(value, 'weeks');
    }
  },
  MONTHS_FROM_NOW: {
    key: 'MONTHS_FROM_NOW',
    computeAbsolute(value) {
      return day().add(value, 'months');
    }
  },
  YEARS_FROM_NOW: {
    key: 'YEARS_FROM_NOW',
    computeAbsolute(value) {
      return day().add(value, 'years');
    }
  },
  NOW: {
    key: 'NOW',
    computeAbsolute(value) {
      return day();
    }
  },
  ABSOLUTE: {
    key: 'ABSOLUTE',
    computeAbsolute(value) {
      return day(value);
    }
  },
};

export const RELATIVE_TYPES = [ALL_TYPES.SECONDS_AGO, ALL_TYPES.MINUTES_AGO, ALL_TYPES.HOURS_AGO, ALL_TYPES.DAYS_AGO, ALL_TYPES.WEEKS_AGO, ALL_TYPES.MONTHS_AGO, ALL_TYPES.YEARS_AGO, ALL_TYPES.SECONDS_FROM_NOW, ALL_TYPES.MINUTES_FROM_NOW, ALL_TYPES.HOURS_FROM_NOW, ALL_TYPES.DAYS_FROM_NOW, ALL_TYPES.WEEKS_FROM_NOW, ALL_TYPES.MONTHS_FROM_NOW, ALL_TYPES.YEARS_FROM_NOW];

export function getAbsoluteValue(time) {
  return ALL_TYPES[time.type].computeAbsolute(time.value);
}

export const LOG_HEADERS = [
  {
    name:      'date',
    labelKey:  'tableHeaders.date',
    formatter: 'Date',
    value:     'timestamp',
    sort:      ['timestamp'],
    width:     '300px'
  },
  {
    name:     'level',
    labelKey: 'tableHeaders.level',
    value:    'level',
    sort:     ['level']
  },
  {
    name:     'component',
    labelKey: 'tableHeaders.component',
    value:    'component',
    sort:     ['component']
  },
  {
    name:      'feedback',
    labelKey:  'tableHeaders.feedback',
    formatter: 'Feedback',
    width:     '80px',
    align:     'right'
  },
];
