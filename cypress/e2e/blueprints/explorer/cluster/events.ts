import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/events - return empty events data
const eventsGetEmptyEventsSet = {
  type:         'collection',
  links:        { self: `${ Cypress.env('api') }/v1/events` },
  createTypes:  { event: `${ Cypress.env('api') }/v1/events` },
  actions:      {},
  resourceType: 'event',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION, // The UI will use this point in history to start watching for changes from. If it's too low (than the global system revision) we will spam with requests
  data:         []
};

// GET /v1/events - small set of events data
const eventsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: `${ Cypress.env('api') }/v1/events` },
  createTypes:  { event: `${ Cypress.env('api') }/v1/events` },
  actions:      {},
  resourceType: 'event',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION, // The UI will use this point in history to start watching for changes from. If it's too low (than the global system revision) we will spam with requests
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
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
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
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
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
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
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

export function eventsNoDataset(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/events?*', reply(200, eventsGetEmptyEventsSet)).as('eventsNoData');
}

export function generateEventsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/events?*', reply(200, eventsGetResponseSmallSet)).as('eventsDataSmall');
}
