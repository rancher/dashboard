import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

// GET /v1/management.cattle.io.fleetworkspaces - small set of fleet workspaces data
const fleetworkspacesGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29h3.qa.rancher.space/v1/management.cattle.io.fleetworkspaces' },
  actions:      {},
  resourceType: 'management.cattle.io.fleetworkspace',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        2,
  data:         [
    {
      id:    'fleet-default',
      type:  'management.cattle.io.fleetworkspace',
      links: {
        remove: 'blocked',
        self:   'https://yonasb29h3.qa.rancher.space/v1/management.cattle.io.fleetworkspaces/fleet-default',
        update: 'blocked',
        view:   'https://yonasb29h3.qa.rancher.space/v1/management.cattle.io.fleetworkspaces/fleet-default'
      },
      apiVersion: 'management.cattle.io/v3',
      kind:       'FleetWorkspace',
      metadata:   {
        creationTimestamp: '2024-07-08T22:18:07Z',
        fields:            [
          'fleet-default',
          '25h'
        ],
        generation:    1,
        name:          'fleet-default',
        relationships: [
          {
            toId:   'fleet-default',
            toType: 'namespace',
            rel:    'applies',
            state:  'active'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '3bda91af-c5b1-4551-8370-53f680f12668'
      },
      status: {}
    },
    {
      id:    'fleet-local',
      type:  'management.cattle.io.fleetworkspace',
      links: {
        remove: 'blocked',
        self:   'https://yonasb29h3.qa.rancher.space/v1/management.cattle.io.fleetworkspaces/fleet-local',
        update: 'blocked',
        view:   'https://yonasb29h3.qa.rancher.space/v1/management.cattle.io.fleetworkspaces/fleet-local'
      },
      apiVersion: 'management.cattle.io/v3',
      kind:       'FleetWorkspace',
      metadata:   {
        annotations:       { 'provisioning.cattle.io/managed': 'false' },
        creationTimestamp: '2024-07-08T22:18:14Z',
        fields:            [
          'fleet-local',
          '25h'
        ],
        generation:      1,
        name:            'fleet-local',
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind:       'Namespace',
            name:       'fleet-local',
            uid:        '37d5350d-4fa8-4046-9d5b-8e4a8834eae4'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-local',
            fromType: 'namespace',
            rel:      'owner',
            state:    'active'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '1f6e7561-9bf4-46f4-8081-fa5679b054bd'
      },
      status: {}
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

export function generateFleetWorkspacesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/management.cattle.io.fleetworkspaces?*', reply(200, fleetworkspacesGetResponseSmallSet)).as('fleetworkspacesDataSmall');
}
