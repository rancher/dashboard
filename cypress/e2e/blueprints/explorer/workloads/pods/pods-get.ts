import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

// GET /v1/pods - small set of pods data
const podsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://izh.qa.rancher.space/v1/pods' },
  createTypes:  { pod: 'https://izh.qa.rancher.space/v1/pods' },
  actions:      {},
  resourceType: 'pod',
  count:        3,
  data:         [{
    id:    'default/test1',
    type:  'pod',
    links: {
      remove: 'https://izh.qa.rancher.space/v1/pods/default/test1',
      self:   'https://izh.qa.rancher.space/v1/pods/default/test1',
      update: 'https://izh.qa.rancher.space/v1/pods/default/test1',
      view:   'https://izh.qa.rancher.space/api/v1/namespaces/default/pods/test1'
    },
    apiVersion: 'v1',
    kind:       'Pod',
    metadata:   {
      creationTimestamp: '2024-08-07T23:58:10Z',
      fields:            [
        'test1',
        '1/1',
        'Running',
        '0',
        '1s',
        '10.42.2.202',
        'ip-172-31-14-159',
        '\u003cnone\u003e',
        '\u003cnone\u003e'
      ],
      labels:        { 'workload.user.cattle.io/workloadselector': 'pod-default-test1' },
      name:          'test1',
      namespace:     'default',
      relationships: [
        {
          toId:    'default/default',
          toType:  'serviceaccount',
          rel:     'uses',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    'default/kube-root-ca.crt',
          toType:  'configmap',
          rel:     'uses',
          state:   'active',
          message: 'Resource is always ready'
        }
      ],
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       '',
        name:          'running',
        transitioning: false
      },
      uid: '549cb335-5b90-40d3-96cf-9d96277069bd'
    },
    spec: {
      affinity:   {},
      containers: [
        {
          image:                    'nginx:latest',
          imagePullPolicy:          'Always',
          name:                     'container-0',
          resources:                {},
          terminationMessagePath:   '/dev/termination-log',
          terminationMessagePolicy: 'File',
          volumeMounts:             [
            {
              mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
              name:      'kube-api-access-wd2wx',
              readOnly:  true
            }
          ]
        }
      ],
      dnsPolicy:                     'ClusterFirst',
      enableServiceLinks:            true,
      nodeName:                      'ip-172-31-14-159',
      preemptionPolicy:              'PreemptLowerPriority',
      priority:                      0,
      restartPolicy:                 'Always',
      schedulerName:                 'default-scheduler',
      securityContext:               {},
      serviceAccount:                'default',
      serviceAccountName:            'default',
      terminationGracePeriodSeconds: 30,
      tolerations:                   [
        {
          effect:            'NoExecute',
          key:               'node.kubernetes.io/not-ready',
          operator:          'Exists',
          tolerationSeconds: 300
        },
        {
          effect:            'NoExecute',
          key:               'node.kubernetes.io/unreachable',
          operator:          'Exists',
          tolerationSeconds: 300
        }
      ],
      volumes: [
        {
          name:      'kube-api-access-wd2wx',
          projected: {
            defaultMode: 420,
            sources:     [
              {
                serviceAccountToken: {
                  expirationSeconds: 3607,
                  path:              'token'
                }
              },
              {
                configMap: {
                  items: [
                    {
                      key:  'ca.crt',
                      path: 'ca.crt'
                    }
                  ],
                  name: 'kube-root-ca.crt'
                }
              },
              {
                downwardAPI: {
                  items: [
                    {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      },
                      path: 'namespace'
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    },
    status: {
      conditions: [
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:10Z',
          lastUpdateTime:     '2024-08-07T23:58:10Z',
          status:             'True',
          transitioning:      false,
          type:               'Initialized'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:11Z',
          lastUpdateTime:     '2024-08-07T23:58:11Z',
          status:             'True',
          transitioning:      false,
          type:               'Ready'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:11Z',
          lastUpdateTime:     '2024-08-07T23:58:11Z',
          status:             'True',
          transitioning:      false,
          type:               'ContainersReady'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:10Z',
          lastUpdateTime:     '2024-08-07T23:58:10Z',
          status:             'True',
          transitioning:      false,
          type:               'PodScheduled'
        }
      ],
      containerStatuses: [
        {
          containerID:  'containerd://ce99568174ad36120fa39b6434fa95ebfe5bf70e417a4d84d2589d2d252bd5ec',
          image:        'docker.io/library/nginx:latest',
          imageID:      'docker.io/library/nginx@sha256:6af79ae5de407283dcea8b00d5c37ace95441fd58a8b1d2aa1ed93f5511bb18c',
          lastState:    {},
          name:         'container-0',
          ready:        true,
          restartCount: 0,
          started:      true,
          state:        { running: { startedAt: '2024-08-07T23:58:11Z' } }
        }
      ],
      hostIP: '172.31.14.159',
      phase:  'Running',
      podIP:  '10.42.2.202',
      podIPs: [
        { ip: '10.42.2.202' }
      ],
      qosClass:  'BestEffort',
      startTime: '2024-08-07T23:58:10Z'
    }
  },
  {
    id:    'default/test2',
    type:  'pod',
    links: {
      remove: 'https://izh.qa.rancher.space/v1/pods/default/test2',
      self:   'https://izh.qa.rancher.space/v1/pods/default/test2',
      update: 'https://izh.qa.rancher.space/v1/pods/default/test2',
      view:   'https://izh.qa.rancher.space/api/v1/namespaces/default/pods/test2'
    },
    apiVersion: 'v1',
    kind:       'Pod',
    metadata:   {
      creationTimestamp: '2024-08-07T23:58:28Z',
      fields:            [
        'test2',
        '1/1',
        'Running',
        '0',
        '1s',
        '10.42.2.203',
        'ip-172-31-14-159',
        '\u003cnone\u003e',
        '\u003cnone\u003e'
      ],
      labels:        { 'workload.user.cattle.io/workloadselector': 'pod-default-test2' },
      name:          'test2',
      namespace:     'default',
      relationships: [
        {
          toId:    'default/default',
          toType:  'serviceaccount',
          rel:     'uses',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    'default/kube-root-ca.crt',
          toType:  'configmap',
          rel:     'uses',
          state:   'active',
          message: 'Resource is always ready'
        }
      ],
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       '',
        name:          'running',
        transitioning: false
      },
      uid: 'ea2a929c-85ed-4f70-b2ef-a1c6cdb3a675'
    },
    spec: {
      affinity:   {},
      containers: [
        {
          image:                    'nginx:latest',
          imagePullPolicy:          'Always',
          name:                     'container-0',
          resources:                {},
          terminationMessagePath:   '/dev/termination-log',
          terminationMessagePolicy: 'File',
          volumeMounts:             [
            {
              mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
              name:      'kube-api-access-sm24m',
              readOnly:  true
            }
          ]
        }
      ],
      dnsPolicy:                     'ClusterFirst',
      enableServiceLinks:            true,
      nodeName:                      'ip-172-31-14-159',
      preemptionPolicy:              'PreemptLowerPriority',
      priority:                      0,
      restartPolicy:                 'Always',
      schedulerName:                 'default-scheduler',
      securityContext:               {},
      serviceAccount:                'default',
      serviceAccountName:            'default',
      terminationGracePeriodSeconds: 30,
      tolerations:                   [
        {
          effect:            'NoExecute',
          key:               'node.kubernetes.io/not-ready',
          operator:          'Exists',
          tolerationSeconds: 300
        },
        {
          effect:            'NoExecute',
          key:               'node.kubernetes.io/unreachable',
          operator:          'Exists',
          tolerationSeconds: 300
        }
      ],
      volumes: [
        {
          name:      'kube-api-access-sm24m',
          projected: {
            defaultMode: 420,
            sources:     [
              {
                serviceAccountToken: {
                  expirationSeconds: 3607,
                  path:              'token'
                }
              },
              {
                configMap: {
                  items: [
                    {
                      key:  'ca.crt',
                      path: 'ca.crt'
                    }
                  ],
                  name: 'kube-root-ca.crt'
                }
              },
              {
                downwardAPI: {
                  items: [
                    {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      },
                      path: 'namespace'
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    },
    status: {
      conditions: [
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:28Z',
          lastUpdateTime:     '2024-08-07T23:58:28Z',
          status:             'True',
          transitioning:      false,
          type:               'Initialized'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:29Z',
          lastUpdateTime:     '2024-08-07T23:58:29Z',
          status:             'True',
          transitioning:      false,
          type:               'Ready'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:29Z',
          lastUpdateTime:     '2024-08-07T23:58:29Z',
          status:             'True',
          transitioning:      false,
          type:               'ContainersReady'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:28Z',
          lastUpdateTime:     '2024-08-07T23:58:28Z',
          status:             'True',
          transitioning:      false,
          type:               'PodScheduled'
        }
      ],
      containerStatuses: [
        {
          containerID:  'containerd://b3e678e901f55a4bd15cf0b4d272dad5f1793701a638a642cc51bf16bffbcc33',
          image:        'docker.io/library/nginx:latest',
          imageID:      'docker.io/library/nginx@sha256:6af79ae5de407283dcea8b00d5c37ace95441fd58a8b1d2aa1ed93f5511bb18c',
          lastState:    {},
          name:         'container-0',
          ready:        true,
          restartCount: 0,
          started:      true,
          state:        { running: { startedAt: '2024-08-07T23:58:29Z' } }
        }
      ],
      hostIP: '172.31.14.159',
      phase:  'Running',
      podIP:  '10.42.2.203',
      podIPs: [
        { ip: '10.42.2.203' }
      ],
      qosClass:  'BestEffort',
      startTime: '2024-08-07T23:58:28Z'
    }
  },
  {
    id:    'default/test3',
    type:  'pod',
    links: {
      remove: 'https://izh.qa.rancher.space/v1/pods/default/test3',
      self:   'https://izh.qa.rancher.space/v1/pods/default/test3',
      update: 'https://izh.qa.rancher.space/v1/pods/default/test3',
      view:   'https://izh.qa.rancher.space/api/v1/namespaces/default/pods/test3'
    },
    apiVersion: 'v1',
    kind:       'Pod',
    metadata:   {
      creationTimestamp: '2024-08-07T23:58:43Z',
      fields:            [
        'test3',
        '1/1',
        'Running',
        '0',
        '1s',
        '10.42.2.204',
        'ip-172-31-14-159',
        '\u003cnone\u003e',
        '\u003cnone\u003e'
      ],
      labels:        { 'workload.user.cattle.io/workloadselector': 'pod-default-test3' },
      name:          'test3',
      namespace:     'default',
      relationships: [
        {
          toId:    'default/default',
          toType:  'serviceaccount',
          rel:     'uses',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    'default/kube-root-ca.crt',
          toType:  'configmap',
          rel:     'uses',
          state:   'active',
          message: 'Resource is always ready'
        }
      ],
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       '',
        name:          'running',
        transitioning: false
      },
      uid: 'b6d7ab60-507f-44dc-b8be-7037fa2c1163'
    },
    spec: {
      affinity:   {},
      containers: [
        {
          image:                    'nginx:latest',
          imagePullPolicy:          'Always',
          name:                     'container-0',
          resources:                {},
          terminationMessagePath:   '/dev/termination-log',
          terminationMessagePolicy: 'File',
          volumeMounts:             [
            {
              mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
              name:      'kube-api-access-kvh75',
              readOnly:  true
            }
          ]
        }
      ],
      dnsPolicy:                     'ClusterFirst',
      enableServiceLinks:            true,
      nodeName:                      'ip-172-31-14-159',
      preemptionPolicy:              'PreemptLowerPriority',
      priority:                      0,
      restartPolicy:                 'Always',
      schedulerName:                 'default-scheduler',
      securityContext:               {},
      serviceAccount:                'default',
      serviceAccountName:            'default',
      terminationGracePeriodSeconds: 30,
      tolerations:                   [
        {
          effect:            'NoExecute',
          key:               'node.kubernetes.io/not-ready',
          operator:          'Exists',
          tolerationSeconds: 300
        },
        {
          effect:            'NoExecute',
          key:               'node.kubernetes.io/unreachable',
          operator:          'Exists',
          tolerationSeconds: 300
        }
      ],
      volumes: [
        {
          name:      'kube-api-access-kvh75',
          projected: {
            defaultMode: 420,
            sources:     [
              {
                serviceAccountToken: {
                  expirationSeconds: 3607,
                  path:              'token'
                }
              },
              {
                configMap: {
                  items: [
                    {
                      key:  'ca.crt',
                      path: 'ca.crt'
                    }
                  ],
                  name: 'kube-root-ca.crt'
                }
              },
              {
                downwardAPI: {
                  items: [
                    {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      },
                      path: 'namespace'
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    },
    status: {
      conditions: [
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:43Z',
          lastUpdateTime:     '2024-08-07T23:58:43Z',
          status:             'True',
          transitioning:      false,
          type:               'Initialized'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:44Z',
          lastUpdateTime:     '2024-08-07T23:58:44Z',
          status:             'True',
          transitioning:      false,
          type:               'Ready'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:44Z',
          lastUpdateTime:     '2024-08-07T23:58:44Z',
          status:             'True',
          transitioning:      false,
          type:               'ContainersReady'
        },
        {
          error:              false,
          lastProbeTime:      null,
          lastTransitionTime: '2024-08-07T23:58:43Z',
          lastUpdateTime:     '2024-08-07T23:58:43Z',
          status:             'True',
          transitioning:      false,
          type:               'PodScheduled'
        }
      ],
      containerStatuses: [
        {
          containerID:  'containerd://62675e963f91ea73955fa82f67f7082a88e067922d5272aac996eee44b284fe7',
          image:        'docker.io/library/nginx:latest',
          imageID:      'docker.io/library/nginx@sha256:6af79ae5de407283dcea8b00d5c37ace95441fd58a8b1d2aa1ed93f5511bb18c',
          lastState:    {},
          name:         'container-0',
          ready:        true,
          restartCount: 0,
          started:      true,
          state:        { running: { startedAt: '2024-08-07T23:58:44Z' } }
        }
      ],
      hostIP: '172.31.14.159',
      phase:  'Running',
      podIP:  '10.42.2.204',
      podIPs: [
        { ip: '10.42.2.204' }
      ],
      qosClass:  'BestEffort',
      startTime: '2024-08-07T23:58:43Z'
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

export function generatePodsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/pods?*', reply(200, podsGetResponseSmallSet)).as('podsDataSmall');
}
