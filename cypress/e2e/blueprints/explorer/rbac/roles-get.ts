import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/rbac.authorization.k8s.io.roles - return empty roles data
const rolesGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/rbac.authorization.k8s.io.roles' },
  createTypes:  { 'rbac.authorization.k8s.io.role': 'https://localhost:8005/v1/rbac.authorization.k8s.io.roles' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.role',
  count:        0,
  data:         []
};

// GET /v1/rbac.authorization.k8s.io.roles - small set of roles data
const rolesResponseSmallSet = (namespace = 'kube-system') => ({
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/rbac.authorization.k8s.io.roles' },
  createTypes:  { 'rbac.authorization.k8s.io.role': 'https://localhost:8005/v1/rbac.authorization.k8s.io.roles' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.role',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        2,
  data:         [
    {
      id:    'cattle-fleet-system/fleet-controller',
      type:  'rbac.authorization.k8s.io.role',
      links: {
        remove: 'https://localhost:8005/v1/rbac.authorization.k8s.io.roles/cattle-fleet-system/fleet-controller',
        self:   'https://localhost:8005/v1/rbac.authorization.k8s.io.roles/cattle-fleet-system/fleet-controller',
        update: 'https://localhost:8005/v1/rbac.authorization.k8s.io.roles/cattle-fleet-system/fleet-controller',
        view:   'https://localhost:8005/apis/rbac.authorization.k8s.io/v1/namespaces/cattle-fleet-system/roles/fleet-controller'
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'Role',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'fleet',
          'meta.helm.sh/release-namespace': 'cattle-fleet-system'
        },
        creationTimestamp: '2024-07-08T22:19:38Z',
        fields:            [
          'fleet-controller',
          '2024-07-08T22:19:38Z'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-role'
        ],
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        name:          'fleet-controller',
        namespace:     'cattle-fleet-system',
        relationships: [
          {
            fromId:   'cattle-fleet-system/fleet',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'ddd1ec36-909d-491f-bb90-9afeb65f2dc7'
      },
      rules: [
        {
          apiGroups: [
            ''
          ],
          resources: [
            'configmaps'
          ],
          verbs: [
            '*'
          ]
        },
        {
          apiGroups: [
            'coordination.k8s.io'
          ],
          resources: [
            'leases'
          ],
          verbs: [
            '*'
          ]
        }
      ]
    },
    {
      id:    `${ namespace }/extension-apiserver-authentication-reader`,
      type:  'rbac.authorization.k8s.io.role',
      links: {
        remove: `https://localhost:8005/v1/rbac.authorization.k8s.io.roles/${ namespace }/extension-apiserver-authentication-reader`,
        self:   `https://localhost:8005/v1/rbac.authorization.k8s.io.roles/${ namespace }/extension-apiserver-authentication-reader`,
        update: `https://localhost:8005/v1/rbac.authorization.k8s.io.roles/${ namespace }/extension-apiserver-authentication-reader`,
        view:   `https://localhost:8005/apis/rbac.authorization.k8s.io/v1/namespaces/${ namespace }/roles/extension-apiserver-authentication-reader`
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'Role',
      metadata:   {
        annotations:       { 'rbac.authorization.kubernetes.io/autoupdate': 'true' },
        creationTimestamp: '2024-07-08T22:02:19Z',
        fields:            [
          'extension-apiserver-authentication-reader',
          '2024-07-08T22:02:19Z'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-role'
        ],
        labels:          { 'kubernetes.io/bootstrapping': 'rbac-defaults' },
        name:            'extension-apiserver-authentication-reader',
        namespace,
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '39e41daf-e4f0-4141-b707-bc4bc4133090'
      },
      rules: [
        {
          apiGroups: [
            ''
          ],
          resourceNames: [
            'extension-apiserver-authentication'
          ],
          resources: [
            'configmaps'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        }
      ]
    },
  ]
});

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function rolesNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.roles?*', reply(200, rolesGetResponseEmpty)).as('rolesNoData');
}

export function generateRolesDataSmall(as: string, namespace?: string): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.roles?*', reply(200, rolesResponseSmallSet(namespace))).as(as);
}
