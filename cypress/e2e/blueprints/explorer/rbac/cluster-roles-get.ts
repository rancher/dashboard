// GET /v1/rbac.authorization.k8s.io.clusterrolebinding - return empty cluster roles data
const clusterRolesGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles' },
  createTypes:  { 'rbac.authorization.k8s.io.clusterrole': 'https://yonasb29h3.qa.rancher.space/v1/rbac.authorization.k8s.io.clusterroles' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.clusterrole',
  revision:     '123',
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
  revision:     '123',
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
        resourceVersion: '4878',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'fc508973-7781-4865-abaa-6563b197cf97'
      },
      rules: [
        {
          apiGroups: [
            ''
          ],
          resources: [
            'pods/attach',
            'pods/exec',
            'pods/portforward',
            'pods/proxy',
            'secrets',
            'services/proxy'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'serviceaccounts'
          ],
          verbs: [
            'impersonate'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'pods',
            'pods/attach',
            'pods/exec',
            'pods/portforward',
            'pods/proxy'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'pods/eviction'
          ],
          verbs: [
            'create'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'configmaps',
            'events',
            'persistentvolumeclaims',
            'replicationcontrollers',
            'replicationcontrollers/scale',
            'secrets',
            'serviceaccounts',
            'services',
            'services/proxy'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'serviceaccounts/token'
          ],
          verbs: [
            'create'
          ]
        },
        {
          apiGroups: [
            'apps'
          ],
          resources: [
            'daemonsets',
            'deployments',
            'deployments/rollback',
            'deployments/scale',
            'replicasets',
            'replicasets/scale',
            'statefulsets',
            'statefulsets/scale'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            'autoscaling'
          ],
          resources: [
            'horizontalpodautoscalers'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            'batch'
          ],
          resources: [
            'cronjobs',
            'jobs'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            'extensions'
          ],
          resources: [
            'daemonsets',
            'deployments',
            'deployments/rollback',
            'deployments/scale',
            'ingresses',
            'networkpolicies',
            'replicasets',
            'replicasets/scale',
            'replicationcontrollers/scale'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            'policy'
          ],
          resources: [
            'poddisruptionbudgets'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            'networking.k8s.io'
          ],
          resources: [
            'ingresses',
            'networkpolicies'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'patch',
            'update'
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
            'create',
            'delete',
            'deletecollection',
            'get',
            'list',
            'patch',
            'update',
            'watch'
          ]
        },
        {
          apiGroups: [
            'metrics.k8s.io'
          ],
          resources: [
            'pods',
            'nodes'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'configmaps',
            'endpoints',
            'persistentvolumeclaims',
            'persistentvolumeclaims/status',
            'pods',
            'replicationcontrollers',
            'replicationcontrollers/scale',
            'serviceaccounts',
            'services',
            'services/status'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'bindings',
            'events',
            'limitranges',
            'namespaces/status',
            'pods/log',
            'pods/status',
            'replicationcontrollers/status',
            'resourcequotas',
            'resourcequotas/status'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'namespaces'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'discovery.k8s.io'
          ],
          resources: [
            'endpointslices'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'apps'
          ],
          resources: [
            'controllerrevisions',
            'daemonsets',
            'daemonsets/status',
            'deployments',
            'deployments/scale',
            'deployments/status',
            'replicasets',
            'replicasets/scale',
            'replicasets/status',
            'statefulsets',
            'statefulsets/scale',
            'statefulsets/status'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'autoscaling'
          ],
          resources: [
            'horizontalpodautoscalers',
            'horizontalpodautoscalers/status'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'batch'
          ],
          resources: [
            'cronjobs',
            'cronjobs/status',
            'jobs',
            'jobs/status'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'extensions'
          ],
          resources: [
            'daemonsets',
            'daemonsets/status',
            'deployments',
            'deployments/scale',
            'deployments/status',
            'ingresses',
            'ingresses/status',
            'networkpolicies',
            'replicasets',
            'replicasets/scale',
            'replicasets/status',
            'replicationcontrollers/scale'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'policy'
          ],
          resources: [
            'poddisruptionbudgets',
            'poddisruptionbudgets/status'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'networking.k8s.io'
          ],
          resources: [
            'ingresses',
            'ingresses/status',
            'networkpolicies'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'authorization.k8s.io'
          ],
          resources: [
            'localsubjectaccessreviews'
          ],
          verbs: [
            'create'
          ]
        },
        {
          apiGroups: [
            'rbac.authorization.k8s.io'
          ],
          resources: [
            'rolebindings',
            'roles'
          ],
          verbs: [
            'create',
            'delete',
            'deletecollection',
            'get',
            'list',
            'patch',
            'update',
            'watch'
          ]
        }
      ]
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
        resourceVersion: '4838',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '7aa8e5b8-a428-4c33-8acf-7be8889e6c1c'
      },
      rules: [
        {
          apiGroups: [
            ''
          ],
          resourceNames: [
            'canal'
          ],
          resources: [
            'serviceaccounts/token'
          ],
          verbs: [
            'create'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'pods',
            'nodes',
            'namespaces'
          ],
          verbs: [
            'get'
          ]
        },
        {
          apiGroups: [
            'discovery.k8s.io'
          ],
          resources: [
            'endpointslices'
          ],
          verbs: [
            'watch',
            'list'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'endpoints',
            'services'
          ],
          verbs: [
            'watch',
            'list',
            'get'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'configmaps'
          ],
          verbs: [
            'get'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'nodes/status'
          ],
          verbs: [
            'patch',
            'update'
          ]
        },
        {
          apiGroups: [
            'networking.k8s.io'
          ],
          resources: [
            'networkpolicies'
          ],
          verbs: [
            'watch',
            'list'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'pods',
            'namespaces',
            'serviceaccounts'
          ],
          verbs: [
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'pods/status'
          ],
          verbs: [
            'patch'
          ]
        },
        {
          apiGroups: [
            'crd.projectcalico.org'
          ],
          resources: [
            'caliconodestatuses',
            'globalfelixconfigs',
            'felixconfigurations',
            'bgppeers',
            'globalbgpconfigs',
            'bgpconfigurations',
            'ippools',
            'ipreservations',
            'ipamblocks',
            'globalnetworkpolicies',
            'globalnetworksets',
            'networkpolicies',
            'networksets',
            'clusterinformations',
            'hostendpoints',
            'blockaffinities'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'crd.projectcalico.org'
          ],
          resources: [
            'caliconodestatuses',
            'ippools',
            'felixconfigurations',
            'clusterinformations'
          ],
          verbs: [
            'create',
            'update'
          ]
        },
        {
          apiGroups: [
            ''
          ],
          resources: [
            'nodes'
          ],
          verbs: [
            'get',
            'list',
            'watch'
          ]
        },
        {
          apiGroups: [
            'crd.projectcalico.org'
          ],
          resources: [
            'bgpconfigurations',
            'bgppeers'
          ],
          verbs: [
            'create',
            'update'
          ]
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

export function clusterRolesNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.clusterroles?*', reply(200, clusterRolesGetResponseEmpty)).as('clusterRolesNoData');
}

export function generateClusterRolesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.clusterroles?*', reply(200, clusterRolesResponseSmallSet)).as('clusterRolesDataSmall');
}
