export const handleConflictUseCases = [
  // 2 same keys entries but with different values, 1 different key, removing one of the same keys
  // remove from array
  // covers https://github.com/rancher/dashboard/issues/14397
  {
    description: 'delete from array',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '3961358' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'create-cluster-selector',
                    operator: 'In',
                    values:   [
                      'cccc'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'cccc' }
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '3960953' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'bbb'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'cccc' }
              }
            }
          }
        }
      },
      initialConfig: {
        metadata: { resourceVersion: '3960910' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'bbb'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'cccc' }
              }
            }
          }
        },
        __clone: true
      }
    },
    result:           false,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'aaa'
                  ]
                },
                {
                  key:      'create-cluster-selector',
                  operator: 'In',
                  values:   [
                    'cccc'
                  ]
                }
              ],
              matchLabels: { 'create-cluster-selector': 'cccc' }
            }
          }
        }
      },
    }
  },
  // 2 different keys, removing one of them
  // remove from array
  // covers https://github.com/rancher/dashboard/issues/14397
  {
    description: 'emptying array',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '970275' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '970275' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      {
                  'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC',
                  key:                       'key1'
                }
              }
            }
          }
        },
        __clone: true
      },
      initialConfig: {
        metadata: { resourceVersion: '970275' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      {
                  'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC',
                  key:                       'key1'
                }
              }
            }
          }
        }
      }
    },
    result:           false,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
            }
          }
        }
      },
    }
  },
  // 1 key left, removing it (no selectors)
  // covers https://github.com/rancher/dashboard/issues/14397
  // remove from object
  {
    description: 'emptying object',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      {}
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        },
        __clone: true
      },
      initialConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        }
      }
    },
    result:           false,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      {}
            }
          }
        }
      }
    }
  },
  // add to array
  {
    description: 'add to array',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '3961358' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'bbb'
                    ]
                  },
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'ccc'
                    ]
                  },
                  {
                    key:      'create-cluster-selector',
                    operator: 'In',
                    values:   [
                      'cccc'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'cccc' }
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '3960953' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'bbb'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'cccc' }
              }
            }
          }
        }
      },
      initialConfig: {
        metadata: { resourceVersion: '3960910' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'bbb'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'cccc' }
              }
            }
          }
        },
        __clone: true
      }
    },
    result:           false,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'aaa'
                  ]
                },
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'bbb'
                  ]
                },
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'ccc'
                  ]
                },
                {
                  key:      'create-cluster-selector',
                  operator: 'In',
                  values:   [
                    'cccc'
                  ]
                }
              ],
              matchLabels: { 'create-cluster-selector': 'cccc' }
            }
          }
        }
      },
    }
  },
  // edit an array
  {
    description: 'edit an array',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '970275' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa-edited'
                    ]
                  },
                  {
                    key:      'create-cluster-selector',
                    operator: 'In',
                    values:   [
                      'cccc'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '970275' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'create-cluster-selector',
                    operator: 'In',
                    values:   [
                      'cccc'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        },
        __clone: true
      },
      initialConfig: {
        metadata: { resourceVersion: '970275' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [
                  {
                    key:      'key',
                    operator: 'In',
                    values:   [
                      'aaa'
                    ]
                  },
                  {
                    key:      'create-cluster-selector',
                    operator: 'In',
                    values:   [
                      'cccc'
                    ]
                  }
                ],
                matchLabels: { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        }
      }
    },
    result:           false,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'aaa-edited'
                  ]
                },
                {
                  key:      'create-cluster-selector',
                  operator: 'In',
                  values:   [
                    'cccc'
                  ]
                }
              ],
              matchLabels: { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
            }
          }
        }
      },
    }
  },
  // add key to object
  {
    description: 'add key to object',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC', 'new-key': 'new-value' }
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        },
        __clone: true
      },
      initialConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        }
      }
    },
    result:           false,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC', 'new-key': 'new-value' }
            }
          }
        }
      }
    }
  },
  // edit an object key value
  {
    description: 'edit object key-value',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC-edited' }
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        },
        __clone: true
      },
      initialConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: [],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        }
      }
    },
    result:           false,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC-edited' }
            }
          }
        }
      }
    }
  },
  // FAIL!!! - matchLabels changed on both latest and current + resourceVersion on latest
  // basic fail usecase
  {
    description: 'with basic conflict',
    data:        {
      currentConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: ['current_user_update_exp'],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC_current_user_update' }
              }
            }
          }
        },
        __clone: true
      },
      latestConfig: {
        metadata: { resourceVersion: '970344' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: ['live_server_value'],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxClive_server_value' }
              }
            }
          }
        },
        __clone: true
      },
      initialConfig: {
        metadata: { resourceVersion: '970343' },
        spec:     {
          template: {
            metadata: {},
            spec:     {
              selector: {
                matchExpressions: ['some-exp'],
                matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
              }
            }
          }
        }
      }
    },
    result:           1,
    outputValidation: {
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: ['live_server_value'],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxClive_server_value' }
            }
          }
        }
      },
    }
  }
];
