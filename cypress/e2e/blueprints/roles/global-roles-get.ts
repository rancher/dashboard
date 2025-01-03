import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

// GET /v1/management.cattle.io.globalroles - small set of pods data
const globalRolesGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles' },
  createTypes:  { 'management.cattle.io.globalrole': 'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles' },
  actions:      {},
  resourceType: 'management.cattle.io.globalrole',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION, // The UI will use this point in history to start watching for changes from. If it's too low (than the global system revision) we will spam with requests
  count:        2,
  data:         [
    {
      id:    'admin',
      type:  'management.cattle.io.globalrole',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/admin',
        self:   'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/admin',
        update: 'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/admin',
        view:   'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/admin'
      },
      apiVersion:  'management.cattle.io/v3',
      builtin:     true,
      displayName: 'Admin',
      kind:        'GlobalRole',
      metadata:    {
        annotations:       { 'lifecycle.cattle.io/create.mgmt-auth-gr-controller': 'true' },
        creationTimestamp: '2024-06-27T20:32:52Z',
        fields:            [
          'admin',
          'Completed',
          '5d'
        ],
        finalizers: [
          'controller.cattle.io/mgmt-auth-gr-controller'
        ],
        generation:    1,
        labels:        { 'authz.management.cattle.io/bootstrapping': 'default-globalrole' },
        name:          'admin',
        relationships: [
          {
            toId:    'cattle-global-data/admin-global-catalog',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-globalrole-admin',
            toType:  'rbac.authorization.k8s.io.clusterrole',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '6017587e-2bce-4227-9f32-65728a0b7efe'
      },
      rules: [
        {
          apiGroups: [
            '*'
          ],
          resources: [
            '*'
          ],
          verbs: [
            '*'
          ]
        },
        {
          nonResourceURLs: [
            '*'
          ],
          verbs: [
            '*'
          ]
        }
      ],
      status: {
        conditions: [
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:33:16Z',
            lastUpdateTime:     '2024-06-27T20:33:16Z',
            message:            'cattle-globalrole-admin created',
            reason:             'ClusterRoleExists',
            status:             'True',
            transitioning:      false,
            type:               'ClusterRoleExists'
          },
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:33:16Z',
            lastUpdateTime:     '2024-06-27T20:33:16Z',
            message:            'admin-global-catalog created',
            reason:             'CatalogRoleExists',
            status:             'True',
            transitioning:      false,
            type:               'CatalogRoleExists'
          }
        ],
        lastUpdateTime:     '2024-06-27 20:33:16.427613501 +0000 UTC m=+43.214710176',
        observedGeneration: 1,
        summary:            'Completed'
      }
    },
    {
      id:    'authn-manage',
      type:  'management.cattle.io.globalrole',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/authn-manage',
        self:   'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/authn-manage',
        update: 'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/authn-manage',
        view:   'https://yonasb29head.qa.rancher.space/v1/management.cattle.io.globalroles/authn-manage'
      },
      apiVersion:  'management.cattle.io/v3',
      builtin:     true,
      displayName: 'Manage Authentication',
      kind:        'GlobalRole',
      metadata:    {
        annotations:       { 'lifecycle.cattle.io/create.mgmt-auth-gr-controller': 'true' },
        creationTimestamp: '2024-06-27T20:32:58Z',
        fields:            [
          'authn-manage',
          'Completed',
          '5d'
        ],
        finalizers: [
          'controller.cattle.io/mgmt-auth-gr-controller'
        ],
        generation:    1,
        labels:        { 'authz.management.cattle.io/bootstrapping': 'default-globalrole' },
        name:          'authn-manage',
        relationships: [
          {
            toId:    'cattle-globalrole-authn-manage',
            toType:  'rbac.authorization.k8s.io.clusterrole',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'db7745a2-1660-487c-9d56-d16c6b5adae0'
      },
      rules: [
        {
          apiGroups: [
            'management.cattle.io'
          ],
          resources: [
            'authconfigs'
          ],
          verbs: [
            'get',
            'list',
            'watch',
            'update'
          ]
        }
      ],
      status: {
        conditions: [
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:33:15Z',
            lastUpdateTime:     '2024-06-27T20:33:15Z',
            message:            'cattle-globalrole-authn-manage created',
            reason:             'ClusterRoleExists',
            status:             'True',
            transitioning:      false,
            type:               'ClusterRoleExists'
          }
        ],
        lastUpdateTime:     '2024-06-27 20:33:15.675703864 +0000 UTC m=+42.462800539',
        observedGeneration: 1,
        summary:            'Completed'
      }
    },
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

export function generateGlobalRolesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/management.cattle.io.globalroles?*', reply(200, globalRolesGetResponseSmallSet)).as('globalRolesDataSmall');
}
