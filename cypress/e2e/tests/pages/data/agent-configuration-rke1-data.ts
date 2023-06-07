// TODO nb other data uses indices starting at 1...?
// tolerations data
/*
    operator: 0-equal; 1-exists (no value)
    effect: 0-noSchedule (no seconds); 1-noExecute; 2-preferNoSchedule (no seconds); 3-all (no seconds)
  */
export const tolerationsData = [
  {
    key:      'key1',
    operator: 1,
    effect:   0
  },
  {
    key:      'key2',
    operator: 0,
    value:    'val2',
    effect:   1
  },
  {
    key:      'key3',
    operator: 0,
    value:    'val3',
    effect:   2
  },
  {
    key:      'key4',
    operator: 0,
    value:    'val4',
    effect:   3
  },
  {
    key:      'key5',
    operator: 0,
    value:    'val5',
    effect:   1,
    seconds:  45
  },
];
