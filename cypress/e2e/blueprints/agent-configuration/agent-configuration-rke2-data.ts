// requests and limits data
export const requestAndLimitsData = {
  request: {
    cpu:    1,
    memory: 1
  },
  limit: {
    cpu:    2,
    memory: 2
  },
};

// tolerations data
/*
    operator: 1-exists (no value); 2-equal
    effect: 1-all; 2-no schedule; 3-prefer no schedule; 4-no executes (this allows for seconds)
  */
export const tolerationsData = [
  {
    key:      'key1',
    operator: 1,
    effect:   1
  },
  {
    key:      'key2',
    operator: 2,
    value:    'val2',
    effect:   1
  },
  {
    key:      'key3',
    operator: 2,
    value:    'val3',
    effect:   2
  },
  {
    key:      'key4',
    operator: 2,
    value:    'val4',
    effect:   3
  },
  {
    key:      'key5',
    operator: 2,
    value:    'val5',
    effect:   4,
    seconds:  45
  },
];

// pod affinity/anti-affinity data
/*
    affinityType: 1-affinity; 2-anti-affinity;
    priority: 1-preferred (has weight); 2-required;
    namespaceType: 0-this pod namespace; 1-all namespaces ;2-pod in these namespaces
    expressions: [
      {
        operator: 1-in list; 2-not in list; 3-is set (no value) ; 4-is not set (no value)
      }
    ]
  */
export const podAffinityData = [
  {
    affinityType:  1,
    priority:      1,
    namespaceType: 0,
    expressions:   [
      {
        key:      'key1',
        operator: 1,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 2,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 3,
      },
      {
        key:      'key4',
        operator: 4,
      },
    ],
    topology: 'some-topology1',
    weight:   10,
  },
  {
    affinityType:  1,
    priority:      2,
    namespaceType: 1,
    expressions:   [
      {
        key:      'key1',
        operator: 1,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 2,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 3,
      },
      {
        key:      'key4',
        operator: 4,
      },
    ],
    topology: 'some-topology2'
  },
  {
    affinityType:  1,
    priority:      2,
    namespaceType: 2,
    namespaces:    'system,fleet-default',
    topology:      'some-topology3'
  },
  {
    affinityType:  2,
    priority:      1,
    namespaceType: 0,
    expressions:   [
      {
        key:      'key1',
        operator: 1,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 2,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 3,
      },
      {
        key:      'key4',
        operator: 4,
      },
    ],
    topology: 'some-topology1',
    weight:   10,
  },
  {
    affinityType:  2,
    priority:      2,
    namespaceType: 1,
    expressions:   [
      {
        key:      'key1',
        operator: 1,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 2,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 3,
      },
      {
        key:      'key4',
        operator: 4,
      },
    ],
    topology: 'some-topology2'
  },
  {
    affinityType:  2,
    priority:      2,
    namespaceType: 2,
    namespaces:    'system,fleet-default',
    topology:      'some-topology3'
  },
];

// node affinity data
/*
    priority: 1-preferred (has weight); 2-required;
    expressions: [
      {
        matching: 1-expressions; 2-fields
        operator: 1-in list; 2-not in list; 3-is set (no value) ; 4-is not set (no value); 5-less than; 6-greather than
      }
    ]
  */
export const nodeAffinityData = [
  {
    priority:    1,
    expressions: [
      {
        matching: 1,
        key:      'key1',
        operator: 1,
        value:    'val1'
      },
      {
        matching: 1,
        key:      'key2',
        operator: 2,
        value:    'val2'
      },
      {
        matching: 1,
        key:      'key3',
        operator: 3,
      },
      {
        matching: 1,
        key:      'key4',
        operator: 4,
      },
      {
        matching: 1,
        key:      'key5',
        operator: 5,
        value:    'val5'
      },
      {
        matching: 1,
        key:      'key6',
        operator: 6,
        value:    'val6'
      },
    ],
    weight: 10,
  },
  {
    priority:    2,
    expressions: [
      {
        matching: 2,
        key:      'key1',
        operator: 1,
        value:    'val1'
      },
      {
        matching: 2,
        key:      'key2',
        operator: 2,
        value:    'val2'
      },
      {
        matching: 2,
        key:      'key3',
        operator: 3,
      },
      {
        matching: 2,
        key:      'key4',
        operator: 4,
      },
      {
        matching: 2,
        key:      'key5',
        operator: 5,
        value:    'val5'
      },
      {
        matching: 2,
        key:      'key6',
        operator: 6,
        value:    'val6'
      },
    ]
  },
];
