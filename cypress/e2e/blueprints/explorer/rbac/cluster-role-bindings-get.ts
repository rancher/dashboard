import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/rbac.authorization.k8s.io.clusterrolebinding - return empty cluster role binding data
const clusterRoleBindingGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings' },
  createTypes:  { 'rbac.authorization.k8s.io.clusterrolebinding': 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.clusterrolebinding',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/rbac.authorization.k8s.io.clusterrolebinding - small set of cluster role binding data
const clusterRoleBindingResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings' },
  createTypes:  { 'rbac.authorization.k8s.io.clusterrolebinding': 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.clusterrolebinding',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        2,
  data:         [
    {
      id:    'aks-operator',
      type:  'rbac.authorization.k8s.io.clusterrolebinding',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings/aks-operator',
        self:   'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings/aks-operator',
        update: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings/aks-operator',
        view:   'https://yonasb29head.qa.rancher.space/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/aks-operator'
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'ClusterRoleBinding',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-aks-operator',
          'meta.helm.sh/release-namespace': 'cattle-system'
        },
        creationTimestamp: '2024-06-28T19:07:21Z',
        fields:            [
          'aks-operator',
          'ClusterRole/aks-operator',
          '8d',
          '',
          '',
          'cattle-system/aks-operator'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-crb'
        ],
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        name:          'aks-operator',
        relationships: [
          {
            fromId:   'cattle-system/rancher-aks-operator',
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
        uid: 'c6486bda-cb25-4a16-837f-c09b5a96cb5a'
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind:     'ClusterRole',
        name:     'aks-operator'
      },
      subjects: [
        {
          kind:      'ServiceAccount',
          name:      'aks-operator',
          namespace: 'cattle-system'
        }
      ]
    },
    {
      id:    'canal-calico',
      type:  'rbac.authorization.k8s.io.clusterrolebinding',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings/canal-calico',
        self:   'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings/canal-calico',
        update: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterrolebindings/canal-calico',
        view:   'https://yonasb29head.qa.rancher.space/apis/rbac.authorization.k8s.io/v1/clusterrolebindings/canal-calico'
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'ClusterRoleBinding',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rke2-canal',
          'meta.helm.sh/release-namespace': 'kube-system'
        },
        creationTimestamp: '2024-06-27T20:17:48Z',
        fields:            [
          'canal-calico',
          'ClusterRole/calico-node',
          '9d',
          '',
          '',
          'kube-system/canal'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-crb'
        ],
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        name:          'canal-calico',
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
        uid: '103e1c52-ad27-4359-90f3-fc2329606819'
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind:     'ClusterRole',
        name:     'calico-node'
      },
      subjects: [
        {
          kind:      'ServiceAccount',
          name:      'canal',
          namespace: 'kube-system'
        }
      ]
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

export function clusterRoleBindingNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.clusterrolebinding?*', reply(200, clusterRoleBindingGetResponseEmpty)).as('clusterRoleBindingNoData');
}

export function generateClusterRoleBindingDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.clusterrolebinding?*', reply(200, clusterRoleBindingResponseSmallSet)).as('clusterRoleBindingDataSmall');
}
