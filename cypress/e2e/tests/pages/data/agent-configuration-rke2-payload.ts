export const payloadComparisonData = {
  clusterAgentDeploymentCustomization: {
    overrideAffinity: {
      podAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            _namespaceOption:  'all',
            matchExpressions:  [],
            namespaceSelector: {},
            namespaces:        null,
            _namespaces:       null,
            labelSelector:     {
              matchExpressions: [
                {
                  key:      'key1',
                  operator: 'In',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist'
                }
              ]
            },
            topologyKey: 'some-topology2'
          },
          {
            _namespaceOption:  'selected',
            matchExpressions:  [],
            namespaces:        'system,fleet-default',
            _namespaces:       'system,fleet-default',
            namespaceSelector: null,
            topologyKey:       'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              _namespaceOption:  'pod',
              matchExpressions:  [],
              weight:            10,
              namespaces:        null,
              _namespaces:       null,
              namespaceSelector: null,
              labelSelector:     {
                matchExpressions: [
                  {
                    key:      'key1',
                    operator: 'In',
                    values:   [
                      'val1'
                    ]
                  },
                  {
                    key:      'key2',
                    operator: 'NotIn',
                    values:   [
                      'val2'
                    ]
                  },
                  {
                    key:      'key3',
                    operator: 'Exists'
                  },
                  {
                    key:      'key4',
                    operator: 'DoesNotExist'
                  }
                ]
              },
              topologyKey: 'some-topology1'
            },
            weight: 10
          }
        ]
      },
      podAntiAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            _namespaceOption:  'all',
            matchExpressions:  [],
            _anti:             true,
            namespaceSelector: {},
            namespaces:        null,
            _namespaces:       null,
            labelSelector:     {
              matchExpressions: [
                {
                  key:      'key1',
                  operator: 'In',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist'
                }
              ]
            },
            topologyKey: 'some-topology2'
          },
          {
            _namespaceOption:  'selected',
            matchExpressions:  [],
            _anti:             true,
            namespaces:        'system,fleet-default',
            _namespaces:       'system,fleet-default',
            namespaceSelector: null,
            topologyKey:       'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              _namespaceOption:  'pod',
              matchExpressions:  [],
              _anti:             true,
              weight:            10,
              namespaces:        null,
              _namespaces:       null,
              namespaceSelector: null,
              labelSelector:     {
                matchExpressions: [
                  {
                    key:      'key1',
                    operator: 'In',
                    values:   [
                      'val1'
                    ]
                  },
                  {
                    key:      'key2',
                    operator: 'NotIn',
                    values:   [
                      'val2'
                    ]
                  },
                  {
                    key:      'key3',
                    operator: 'Exists'
                  },
                  {
                    key:      'key4',
                    operator: 'DoesNotExist'
                  }
                ]
              },
              topologyKey: 'some-topology1'
            },
            weight: 10
          }
        ]
      },
      nodeAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight:     10,
            preference: {
              matchExpressions: [
                {
                  key:      'key1',
                  operator: 'In',
                  matching: 'matchExpressions',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  matching: 'matchExpressions',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists',
                  matching: 'matchExpressions'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                  matching: 'matchExpressions'
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  matching: 'matchExpressions',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  matching: 'matchExpressions',
                  values:   [
                    'val6'
                  ]
                }
              ],
              weight: 10
            }
          }
        ],
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [],
              matchFields:      [
                {
                  key:      'key1',
                  operator: 'In',
                  matching: 'matchFields',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  matching: 'matchFields',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists',
                  matching: 'matchFields'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                  matching: 'matchFields'
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  matching: 'matchFields',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  matching: 'matchFields',
                  values:   [
                    'val6'
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    appendTolerations: [
      {
        key:      'key1',
        operator: 'Exists',
        effect:   'All'
      },
      {
        key:      'key2',
        operator: 'Equal',
        value:    'val2',
        effect:   'All'
      },
      {
        key:      'key3',
        operator: 'Equal',
        value:    'val3',
        effect:   'NoSchedule'
      },
      {
        key:      'key4',
        operator: 'Equal',
        value:    'val4',
        effect:   'PreferNoSchedule'
      },
      {
        key:               'key5',
        operator:          'Equal',
        value:             'val5',
        effect:            'NoExecute',
        tolerationSeconds: 45
      }
    ],
    overrideResourceRequirements: {
      requests: {
        cpu:    '1m',
        memory: '1Mi'
      },
      limits: {
        cpu:    '2m',
        memory: '2Mi'
      }
    }
  },
  fleetAgentDeploymentCustomization: {
    overrideAffinity: {
      podAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            _namespaceOption:  'all',
            matchExpressions:  [],
            namespaceSelector: {},
            namespaces:        null,
            _namespaces:       null,
            labelSelector:     {
              matchExpressions: [
                {
                  key:      'key1',
                  operator: 'In',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist'
                }
              ]
            },
            topologyKey: 'some-topology2'
          },
          {
            _namespaceOption:  'selected',
            matchExpressions:  [],
            namespaces:        'system,fleet-default',
            _namespaces:       'system,fleet-default',
            namespaceSelector: null,
            topologyKey:       'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              _namespaceOption:  'pod',
              matchExpressions:  [],
              weight:            10,
              namespaces:        null,
              _namespaces:       null,
              namespaceSelector: null,
              labelSelector:     {
                matchExpressions: [
                  {
                    key:      'key1',
                    operator: 'In',
                    values:   [
                      'val1'
                    ]
                  },
                  {
                    key:      'key2',
                    operator: 'NotIn',
                    values:   [
                      'val2'
                    ]
                  },
                  {
                    key:      'key3',
                    operator: 'Exists'
                  },
                  {
                    key:      'key4',
                    operator: 'DoesNotExist'
                  }
                ]
              },
              topologyKey: 'some-topology1'
            },
            weight: 10
          }
        ]
      },
      podAntiAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            _namespaceOption:  'all',
            matchExpressions:  [],
            _anti:             true,
            namespaceSelector: {},
            namespaces:        null,
            _namespaces:       null,
            labelSelector:     {
              matchExpressions: [
                {
                  key:      'key1',
                  operator: 'In',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist'
                }
              ]
            },
            topologyKey: 'some-topology2'
          },
          {
            _namespaceOption:  'selected',
            matchExpressions:  [],
            _anti:             true,
            namespaces:        'system,fleet-default',
            _namespaces:       'system,fleet-default',
            namespaceSelector: null,
            topologyKey:       'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              _namespaceOption:  'pod',
              matchExpressions:  [],
              _anti:             true,
              weight:            10,
              namespaces:        null,
              _namespaces:       null,
              namespaceSelector: null,
              labelSelector:     {
                matchExpressions: [
                  {
                    key:      'key1',
                    operator: 'In',
                    values:   [
                      'val1'
                    ]
                  },
                  {
                    key:      'key2',
                    operator: 'NotIn',
                    values:   [
                      'val2'
                    ]
                  },
                  {
                    key:      'key3',
                    operator: 'Exists'
                  },
                  {
                    key:      'key4',
                    operator: 'DoesNotExist'
                  }
                ]
              },
              topologyKey: 'some-topology1'
            },
            weight: 10
          }
        ]
      },
      nodeAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight:     10,
            preference: {
              matchExpressions: [
                {
                  key:      'key1',
                  operator: 'In',
                  matching: 'matchExpressions',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  matching: 'matchExpressions',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists',
                  matching: 'matchExpressions'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                  matching: 'matchExpressions'
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  matching: 'matchExpressions',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  matching: 'matchExpressions',
                  values:   [
                    'val6'
                  ]
                }
              ],
              weight: 10
            }
          }
        ],
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [],
              matchFields:      [
                {
                  key:      'key1',
                  operator: 'In',
                  matching: 'matchFields',
                  values:   [
                    'val1'
                  ]
                },
                {
                  key:      'key2',
                  operator: 'NotIn',
                  matching: 'matchFields',
                  values:   [
                    'val2'
                  ]
                },
                {
                  key:      'key3',
                  operator: 'Exists',
                  matching: 'matchFields'
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                  matching: 'matchFields'
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  matching: 'matchFields',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  matching: 'matchFields',
                  values:   [
                    'val6'
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    appendTolerations: [
      {
        key:      'key1',
        operator: 'Exists',
        effect:   'All'
      },
      {
        key:      'key2',
        operator: 'Equal',
        value:    'val2',
        effect:   'All'
      },
      {
        key:      'key3',
        operator: 'Equal',
        value:    'val3',
        effect:   'NoSchedule'
      },
      {
        key:      'key4',
        operator: 'Equal',
        value:    'val4',
        effect:   'PreferNoSchedule'
      },
      {
        key:               'key5',
        operator:          'Equal',
        value:             'val5',
        effect:            'NoExecute',
        tolerationSeconds: 45
      }
    ],
    overrideResourceRequirements: {
      requests: {
        cpu:    '1m',
        memory: '1Mi'
      },
      limits: {
        cpu:    '2m',
        memory: '2Mi'
      }
    }
  },
};
