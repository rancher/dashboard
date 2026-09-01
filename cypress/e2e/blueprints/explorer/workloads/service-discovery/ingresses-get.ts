import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

// GET /v1/networking.k8s.io.ingresses - return empty ingresses data
const ingressesGetReponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses' },
  createTypes:  { 'networking.k8s.io.ingress': 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses' },
  actions:      {},
  resourceType: 'networking.k8s.io.ingress',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/networking.k8s.io.ingresses - small set of ingresses data
const ingressesGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses' },
  createTypes:  { 'networking.k8s.io.ingress': 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses' },
  actions:      {},
  resourceType: 'networking.k8s.io.ingress',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        2,
  data:         [
    {
      id:    'cattle-system/rancher',
      type:  'networking.k8s.io.ingress',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses/cattle-system/rancher',
        self:   'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses/cattle-system/rancher',
        update: 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses/cattle-system/rancher',
        view:   'https://yonasb29head.qa.rancher.space/apis/networking.k8s.io/v1/namespaces/cattle-system/ingresses/rancher'
      },
      apiVersion: 'networking.k8s.io/v1',
      kind:       'Ingress',
      metadata:   {
        annotations: {
          'field.cattle.io/publicEndpoints':                   '[{"addresses":["18.119.127.112","3.149.240.160","52.15.149.30"],"port":443,"protocol":"HTTPS","serviceName":"cattle-system:rancher","ingressName":"cattle-system:rancher","hostname":"yonasb29head.qa.rancher.space","path":"/","allNodes":false}]',
          'meta.helm.sh/release-name':                         'rancher',
          'meta.helm.sh/release-namespace':                    'cattle-system',
          'nginx.ingress.kubernetes.io/proxy-connect-timeout': '30',
          'nginx.ingress.kubernetes.io/proxy-read-timeout':    '1800',
          'nginx.ingress.kubernetes.io/proxy-send-timeout':    '1800'
        },
        creationTimestamp: '2024-06-27T20:29:51Z',
        fields:            [
          'rancher',
          '\u003cnone\u003e',
          'yonasb29head.qa.rancher.space',
          '18.119.127.112,3.149.240.160,52.15.149.30',
          '80, 443',
          '9d'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher',
          'app.kubernetes.io/managed-by': 'Helm',
          chart:                          'rancher-2.9.0-alpha5',
          heritage:                       'Helm',
          release:                        'rancher'
        },
        name:          'rancher',
        namespace:     'cattle-system',
        relationships: [
          {
            fromId:   'cattle-system/rancher',
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
        uid: 'df36da42-bcbd-4a83-833d-059bfcfd7191'
      },
      spec: {
        rules: [
          {
            host: 'yonasb29head.qa.rancher.space',
            http: {
              paths: [
                {
                  backend: {
                    service: {
                      name: 'rancher',
                      port: { number: 80 }
                    }
                  },
                  path:     '/',
                  pathType: 'ImplementationSpecific'
                }
              ]
            }
          }
        ],
        tls: [
          {
            hosts: [
              'yonasb29head.qa.rancher.space'
            ],
            secretName: 'tls-rancher-ingress'
          }
        ]
      },
      status: {
        loadBalancer: {
          ingress: [
            { ip: '18.119.127.112' },
            { ip: '3.149.240.160' },
            { ip: '52.15.149.30' }
          ]
        }
      }
    },
    {
      id:    'default/test',
      type:  'networking.k8s.io.ingress',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses/default/test',
        self:   'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses/default/test',
        update: 'https://yonasb29head.qa.rancher.space/v1/networking.k8s.io.ingresses/default/test',
        view:   'https://yonasb29head.qa.rancher.space/apis/networking.k8s.io/v1/namespaces/default/ingresses/test'
      },
      apiVersion: 'networking.k8s.io/v1',
      kind:       'Ingress',
      metadata:   {
        creationTimestamp: '2024-07-07T01:13:54Z',
        fields:            [
          'test',
          '\u003cnone\u003e',
          '*',
          '18.119.127.112,3.149.240.160,52.15.149.30',
          '80',
          '26s'
        ],
        generation:      1,
        name:            'test',
        namespace:       'default',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '87953be9-18bf-4944-acff-46b44d62f099'
      },
      spec: {
        rules: [
          {}
        ]
      },
      status: {
        loadBalancer: {
          ingress: [
            { ip: '18.119.127.112' },
            { ip: '3.149.240.160' },
            { ip: '52.15.149.30' }
          ]
        }
      }
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

export function ingressesNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/networking.k8s.io.ingresses?*', reply(200, ingressesGetReponseEmpty)).as('ingressesNoData');
}

export function generateIngressesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/networking.k8s.io.ingresses?*', reply(200, ingressesGetResponseSmallSet)).as('ingressesDataSmall');
}
