import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/rbac.authorization.k8s.io.clusterrolebinding - return empty cluster roles data
const clusterRolesGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles' },
  createTypes:  { 'rbac.authorization.k8s.io.clusterrole': 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.clusterrole',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/rbac.authorization.k8s.io.clusterrolebinding - small set of cluster roles data
const clusterRolesResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles' },
  createTypes:  { 'rbac.authorization.k8s.io.clusterrole': 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.clusterrole',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        2,
  data:         [
    {
      id:    'admin',
      type:  'rbac.authorization.k8s.io.clusterrole',
      links: {
        remove: 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles/admin',
        self:   'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles/admin',
        update: 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles/admin',
        view:   'https://yonasb29h3.qa.rancher.space/apis/rbac.authorization.k8s.io/v1/clusterroles/admin'
      },
      aggregationRule: {
        clusterRoleSelectors: [
          { matchLabels: { 'rbac.authorization.k8s.io/aggregate-to-admin': 'true' } }
        ]
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'ClusterRole',
      metadata:   {
        annotations:       { 'rbac.authorization.kubernetes.io/autoupdate': 'true' },
        creationTimestamp: '2024-07-08T22:02:18Z',
        fields:            [
          'admin',
          '2024-07-08T22:02:18Z'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-crole'
        ],
        labels:          { 'kubernetes.io/bootstrapping': 'rbac-defaults' },
        name:            'admin',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'fc508973-7781-4865-abaa-6563b197cf97'
      },
      rules: []
    },
    {
      id:    'calico-node',
      type:  'rbac.authorization.k8s.io.clusterrole',
      links: {
        remove: 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles/calico-node',
        self:   'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles/calico-node',
        update: 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles/calico-node',
        view:   'https://yonasb29h3.qa.rancher.space/apis/rbac.authorization.k8s.io/v1/clusterroles/calico-node'
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'ClusterRole',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rke2-canal',
          'meta.helm.sh/release-namespace': 'kube-system'
        },
        creationTimestamp: '2024-07-08T22:03:01Z',
        fields:            [
          'calico-node',
          '2024-07-08T22:03:01Z'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-crole'
        ],
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        name:          'calico-node',
        relationships: [
          {
            fromId:   'kube-system/rke2-canal',
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
        uid: '7aa8e5b8-a428-4c33-8acf-7be8889e6c1c'
      },
      rules: []
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

export function clusterRolesNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.clusterroles?*', reply(200, clusterRolesGetResponseEmpty)).as('clusterRolesNoData');
}

export function generateClusterRolesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.clusterroles?*', reply(200, clusterRolesResponseSmallSet)).as('clusterRolesDataSmall');
}
