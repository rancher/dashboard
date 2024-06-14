// GET /v1/events - small set of events data
const eventsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: `${ Cypress.env('api') }/v1/events` },
  createTypes:  { event: `${ Cypress.env('api') }/v1/events` },
  actions:      {},
  resourceType: 'event',
  revision:     '95942',
  count:        3,
  data:         [
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }
  ]
};

// GET /v1/events - large set of events data
const eventsGetResponseLargeSet = {
  type:         'collection',
  links:        { self: `${ Cypress.env('api') }/v1/events` },
  createTypes:  { event: `${ Cypress.env('api') }/v1/events` },
  actions:      {},
  resourceType: 'event',
  revision:     '95942',
  count:        125,
  data:         [
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '12m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '1m',
          1,
          'aaa-e2e-vai-test-event-name'
        ],
        name:            'aaa-e2e-vai-test-event-name',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    },
    {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }, {
      id:         'cattle-fleet-local-system/fleet-agent-0.17d80b90a6d2c7ab',
      type:       'event',
      _type:      'dummy_data',
      apiVersion: 'v1',
      metadata:   {
        fields: [
          '7m',
          'Normal',
          'Killing',
          'pod/fleet-agent-0',
          'spec.containers{fleet-agent}',
          'kubelet, ip-172-31-2-245.us-east-2.compute.internal',
          'Stopping container fleet-agent',
          '7m',
          1,
          'fleet-agent-0.17d80b90a6d2c7ab'
        ],
        name:            'fleet-agent-0.17d80b90a6d2c7ab',
        namespace:       'cattle-fleet-local-system',
        relationships:   null,
        resourceVersion: '0',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
      },
      reason: 'e2e-vai-regression-test',
    }
  ]
};

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function generateEventsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/events?*', reply(200, eventsGetResponseSmallSet)).as('eventsDataSmall');
}

export function generateEventsDataLarge(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/events?*', reply(200, eventsGetResponseLargeSet)).as('eventsDataLarge');
}
