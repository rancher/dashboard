import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

// GET /v1/services - return empty services data
const servicesGetReponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29.qa.rancher.space/v1/services' },
  createTypes:  { service: 'https://yonasb29.qa.rancher.space/v1/services' },
  actions:      {},
  resourceType: 'service',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/services - small set of services data
const servicesGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29.qa.rancher.space/v1/services' },
  createTypes:  { service: 'https://yonasb29.qa.rancher.space/v1/services' },
  actions:      {},
  resourceType: 'service',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        3,
  data:         [
    {
      id:    'cattle-system/rancher',
      type:  'service',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/services/cattle-system/rancher',
        self:   'https://yonasb29.qa.rancher.space/v1/services/cattle-system/rancher',
        update: 'https://yonasb29.qa.rancher.space/v1/services/cattle-system/rancher',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/cattle-system/services/rancher'
      },
      apiVersion: 'v1',
      kind:       'Service',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher',
          'meta.helm.sh/release-namespace': 'cattle-system'
        },
        creationTimestamp: '2024-06-18T15:41:47Z',
        fields:            [
          'rancher',
          'ClusterIP',
          '10.43.96.35',
          '<none>',
          '80/TCP,443/TCP',
          '3h38m',
          'app=rancher'
        ],
        labels: {
          app:                            'rancher',
          'app.kubernetes.io/managed-by': 'Helm',
          chart:                          'rancher-2.8.4',
          heritage:                       'Helm',
          release:                        'rancher'
        },
        name:          'rancher',
        namespace:     'cattle-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-system',
            rel:         'selects',
            selector:    'app=rancher'
          },
          {
            fromId:   'cattle-system/rancher',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          },
          {
            toId:    'cattle-system/rancher-xrfd4',
            toType:  'discovery.k8s.io.endpointslice',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Service is ready',
          name:          'active',
          transitioning: false
        },
        uid: '2889b9b2-eeff-40aa-bad7-01a4eed5fc60'
      },
      spec: {
        clusterIP:  '10.43.96.35',
        clusterIPs: [
          '10.43.96.35'
        ],
        internalTrafficPolicy: 'Cluster',
        ipFamilies:            [
          'IPv4'
        ],
        ipFamilyPolicy: 'SingleStack',
        ports:          [
          {
            name:       'http',
            port:       80,
            protocol:   'TCP',
            targetPort: 80
          },
          {
            name:       'https-internal',
            port:       443,
            protocol:   'TCP',
            targetPort: 444
          }
        ],
        selector:        { app: 'rancher' },
        sessionAffinity: 'None',
        type:            'ClusterIP'
      },
      status: { loadBalancer: {} }
    },
    {
      id:    'cattle-system/rancher-webhook',
      type:  'service',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/services/cattle-system/rancher-webhook',
        self:   'https://yonasb29.qa.rancher.space/v1/services/cattle-system/rancher-webhook',
        update: 'https://yonasb29.qa.rancher.space/v1/services/cattle-system/rancher-webhook',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/cattle-system/services/rancher-webhook'
      },
      apiVersion: 'v1',
      kind:       'Service',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-webhook',
          'meta.helm.sh/release-namespace': 'cattle-system'
        },
        creationTimestamp: '2024-06-18T15:47:50Z',
        fields:            [
          'rancher-webhook',
          'ClusterIP',
          '10.43.37.16',
          '<none>',
          '443/TCP',
          '3h32m',
          'app=rancher-webhook'
        ],
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        name:          'rancher-webhook',
        namespace:     'cattle-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-system',
            rel:         'selects',
            selector:    'app=rancher-webhook'
          },
          {
            toId:    'cattle-system/rancher-webhook-drf5r',
            toType:  'discovery.k8s.io.endpointslice',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            fromId:   'cattle-system/rancher-webhook',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Service is ready',
          name:          'active',
          transitioning: false
        },
        uid: 'ac3321f4-a548-4bb0-b39a-96b6d3a91d34'
      },
      spec: {
        clusterIP:  '10.43.37.16',
        clusterIPs: [
          '10.43.37.16'
        ],
        internalTrafficPolicy: 'Cluster',
        ipFamilies:            [
          'IPv4'
        ],
        ipFamilyPolicy: 'SingleStack',
        ports:          [
          {
            name:       'https',
            port:       443,
            protocol:   'TCP',
            targetPort: 9443
          }
        ],
        selector:        { app: 'rancher-webhook' },
        sessionAffinity: 'None',
        type:            'ClusterIP'
      },
      status: { loadBalancer: {} }
    },
    {
      id:    'default/kubernetes',
      type:  'service',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/services/default/kubernetes',
        self:   'https://yonasb29.qa.rancher.space/v1/services/default/kubernetes',
        update: 'https://yonasb29.qa.rancher.space/v1/services/default/kubernetes',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/default/services/kubernetes'
      },
      apiVersion: 'v1',
      kind:       'Service',
      metadata:   {
        creationTimestamp: '2024-06-18T15:29:24Z',
        fields:            [
          'kubernetes',
          'ClusterIP',
          '10.43.0.1',
          '<none>',
          '443/TCP',
          '3h50m',
          '<none>'
        ],
        labels: {
          component: 'apiserver',
          provider:  'kubernetes'
        },
        name:            'kubernetes',
        namespace:       'default',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Service is ready',
          name:          'active',
          transitioning: false
        },
        uid: '79e5a2b5-05b3-4d3d-8b43-8de71eb3d10a'
      },
      spec: {
        clusterIP:  '10.43.0.1',
        clusterIPs: [
          '10.43.0.1'
        ],
        internalTrafficPolicy: 'Cluster',
        ipFamilies:            [
          'IPv4'
        ],
        ipFamilyPolicy: 'SingleStack',
        ports:          [
          {
            name:       'https',
            port:       443,
            protocol:   'TCP',
            targetPort: 6443
          }
        ],
        sessionAffinity: 'None',
        type:            'ClusterIP'
      },
      status: { loadBalancer: {} }
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

export function servicesNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/services?*', reply(200, servicesGetReponseEmpty)).as('servicesNoData');
}

export function generateServicesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/services?*', reply(200, servicesGetResponseSmallSet)).as('servicesDataSmall');
}
