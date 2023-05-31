export const payloadComparisonData = {
  clusterAgentDeploymentCustomization: {
    overrideAffinity: {
      nodeAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight:     10,
            preference: {
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
                  operator: 'Exists',
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  values:   [
                    'val6'
                  ]
                }
              ],
            }
          }
        ],
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchFields: [
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
                  operator: 'Exists',
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  values:   [
                    'val6'
                  ]
                }
              ]
            }
          ]
        }
      },
      podAntiAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            namespaceSelector: {},
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
            namespaces: [
              'system',
              'fleet-default'
            ],
            topologyKey: 'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              namespaces:    null,
              labelSelector: {
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
      podAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            namespaceSelector: {},
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
            namespaces: [
              'system',
              'fleet-default'
            ],
            topologyKey: 'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              namespaces:    null,
              weight:        10,
              labelSelector: {
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
      }
    },
    appendTolerations: [
      {
        key:      'key1',
        operator: 'Exists',
      },
      {
        key:      'key2',
        operator: 'Equal',
        value:    'val2',
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
      nodeAffinity: {
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            weight:     10,
            preference: {
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
                  operator: 'Exists',
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  values:   [
                    'val6'
                  ]
                }
              ],
            }
          }
        ],
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchFields: [
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
                  operator: 'Exists',
                },
                {
                  key:      'key4',
                  operator: 'DoesNotExist',
                },
                {
                  key:      'key5',
                  operator: 'Lt',
                  values:   [
                    'val5'
                  ]
                },
                {
                  key:      'key6',
                  operator: 'Gt',
                  values:   [
                    'val6'
                  ]
                }
              ]
            }
          ]
        }
      },
      podAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: [
          {
            namespaceSelector: {},
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
            namespaces: [
              'system',
              'fleet-default'
            ],
            topologyKey: 'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              namespaces:    null,
              weight:        10,
              labelSelector: {
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
            namespaceSelector: {},
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
            namespaces: [
              'system',
              'fleet-default'
            ],
            topologyKey: 'some-topology3'
          }
        ],
        preferredDuringSchedulingIgnoredDuringExecution: [
          {
            podAffinityTerm: {
              namespaces:    null,
              labelSelector: {
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
      }
    },
    appendTolerations: [
      {
        key:      'key1',
        operator: 'Exists',
      },
      {
        key:      'key2',
        operator: 'Equal',
        value:    'val2',
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
  }
};
