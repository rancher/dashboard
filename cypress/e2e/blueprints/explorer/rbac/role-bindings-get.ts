import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/rbac.authorization.k8s.io.rolebindings- return empty role binding data
const roleBindingGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings' },
  createTypes:  { 'rbac.authorization.k8s.io.rolebinding': 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.rolebinding',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/rbac.authorization.k8s.io.rolebindings - small set of role binding data
const roleBindingResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings' },
  createTypes:  { 'rbac.authorization.k8s.io.rolebinding': 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings' },
  actions:      {},
  resourceType: 'rbac.authorization.k8s.io.rolebinding',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        3,
  data:         [
    {
      id:    'cluster-fleet-default-c-7h4dt-d2a039d07d4b/request-frnrr',
      type:  'rbac.authorization.k8s.io.rolebinding',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/cluster-fleet-default-c-7h4dt-d2a039d07d4b/request-frnrr',
        self:   'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/cluster-fleet-default-c-7h4dt-d2a039d07d4b/request-frnrr',
        update: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/cluster-fleet-default-c-7h4dt-d2a039d07d4b/request-frnrr',
        view:   'https://yonasb29head.qa.rancher.space/apis/rbac.authorization.k8s.io/v1/namespaces/cluster-fleet-default-c-7h4dt-d2a039d07d4b/rolebindings/request-frnrr'
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'RoleBinding',
      metadata:   {
        annotations: {
          'objectset.rio.cattle.io/applied':         'H4sIAAAAAAAA/6SRQa/TMBCE/wracxzSJG6aSBwQBw7cHtwQh7W9aUwdO9jrIqjef0dJVfRAFIHe0bJ2Zr6ZC8zEaJARhgug94GRbfBpfQb1mTQn4jLaUGpkdlTa8NIaGEC7nJiiiHS0ieN2BcXdm/DVUxTH8wkGGB0RP/k779AtE+6KF++sN6/eXJUf/kfY40wwQKQvmRKLMfoY/+koLajplkkYGjE7hscCdKTN+oOdKTHOCww+O1eAQ0Vu6+d3jhk9Hmkth2Omv9hPmCYYAI3Wne677tAYifWod33TN20lq2Z/ICIzVrgniWucO4BPEW6L/IIitOim1rAwNVZNb6rOtGoVjMHRA43b7It9G0NeVn2FusTMU4j2+8Zfng6ptAEKOFm/st3mCY7gZ66rp8reOBKGFhe+zeS3IlO+tgDDx8tN4z3Fs9X0WuuQPcOf8cSBai2lbIQydSXaFlvRt2onpKxV1Y17VGSe0cGnxx8BAAD//zQ0pyf+AgAA',
          'objectset.rio.cattle.io/id':              'cluster-registration',
          'objectset.rio.cattle.io/owner-gvk':       'fleet.cattle.io/v1alpha1, Kind=ClusterRegistration',
          'objectset.rio.cattle.io/owner-name':      'request-frnrr',
          'objectset.rio.cattle.io/owner-namespace': 'fleet-default'
        },
        creationTimestamp: '2024-06-28T19:40:59Z',
        fields:            [
          'request-frnrr',
          'ClusterRole/fleet-bundle-deployment',
          '8d',
          '',
          '',
          'cluster-fleet-default-c-7h4dt-d2a039d07d4b/request-frnrr-8e2c5553-bd20-44a4-94b1-552b07f6abed'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-rb'
        ],
        labels: {
          'fleet.cattle.io/managed':      'true',
          'objectset.rio.cattle.io/hash': 'adcc7c97783d5a2fc193934050368eeedf0a6e5a'
        },
        name:          'request-frnrr',
        namespace:     'cluster-fleet-default-c-7h4dt-d2a039d07d4b',
        relationships: [
          {
            fromId:   'fleet-default/request-frnrr',
            fromType: 'fleet.cattle.io.clusterregistration',
            rel:      'applies',
            state:    'active',
            message:  'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '020198ab-9d82-44f3-8c1b-afefb65bb207'
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind:     'ClusterRole',
        name:     'fleet-bundle-deployment'
      },
      subjects: [
        {
          kind:      'ServiceAccount',
          name:      'request-frnrr-8e2c5553-bd20-44a4-94b1-552b07f6abed',
          namespace: 'cluster-fleet-default-c-7h4dt-d2a039d07d4b'
        }
      ]
    },
    {
      id:    'cluster-fleet-default-c-9khnf-46795bb742fd/request-5sz89',
      type:  'rbac.authorization.k8s.io.rolebinding',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/cluster-fleet-default-c-9khnf-46795bb742fd/request-5sz89',
        self:   'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/cluster-fleet-default-c-9khnf-46795bb742fd/request-5sz89',
        update: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/cluster-fleet-default-c-9khnf-46795bb742fd/request-5sz89',
        view:   'https://yonasb29head.qa.rancher.space/apis/rbac.authorization.k8s.io/v1/namespaces/cluster-fleet-default-c-9khnf-46795bb742fd/rolebindings/request-5sz89'
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'RoleBinding',
      metadata:   {
        annotations: {
          'objectset.rio.cattle.io/applied':         'H4sIAAAAAAAA/6SRT4/TMBTEvwp65zi03qSOI3FAHDhwW7ghDs/2c2Pq2MF/ithqvztKqqIFsQjE0bLezPxmLjBTQYMFYbwAhhALFhdDXp9RfSZdMpU2udhqLMVT6+JLZ2AE7WsulFiio8slbVfQPHsTvwZK7Hg+wQjWE5Unf+c9+mXCffPinQvm1Zur8v2/CAecCUZI9KVSLqzPD4P8q6O8oKZbJmbIYvUFHhvQiTbrD26mXHBeYAzV+wY8KvJbP79yzBjwSGs5JVX6g/2EeYIRhOZiMJIbbpQ8DB3nHR4EDWbYKXtnbS+NkJzLNc4zgE8Rbov8hMI0k6cpWNYdhOyVEh23ZhVM0dM92W32xb1NsS6rvkLdYi1TTO5h429PQ25dhAZOLqxst3miJ/iR6+qpajCemKHFx28zha3IXK8twPjxctN4T+nsNL3WOtZQ4Pd4jO+FQEWW9Yduzzpxt2MD15LtrBV41+86Lf+ng0+P3wMAAP//etGRJv4CAAA',
          'objectset.rio.cattle.io/id':              'cluster-registration',
          'objectset.rio.cattle.io/owner-gvk':       'fleet.cattle.io/v1alpha1, Kind=ClusterRegistration',
          'objectset.rio.cattle.io/owner-name':      'request-5sz89',
          'objectset.rio.cattle.io/owner-namespace': 'fleet-default'
        },
        creationTimestamp: '2024-07-05T19:57:45Z',
        fields:            [
          'request-5sz89',
          'ClusterRole/fleet-bundle-deployment',
          '27h',
          '',
          '',
          'cluster-fleet-default-c-9khnf-46795bb742fd/request-5sz89-2177abef-5641-4730-82c9-0ff7a3504c99'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-rb'
        ],
        labels: {
          'fleet.cattle.io/managed':      'true',
          'objectset.rio.cattle.io/hash': '7c278d92d2db9684224a67e8d80bf3ff59d79229'
        },
        name:          'request-5sz89',
        namespace:     'cluster-fleet-default-c-9khnf-46795bb742fd',
        relationships: [
          {
            fromId:   'fleet-default/request-5sz89',
            fromType: 'fleet.cattle.io.clusterregistration',
            rel:      'applies',
            state:    'active',
            message:  'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '0d74e4e4-133c-4a78-abe9-16d0488692bc'
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind:     'ClusterRole',
        name:     'fleet-bundle-deployment'
      },
      subjects: [
        {
          kind:      'ServiceAccount',
          name:      'request-5sz89-2177abef-5641-4730-82c9-0ff7a3504c99',
          namespace: 'cluster-fleet-default-c-9khnf-46795bb742fd'
        }
      ]
    },
    {
      id:    'kube-system/rke2-ingress-nginx',
      type:  'rbac.authorization.k8s.io.rolebinding',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/kube-system/rke2-ingress-nginx',
        self:   'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/kube-system/rke2-ingress-nginx',
        update: 'https://yonasb29head.qa.rancher.space/v1/rbac.authorization.k8s.io.rolebindings/kube-system/rke2-ingress-nginx',
        view:   'https://yonasb29head.qa.rancher.space/apis/rbac.authorization.k8s.io/v1/namespaces/kube-system/rolebindings/rke2-ingress-nginx'
      },
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind:       'RoleBinding',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rke2-ingress-nginx',
          'meta.helm.sh/release-namespace': 'kube-system'
        },
        creationTimestamp: '2024-06-27T20:21:36Z',
        fields:            [
          'rke2-ingress-nginx',
          'Role/rke2-ingress-nginx',
          '9d',
          '',
          '',
          'kube-system/rke2-ingress-nginx'
        ],
        finalizers: [
          'wrangler.cattle.io/auth-prov-v2-rb'
        ],
        labels: {
          'app.kubernetes.io/component':  'controller',
          'app.kubernetes.io/instance':   'rke2-ingress-nginx',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'rke2-ingress-nginx',
          'app.kubernetes.io/part-of':    'rke2-ingress-nginx',
          'app.kubernetes.io/version':    '1.9.3',
          'helm.sh/chart':                'rke2-ingress-nginx-4.8.200'
        },
        name:          'rke2-ingress-nginx',
        namespace:     'kube-system',
        relationships: [
          {
            fromId:   'kube-system/rke2-ingress-nginx',
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
        uid: 'e3156530-f58e-4ef0-b80b-46fe4cc194d9'
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind:     'Role',
        name:     'rke2-ingress-nginx'
      },
      subjects: [
        {
          kind:      'ServiceAccount',
          name:      'rke2-ingress-nginx',
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

export function roleBindingNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.rolebindings?*', reply(200, roleBindingGetResponseEmpty)).as('roleBindingNoData');
}

export function generateRoleBindingDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/rbac.authorization.k8s.io.rolebindings?*', reply(200, roleBindingResponseSmallSet)).as('roleBindingDataSmall');
}
