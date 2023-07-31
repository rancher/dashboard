// tolerations data
/*
    operator: 0-equal; 1-exists (no value)
    effect: 0-noSchedule (no seconds); 1-noExecute; 2-preferNoSchedule (no seconds); 3-all (no seconds)
  */
export const tolerationsData = [
  {
    key:      'key1',
    operator: 1,
    effect:   3
  },
  {
    key:      'key2',
    operator: 0,
    value:    'val2',
    effect:   3
  },
  {
    key:      'key3',
    operator: 0,
    value:    'val3',
    effect:   0
  },
  {
    key:      'key4',
    operator: 0,
    value:    'val4',
    effect:   2
  },
  {
    key:      'key5',
    operator: 0,
    value:    'val5',
    effect:   1,
    seconds:  45
  },
];

// node affinity data
/*
    priority: 0-required; 1-preferred (has weight);
    expressions: [
      {
        matching: 0-expressions; 1-fields
        operator: 0-in list; 1-not in list; 2-is set (no value) ; 3-is not set (no value); 4-less than; 5-greather than
      }
    ]
  */
export const nodeAffinityData = [
  {
    priority:    1,
    expressions: [
      {
        matching: 0,
        key:      'key1',
        operator: 0,
        value:    'val1'
      },
      {
        matching: 0,
        key:      'key2',
        operator: 1,
        value:    'val2'
      },
      {
        matching: 0,
        key:      'key3',
        operator: 2,
      },
      {
        matching: 0,
        key:      'key4',
        operator: 3,
      },
      {
        matching: 0,
        key:      'key5',
        operator: 5,
        value:    'val5'
      },
      {
        matching: 0,
        key:      'key6',
        operator: 4,
        value:    'val6'
      },
    ],
    weight: 10,
  },
  {
    priority:    0,
    expressions: [
      {
        matching: 1,
        key:      'key1',
        operator: 0,
        value:    'val1'
      },
      {
        matching: 1,
        key:      'key2',
        operator: 1,
        value:    'val2'
      },
      {
        matching: 1,
        key:      'key3',
        operator: 2,
      },
      {
        matching: 1,
        key:      'key4',
        operator: 3,
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
        operator: 4,
        value:    'val6'
      },
    ]
  },
];

// pod affinity/anti-affinity data
/*
    affinityType: 0-anti-affinity; 1-affinity;
    priority:  0-required; 1-preferred (has weight);
    namespaceType: 0-this pod namespace; 1-all namespaces ;2-pod in these namespaces
    expressions: [
      {
        operator: 0-in list; 1-not in list; 2-is set (no value) ; 3-is not set (no value);
      }
    ]
  */
export const podAffinityData = [
  {
    affinityType: 'Affinity',

    priority:      'Preferred',
    namespaceType: 0,
    expressions:   [
      {
        key:      'key1',
        operator: 0,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 1,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 2,
      },
      {
        key:      'key4',
        operator: 3,
      },
    ],
    topology: 'some-topology1',
    weight:   10,
  },
  {
    affinityType: 'Affinity',

    priority:      'Required',
    namespaceType: 1,
    expressions:   [
      {
        key:      'key1',
        operator: 0,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 1,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 2,
      },
      {
        key:      'key4',
        operator: 3,
      },
    ],
    topology: 'some-topology2'
  },
  {
    affinityType: 'Affinity',

    priority:      'Required',
    namespaceType: 2,
    namespaces:    'system,fleet-default',
    topology:      'some-topology3'
  },
  {
    affinityType: 'AntiAffinity',

    priority:      'Preferred',
    namespaceType: 0,
    expressions:   [
      {
        key:      'key1',
        operator: 0,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 1,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 2,
      },
      {
        key:      'key4',
        operator: 3,
      },
    ],
    topology: 'some-topology1',
    weight:   10,
  },
  {
    affinityType: 'AntiAffinity',

    priority:      'Required',
    namespaceType: 1,
    expressions:   [
      {
        key:      'key1',
        operator: 0,
        value:    'val1'
      },
      {
        key:      'key2',
        operator: 1,
        value:    'val2'
      },
      {
        key:      'key3',
        operator: 2,
      },
      {
        key:      'key4',
        operator: 3,
      },
    ],
    topology: 'some-topology2'
  },
  {
    affinityType: 'AntiAffinity',

    priority:      'Required',
    namespaceType: 2,
    namespaces:    'system,fleet-default',
    topology:      'some-topology3'
  },
];

export const requestAndLimitsEditData = {
  request: {
    cpu:    20,
    memory: 30
  },
  limit: {
    cpu:    40,
    memory: 50
  },
};

export const tolerationsEditData = [
  {
    key:      'key9000',
    operator: 0,
    effect:   3,
    value:    'val9000'
  },
];
