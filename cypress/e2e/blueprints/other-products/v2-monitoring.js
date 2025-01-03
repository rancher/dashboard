import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

// GET /k8s/clusters/local/v1/monitoring.coreos.com.podmonitors
const podMonitorsGet = {
  type:         'collection',
  links:        { self: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.podmonitors' },
  createTypes:  { 'monitoring.coreos.com.podmonitor': 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.podmonitors' },
  actions:      {},
  resourceType: 'monitoring.coreos.com.podmonitor',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  data:         []
};

// GET /k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors
const serviceMonitorsGet = {
  type:         'collection',
  links:        { self: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors' },
  createTypes:  { 'monitoring.coreos.com.servicemonitor': 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors' },
  actions:      {},
  resourceType: 'monitoring.coreos.com.servicemonitor',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        14,
  data:         [
    {
      id:    'cattle-monitoring-system/rancher-monitoring-alertmanager',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-alertmanager',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-alertmanager',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-alertmanager',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-alertmanager'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-alertmanager',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-alertmanager',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:selector': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-alertmanager',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '14e8dbfc-7e72-4bf2-8cc3-ebdd565770a0'
      },
      spec: {
        endpoints: [
          {
            enableHttp2:       true,
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            path: '/metrics',
            port: 'http-web'
          }
        ],
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        selector: {
          matchLabels: {
            app:            'rancher-monitoring-alertmanager',
            release:        'rancher-monitoring',
            'self-monitor': 'true'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-grafana',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-grafana',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-grafana',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-grafana',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-grafana'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-grafana',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'grafana',
          'app.kubernetes.io/version':    '9.1.5',
          'helm.sh/chart':                'grafana-6.59.0'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/name':       {},
                  'f:app.kubernetes.io/version':    {},
                  'f:helm.sh/chart':                {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:selector': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-grafana',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'fd0bed58-e8c8-4c3d-873c-f63543806038'
      },
      spec: {
        endpoints: [
          {
            honorLabels:       true,
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            path:          '/metrics',
            port:          'nginx-http',
            scheme:        'http',
            scrapeTimeout: '30s'
          }
        ],
        jobLabel:          'rancher-monitoring',
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        selector: {
          matchLabels: {
            'app.kubernetes.io/instance': 'rancher-monitoring',
            'app.kubernetes.io/name':     'grafana'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-controller-manager',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-controller-manager',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-controller-manager',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-controller-manager',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-kube-controller-manager'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-controller-manager',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-kube-controller-manager',
          'app.kubernetes.io/managed-by': 'Helm',
          component:                      'kube-controller-manager',
          provider:                       'kubernetes',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:component':                    {},
                  'f:provider':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:podTargetLabels': {},
                'f:selector':        {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-controller-manager',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'edcee501-3fcd-4258-b84e-ec9e14ef5560'
      },
      spec: {
        endpoints: [
          {
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              },
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              }
            ],
            params: {
              _scheme: [
                'https'
              ]
            },
            port:     'metrics',
            proxyUrl: 'http://pushprox-kube-controller-manager-proxy.cattle-monitoring-system.svc:8080'
          }
        ],
        jobLabel:          'component',
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        podTargetLabels: [
          'component',
          'pushprox-exporter'
        ],
        selector: {
          matchLabels: {
            component: 'kube-controller-manager',
            'k8s-app': 'pushprox-kube-controller-manager-client',
            provider:  'kubernetes',
            release:   'rancher-monitoring'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-etcd',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-etcd',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-etcd',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-etcd',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-kube-etcd'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-etcd',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-kube-etcd',
          'app.kubernetes.io/managed-by': 'Helm',
          component:                      'kube-etcd',
          provider:                       'kubernetes',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:component':                    {},
                  'f:provider':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:podTargetLabels': {},
                'f:selector':        {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-etcd',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '90894fbc-0ef2-4061-800e-a2098177762d'
      },
      spec: {
        endpoints: [
          {
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              },
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              }
            ],
            port:     'metrics',
            proxyUrl: 'http://pushprox-kube-etcd-proxy.cattle-monitoring-system.svc:8080'
          }
        ],
        jobLabel:          'component',
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        podTargetLabels: [
          'component',
          'pushprox-exporter'
        ],
        selector: {
          matchLabels: {
            component: 'kube-etcd',
            'k8s-app': 'pushprox-kube-etcd-client',
            provider:  'kubernetes',
            release:   'rancher-monitoring'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-proxy',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-proxy',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-proxy',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-proxy',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-kube-proxy'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-proxy',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-kube-proxy',
          'app.kubernetes.io/managed-by': 'Helm',
          component:                      'kube-proxy',
          provider:                       'kubernetes',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:component':                    {},
                  'f:provider':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:podTargetLabels': {},
                'f:selector':        {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-proxy',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '7652f34d-f08e-42c2-8faa-93e99ec8944d'
      },
      spec: {
        endpoints: [
          {
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              },
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              }
            ],
            port:     'metrics',
            proxyUrl: 'http://pushprox-kube-proxy-proxy.cattle-monitoring-system.svc:8080'
          }
        ],
        jobLabel:          'component',
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        podTargetLabels: [
          'component',
          'pushprox-exporter'
        ],
        selector: {
          matchLabels: {
            component: 'kube-proxy',
            'k8s-app': 'pushprox-kube-proxy-client',
            provider:  'kubernetes',
            release:   'rancher-monitoring'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-scheduler',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-scheduler',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-scheduler',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-scheduler',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-kube-scheduler'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-scheduler',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-kube-scheduler',
          'app.kubernetes.io/managed-by': 'Helm',
          component:                      'kube-scheduler',
          provider:                       'kubernetes',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:component':                    {},
                  'f:provider':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:podTargetLabels': {},
                'f:selector':        {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-scheduler',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'deba2a16-306b-4dc2-9df6-082af33a9e40'
      },
      spec: {
        endpoints: [
          {
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              },
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              }
            ],
            params: {
              _scheme: [
                'https'
              ]
            },
            port:     'metrics',
            proxyUrl: 'http://pushprox-kube-scheduler-proxy.cattle-monitoring-system.svc:8080'
          }
        ],
        jobLabel:          'component',
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        podTargetLabels: [
          'component',
          'pushprox-exporter'
        ],
        selector: {
          matchLabels: {
            component: 'kube-scheduler',
            'k8s-app': 'pushprox-kube-scheduler-client',
            provider:  'kubernetes',
            release:   'rancher-monitoring'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-kube-state-metrics'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-state-metrics',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/component':  'metrics',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'kube-state-metrics',
          'app.kubernetes.io/part-of':    'kube-state-metrics',
          'app.kubernetes.io/version':    '2.9.2',
          'helm.sh/chart':                'kube-state-metrics-5.8.1',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app.kubernetes.io/component':  {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/name':       {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:helm.sh/chart':                {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':           {},
                'f:endpoints': {},
                'f:jobLabel':  {},
                'f:selector':  {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-state-metrics',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '3bd09fde-5d8b-41e3-b329-d2f3740cbe82'
      },
      spec: {
        endpoints: [
          {
            honorLabels:       true,
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            port: 'http'
          }
        ],
        jobLabel: 'app.kubernetes.io/name',
        selector: {
          matchLabels: {
            'app.kubernetes.io/instance': 'rancher-monitoring',
            'app.kubernetes.io/name':     'kube-state-metrics'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-operator',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-operator',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-operator',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-operator',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-operator'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-operator',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-operator',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:selector': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-operator',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'c82c0bbc-a17a-446c-a00f-7c854c0c925f'
      },
      spec: {
        endpoints: [
          {
            honorLabels:       true,
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            port:      'https',
            scheme:    'https',
            tlsConfig: {
              ca: {
                secret: {
                  key:      'ca',
                  name:     'rancher-monitoring-admission',
                  optional: false
                }
              },
              serverName: 'rancher-monitoring-operator'
            }
          }
        ],
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        selector: {
          matchLabels: {
            app:     'rancher-monitoring-operator',
            release: 'rancher-monitoring'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-prometheus',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-prometheus',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-prometheus',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-prometheus',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-prometheus'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-prometheus',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-prometheus',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:selector': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-prometheus',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'a55f009f-d973-496c-b06f-abcce82ea587'
      },
      spec: {
        endpoints: [
          {
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            path: '/metrics',
            port: 'http-web'
          }
        ],
        namespaceSelector: {
          matchNames: [
            'cattle-monitoring-system'
          ]
        },
        selector: {
          matchLabels: {
            app:            'rancher-monitoring-prometheus',
            release:        'rancher-monitoring',
            'self-monitor': 'true'
          }
        }
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-prometheus-node-exporter',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-prometheus-node-exporter',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-prometheus-node-exporter',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/cattle-monitoring-system/rancher-monitoring-prometheus-node-exporter',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/servicemonitors/rancher-monitoring-prometheus-node-exporter'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-prometheus-node-exporter',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/component':  'metrics',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'prometheus-node-exporter',
          'app.kubernetes.io/part-of':    'prometheus-node-exporter',
          'app.kubernetes.io/version':    '1.6.0',
          'helm.sh/chart':                'prometheus-node-exporter-4.20.0',
          jobLabel:                       'node-exporter',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app.kubernetes.io/component':  {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/name':       {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:helm.sh/chart':                {},
                  'f:jobLabel':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                {},
                'f:attachMetadata': {
                  '.':      {},
                  'f:node': {}
                },
                'f:endpoints': {},
                'f:jobLabel':  {},
                'f:selector':  {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-prometheus-node-exporter',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'c108c1e7-0526-479c-b1f5-2eff7c12abd4'
      },
      spec: {
        attachMetadata: { node: false },
        endpoints:      [
          {
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            port:   'http-metrics',
            scheme: 'http'
          }
        ],
        jobLabel: 'jobLabel',
        selector: {
          matchLabels: {
            'app.kubernetes.io/instance': 'rancher-monitoring',
            'app.kubernetes.io/name':     'prometheus-node-exporter'
          }
        }
      }
    },
    {
      id:    'default/rancher-monitoring-apiserver',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/default/rancher-monitoring-apiserver',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/default/rancher-monitoring-apiserver',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/default/rancher-monitoring-apiserver',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/default/servicemonitors/rancher-monitoring-apiserver'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-apiserver',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-apiserver',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:selector': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:            'rancher-monitoring-apiserver',
        namespace:       'default',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '7c27858b-d672-4233-b0f0-1bfd2fd77005'
      },
      spec: {
        endpoints: [
          {
            bearerTokenFile:   '/var/run/secrets/kubernetes.io/serviceaccount/token',
            metricRelabelings: [
              {
                action:       'drop',
                regex:        'apiserver_request_duration_seconds_bucket;(0.15|0.2|0.3|0.35|0.4|0.45|0.6|0.7|0.8|0.9|1.25|1.5|1.75|2|3|3.5|4|4.5|6|7|8|9|15|25|40|50)',
                sourceLabels: [
                  '__name__',
                  'le'
                ]
              },
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            port:      'https',
            scheme:    'https',
            tlsConfig: {
              caFile:             '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt',
              insecureSkipVerify: false,
              serverName:         'kubernetes'
            }
          }
        ],
        jobLabel:          'component',
        namespaceSelector: {
          matchNames: [
            'default'
          ]
        },
        selector: {
          matchLabels: {
            component: 'apiserver',
            provider:  'kubernetes'
          }
        }
      }
    },
    {
      id:    'kube-system/rancher-monitoring-coredns',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-coredns',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-coredns',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-coredns',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/kube-system/servicemonitors/rancher-monitoring-coredns'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-coredns',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-coredns',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:selector': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:            'rancher-monitoring-coredns',
        namespace:       'kube-system',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '3374e599-c20f-42c0-983e-7cb64cc59f54'
      },
      spec: {
        endpoints: [
          {
            bearerTokenFile:   '/var/run/secrets/kubernetes.io/serviceaccount/token',
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            port: 'http-metrics'
          }
        ],
        jobLabel:          'jobLabel',
        namespaceSelector: {
          matchNames: [
            'kube-system'
          ]
        },
        selector: {
          matchLabels: {
            app:     'rancher-monitoring-coredns',
            release: 'rancher-monitoring'
          }
        }
      }
    },
    {
      id:    'kube-system/rancher-monitoring-ingress-nginx',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-ingress-nginx',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-ingress-nginx',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-ingress-nginx',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/kube-system/servicemonitors/rancher-monitoring-ingress-nginx'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-ingress-nginx',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-ingress-nginx',
          'app.kubernetes.io/managed-by': 'Helm',
          component:                      'ingress-nginx',
          provider:                       'kubernetes',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:component':                    {},
                  'f:provider':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:podTargetLabels': {},
                'f:selector':        {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:            'rancher-monitoring-ingress-nginx',
        namespace:       'kube-system',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '736572af-258a-496b-be1c-34bd7df65651'
      },
      spec: {
        endpoints: [
          {
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              },
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              }
            ],
            port: 'metrics'
          }
        ],
        jobLabel:          'component',
        namespaceSelector: {
          matchNames: [
            'kube-system'
          ]
        },
        podTargetLabels: [
          'component',
          'pushprox-exporter'
        ],
        selector: {
          matchLabels: {
            component: 'ingress-nginx',
            'k8s-app': 'pushprox-ingress-nginx-client',
            provider:  'kubernetes',
            release:   'rancher-monitoring'
          }
        }
      }
    },
    {
      id:    'kube-system/rancher-monitoring-kubelet',
      type:  'monitoring.coreos.com.servicemonitor',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-kubelet',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-kubelet',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors/kube-system/rancher-monitoring-kubelet',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/kube-system/servicemonitors/rancher-monitoring-kubelet'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'ServiceMonitor',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubelet',
          '6m58s'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-kubelet',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':                   {},
                'f:endpoints':         {},
                'f:jobLabel':          {},
                'f:namespaceSelector': {
                  '.':            {},
                  'f:matchNames': {}
                },
                'f:selector': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:            'rancher-monitoring-kubelet',
        namespace:       'kube-system',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '9bfd9682-ed97-4dd6-981a-1a61c82ca7cb'
      },
      spec: {
        endpoints: [
          {
            bearerTokenFile:   '/var/run/secrets/kubernetes.io/serviceaccount/token',
            honorLabels:       true,
            metricRelabelings: [
              {
                action:       'replace',
                replacement:  'local',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_id'
              },
              {
                action:       'replace',
                replacement:  'alex-beefy-rke2',
                sourceLabels: [
                  '__address__'
                ],
                targetLabel: 'cluster_name'
              }
            ],
            port:        'https-metrics',
            relabelings: [
              {
                action:       'replace',
                sourceLabels: [
                  '__metrics_path__'
                ],
                targetLabel: 'metrics_path'
              }
            ],
            scheme:    'https',
            tlsConfig: {
              caFile:             '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt',
              insecureSkipVerify: true
            }
          },
          {
            bearerTokenFile:   '/var/run/secrets/kubernetes.io/serviceaccount/token',
            honorLabels:       true,
            metricRelabelings: [
              {
                action:       'drop',
                regex:        'container_cpu_(cfs_throttled_seconds_total|load_average_10s|system_seconds_total|user_seconds_total)',
                sourceLabels: [
                  '__name__'
                ]
              },
              {
                action:       'drop',
                regex:        'container_fs_(io_current|io_time_seconds_total|io_time_weighted_seconds_total|reads_merged_total|sector_reads_total|sector_writes_total|writes_merged_total)',
                sourceLabels: [
                  '__name__'
                ]
              },
              {
                action:       'drop',
                regex:        'container_memory_(mapped_file|swap)',
                sourceLabels: [
                  '__name__'
                ]
              },
              {
                action:       'drop',
                regex:        'container_(file_descriptors|tasks_state|threads_max)',
                sourceLabels: [
                  '__name__'
                ]
              },
              {
                action:       'drop',
                regex:        'container_spec.*',
                sourceLabels: [
                  '__name__'
                ]
              },
              {
                action:       'drop',
                regex:        '.+;',
                sourceLabels: [
                  'id',
                  'pod'
                ]
              }
            ],
            path:        '/metrics/cadvisor',
            port:        'https-metrics',
            relabelings: [
              {
                action:       'replace',
                sourceLabels: [
                  '__metrics_path__'
                ],
                targetLabel: 'metrics_path'
              }
            ],
            scheme:    'https',
            tlsConfig: {
              caFile:             '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt',
              insecureSkipVerify: true
            }
          },
          {
            bearerTokenFile: '/var/run/secrets/kubernetes.io/serviceaccount/token',
            honorLabels:     true,
            path:            '/metrics/probes',
            port:            'https-metrics',
            relabelings:     [
              {
                action:       'replace',
                sourceLabels: [
                  '__metrics_path__'
                ],
                targetLabel: 'metrics_path'
              }
            ],
            scheme:    'https',
            tlsConfig: {
              caFile:             '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt',
              insecureSkipVerify: true
            }
          }
        ],
        jobLabel:          'k8s-app',
        namespaceSelector: {
          matchNames: [
            'kube-system'
          ]
        },
        selector: {
          matchLabels: {
            'app.kubernetes.io/name': 'kubelet',
            'k8s-app':                'kubelet'
          }
        }
      }
    }
  ]
};

// GET /k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs
const alertManagerConfigsGet = {
  type:         'collection',
  links:        { self: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs' },
  createTypes:  { 'monitoring.coreos.com.alertmanagerconfig': 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs' },
  actions:      {},
  resourceType: 'monitoring.coreos.com.alertmanagerconfig',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  data:         [
    {
      id:    'default/test-alert',
      type:  'monitoring.coreos.com.alertmanagerconfig',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs/default/test-alert',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs/default/test-alert',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs/default/test-alert',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1alpha1/namespaces/default/alertmanagerconfigs/test-alert'
      },
      apiVersion: 'monitoring.coreos.com/v1alpha1',
      kind:       'AlertmanagerConfig',
      metadata:   {
        creationTimestamp: '2024-04-03T13:09:28Z',
        fields:            [
          'test-alert',
          '0s'
        ],
        generation:    1,
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1alpha1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:spec': {
                '.':           {},
                'f:receivers': {},
                'f:route':     {
                  '.':                {},
                  'f:groupBy':        {},
                  'f:groupInterval':  {},
                  'f:groupWait':      {},
                  'f:matchers':       {},
                  'f:repeatInterval': {}
                }
              }
            },
            manager:   'agent',
            operation: 'Update',
            time:      '2024-04-03T13:09:28Z'
          }
        ],
        name:            'test-alert',
        namespace:       'default',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'b3dbb1ec-82b6-44a0-8d33-3dff3c5a15dc'
      },
      spec: {
        receivers: [],
        route:     {
          groupBy:        [],
          groupInterval:  '5m',
          groupWait:      '30s',
          matchers:       [],
          repeatInterval: '4h'
        }
      }
    }
  ]
};

// GET /k8s/clusters/local/v1/monitoring.coreos.com.alertmanagers/cattle-monitoring-system/rancher-monitoring-alertmanager
const rancherMonitoringAlertmanagerGet = {
  id:    'cattle-monitoring-system/rancher-monitoring-alertmanager',
  type:  'monitoring.coreos.com.alertmanager',
  links: {
    remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagers/cattle-monitoring-system/rancher-monitoring-alertmanager',
    self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagers/cattle-monitoring-system/rancher-monitoring-alertmanager',
    update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagers/cattle-monitoring-system/rancher-monitoring-alertmanager',
    view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/alertmanagers/rancher-monitoring-alertmanager'
  },
  apiVersion: 'monitoring.coreos.com/v1',
  kind:       'Alertmanager',
  metadata:   {
    annotations: {
      'meta.helm.sh/release-name':      'rancher-monitoring',
      'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
    },
    creationTimestamp: '2024-04-03T09:17:26Z',
    fields:            [
      'rancher-monitoring-alertmanager',
      'v0.25.0',
      1,
      1,
      'True',
      'True',
      '14m',
      false
    ],
    generation: 1,
    labels:     {
      app:                            'rancher-monitoring-alertmanager',
      'app.kubernetes.io/instance':   'rancher-monitoring',
      'app.kubernetes.io/managed-by': 'Helm',
      'app.kubernetes.io/part-of':    'rancher-monitoring',
      'app.kubernetes.io/version':    '103.0.3_up45.31.1',
      chart:                          'rancher-monitoring-103.0.3_up45.31.1',
      heritage:                       'Helm',
      release:                        'rancher-monitoring'
    },
    managedFields: [
      {
        apiVersion: 'monitoring.coreos.com/v1',
        fieldsType: 'FieldsV1',
        fieldsV1:   {
          'f:metadata': {
            'f:annotations': {
              '.':                                {},
              'f:meta.helm.sh/release-name':      {},
              'f:meta.helm.sh/release-namespace': {}
            },
            'f:labels': {
              '.':                              {},
              'f:app':                          {},
              'f:app.kubernetes.io/instance':   {},
              'f:app.kubernetes.io/managed-by': {},
              'f:app.kubernetes.io/part-of':    {},
              'f:app.kubernetes.io/version':    {},
              'f:chart':                        {},
              'f:heritage':                     {},
              'f:release':                      {}
            }
          },
          'f:spec': {
            '.':                                     {},
            'f:alertmanagerConfigNamespaceSelector': {},
            'f:alertmanagerConfigSelector':          {},
            'f:externalUrl':                         {},
            'f:image':                               {},
            'f:listenLocal':                         {},
            'f:logFormat':                           {},
            'f:logLevel':                            {},
            'f:nodeSelector':                        {
              '.':                  {},
              'f:kubernetes.io/os': {}
            },
            'f:paused':    {},
            'f:portName':  {},
            'f:replicas':  {},
            'f:resources': {
              '.':        {},
              'f:limits': {
                '.':        {},
                'f:cpu':    {},
                'f:memory': {}
              },
              'f:requests': {
                '.':        {},
                'f:cpu':    {},
                'f:memory': {}
              }
            },
            'f:retention':       {},
            'f:routePrefix':     {},
            'f:securityContext': {
              '.':              {},
              'f:fsGroup':      {},
              'f:runAsGroup':   {},
              'f:runAsNonRoot': {},
              'f:runAsUser':    {}
            },
            'f:serviceAccountName': {},
            'f:tolerations':        {},
            'f:version':            {}
          }
        },
        manager:   'helm',
        operation: 'Update',
        time:      '2024-04-03T09:17:26Z'
      },
      {
        apiVersion: 'monitoring.coreos.com/v1',
        fieldsType: 'FieldsV1',
        fieldsV1:   {
          'f:status': {
            '.':                   {},
            'f:availableReplicas': {},
            'f:conditions':        {
              '.':                      {},
              'k:{"type":"Available"}': {
                '.':                    {},
                'f:lastTransitionTime': {},
                'f:observedGeneration': {},
                'f:status':             {},
                'f:type':               {}
              },
              'k:{"type":"Reconciled"}': {
                '.':                    {},
                'f:lastTransitionTime': {},
                'f:observedGeneration': {},
                'f:status':             {},
                'f:type':               {}
              }
            },
            'f:paused':              {},
            'f:replicas':            {},
            'f:unavailableReplicas': {},
            'f:updatedReplicas':     {}
          }
        },
        manager:     'PrometheusOperator',
        operation:   'Update',
        subresource: 'status',
        time:        '2024-04-03T09:17:51Z'
      }
    ],
    name:          'rancher-monitoring-alertmanager',
    namespace:     'cattle-monitoring-system',
    relationships: [
      {
        toId:    'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager-tls-assets-0',
        toType:  'secret',
        rel:     'owner',
        state:   'active',
        message: 'Resource is always ready'
      },
      {
        toId:    'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager-web-config',
        toType:  'secret',
        rel:     'owner',
        state:   'active',
        message: 'Resource is always ready'
      },
      {
        toId:    'cattle-monitoring-system/alertmanager-operated',
        toType:  'service',
        rel:     'owner',
        state:   'active',
        message: 'Service is ready'
      },
      {
        toId:    'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager',
        toType:  'apps.statefulset',
        rel:     'owner',
        state:   'active',
        message: 'All replicas scheduled as expected. Replicas: 1'
      },
      {
        fromId:   'cattle-monitoring-system/rancher-monitoring',
        fromType: 'catalog.cattle.io.app',
        rel:      'helmresource',
        state:    'deployed'
      },
      {
        toId:    'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager-generated',
        toType:  'secret',
        rel:     'owner',
        state:   'active',
        message: 'Resource is always ready'
      }
    ],
    resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
    state:           {
      error:         false,
      message:       'Resource is current',
      name:          'active',
      transitioning: false
    },
    uid: '9e4ef1e4-98e9-4272-afd1-23b12b2f46e4'
  },
  spec: {
    alertmanagerConfigNamespaceSelector: {},
    alertmanagerConfigSelector:          {},
    externalUrl:                         'https://209.97.184.234.sslip.io/k8s/clusters/local/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy',
    image:                               'docker.io/rancher/mirrored-prometheus-alertmanager:v0.25.0',
    listenLocal:                         false,
    logFormat:                           'logfmt',
    logLevel:                            'info',
    nodeSelector:                        { 'kubernetes.io/os': 'linux' },
    paused:                              false,
    portName:                            'http-web',
    replicas:                            1,
    resources:                           {
      limits: {
        cpu:    '1000m',
        memory: '500Mi'
      },
      requests: {
        cpu:    '100m',
        memory: '100Mi'
      }
    },
    retention:       '120h',
    routePrefix:     '/',
    securityContext: {
      fsGroup:      2000,
      runAsGroup:   2000,
      runAsNonRoot: true,
      runAsUser:    1000
    },
    serviceAccountName: 'rancher-monitoring-alertmanager',
    tolerations:        [
      {
        effect:   'NoSchedule',
        key:      'cattle.io/os',
        operator: 'Equal',
        value:    'linux'
      }
    ],
    version: 'v0.25.0'
  },
  status: {
    availableReplicas: 1,
    conditions:        [
      {
        error:              false,
        lastTransitionTime: '2024-04-03T09:17:51Z',
        lastUpdateTime:     '2024-04-03T09:17:51Z',
        observedGeneration: 1,
        status:             'True',
        transitioning:      false,
        type:               'Available'
      },
      {
        error:              false,
        lastTransitionTime: '2024-04-03T09:17:35Z',
        lastUpdateTime:     '2024-04-03T09:17:35Z',
        observedGeneration: 1,
        status:             'True',
        transitioning:      false,
        type:               'Reconciled'
      }
    ],
    paused:              false,
    replicas:            1,
    unavailableReplicas: 0,
    updatedReplicas:     1
  }
};

// GET /k8s/clusters/local/v1/secrets/cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager
const alertManagerRancherMonitoringAlertmanagerGet = {
  id:    'cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager',
  type:  'secret',
  links: {
    remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/secrets/cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager',
    self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/secrets/cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager',
    update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/secrets/cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager',
    view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/api/v1/namespaces/cattle-monitoring-system/secrets/alertmanager-rancher-monitoring-alertmanager'
  },
  _type:      'Opaque',
  apiVersion: 'v1',
  data:       {
    'alertmanager.yaml':     'Z2xvYmFsOgogIHJlc29sdmVfdGltZW91dDogNW0KaW5oaWJpdF9ydWxlczoKLSBlcXVhbDoKICAtIG5hbWVzcGFjZQogIC0gYWxlcnRuYW1lCiAgc291cmNlX21hdGNoZXJzOgogIC0gc2V2ZXJpdHkgPSBjcml0aWNhbAogIHRhcmdldF9tYXRjaGVyczoKICAtIHNldmVyaXR5ID1+IHdhcm5pbmd8aW5mbwotIGVxdWFsOgogIC0gbmFtZXNwYWNlCiAgLSBhbGVydG5hbWUKICBzb3VyY2VfbWF0Y2hlcnM6CiAgLSBzZXZlcml0eSA9IHdhcm5pbmcKICB0YXJnZXRfbWF0Y2hlcnM6CiAgLSBzZXZlcml0eSA9IGluZm8KLSBlcXVhbDoKICAtIG5hbWVzcGFjZQogIHNvdXJjZV9tYXRjaGVyczoKICAtIGFsZXJ0bmFtZSA9IEluZm9JbmhpYml0b3IKICB0YXJnZXRfbWF0Y2hlcnM6CiAgLSBzZXZlcml0eSA9IGluZm8KcmVjZWl2ZXJzOgotIG5hbWU6ICJudWxsIgpyb3V0ZToKICBncm91cF9ieToKICAtIG5hbWVzcGFjZQogIGdyb3VwX2ludGVydmFsOiA1bQogIGdyb3VwX3dhaXQ6IDMwcwogIHJlY2VpdmVyOiAibnVsbCIKICByZXBlYXRfaW50ZXJ2YWw6IDEyaAogIHJvdXRlczoKICAtIG1hdGNoZXJzOgogICAgLSBhbGVydG5hbWUgPX4gIkluZm9JbmhpYml0b3J8V2F0Y2hkb2ciCiAgICByZWNlaXZlcjogIm51bGwiCnRlbXBsYXRlczoKLSAvZXRjL2FsZXJ0bWFuYWdlci9jb25maWcvKi50bXBs',
    'rancher_defaults.tmpl': 'e3stIGRlZmluZSAic2xhY2sucmFuY2hlci50ZXh0IiAtfX0Ke3sgdGVtcGxhdGUgInJhbmNoZXIudGV4dF9tdWx0aXBsZSIgLiB9fQp7ey0gZW5kIC19fQoKe3stIGRlZmluZSAicmFuY2hlci50ZXh0X211bHRpcGxlIiAtfX0KKltHUk9VUCAtIERldGFpbHNdKgpPbmUgb3IgbW9yZSBhbGFybXMgaW4gdGhpcyBncm91cCBoYXZlIHRyaWdnZXJlZCBhIG5vdGlmaWNhdGlvbi4KCnt7LSBpZiBndCAobGVuIC5Hcm91cExhYmVscy5WYWx1ZXMpIDAgfX0KKkdyb3VwIExhYmVsczoqCiAge3stIHJhbmdlIC5Hcm91cExhYmVscy5Tb3J0ZWRQYWlycyB9fQogIOKAoiAqe3sgLk5hbWUgfX06KiBge3sgLlZhbHVlIH19YAogIHt7LSBlbmQgfX0Ke3stIGVuZCB9fQp7ey0gaWYgLkV4dGVybmFsVVJMIH19CipMaW5rIHRvIEFsZXJ0TWFuYWdlcjoqIHt7IC5FeHRlcm5hbFVSTCB9fQp7ey0gZW5kIH19Cgp7ey0gcmFuZ2UgLkFsZXJ0cyB9fQp7eyB0ZW1wbGF0ZSAicmFuY2hlci50ZXh0X3NpbmdsZSIgLiB9fQp7ey0gZW5kIH19Cnt7LSBlbmQgLX19Cgp7ey0gZGVmaW5lICJyYW5jaGVyLnRleHRfc2luZ2xlIiAtfX0Ke3stIGlmIC5MYWJlbHMuYWxlcnRuYW1lIH19CipbQUxFUlQgLSB7eyAuTGFiZWxzLmFsZXJ0bmFtZSB9fV0qCnt7LSBlbHNlIH19CipbQUxFUlRdKgp7ey0gZW5kIH19Cnt7LSBpZiAuTGFiZWxzLnNldmVyaXR5IH19CipTZXZlcml0eToqIGB7eyAuTGFiZWxzLnNldmVyaXR5IH19YAp7ey0gZW5kIH19Cnt7LSBpZiAuTGFiZWxzLmNsdXN0ZXIgfX0KKkNsdXN0ZXI6KiAge3sgLkxhYmVscy5jbHVzdGVyIH19Cnt7LSBlbmQgfX0Ke3stIGlmIC5Bbm5vdGF0aW9ucy5zdW1tYXJ5IH19CipTdW1tYXJ5Oioge3sgLkFubm90YXRpb25zLnN1bW1hcnkgfX0Ke3stIGVuZCB9fQp7ey0gaWYgLkFubm90YXRpb25zLm1lc3NhZ2UgfX0KKk1lc3NhZ2U6KiB7eyAuQW5ub3RhdGlvbnMubWVzc2FnZSB9fQp7ey0gZW5kIH19Cnt7LSBpZiAuQW5ub3RhdGlvbnMuZGVzY3JpcHRpb24gfX0KKkRlc2NyaXB0aW9uOioge3sgLkFubm90YXRpb25zLmRlc2NyaXB0aW9uIH19Cnt7LSBlbmQgfX0Ke3stIGlmIC5Bbm5vdGF0aW9ucy5ydW5ib29rX3VybCB9fQoqUnVuYm9vayBVUkw6KiA8e3sgLkFubm90YXRpb25zLnJ1bmJvb2tfdXJsIH19fDpzcGlyYWxfbm90ZV9wYWQ6Pgp7ey0gZW5kIH19Cnt7LSB3aXRoIC5MYWJlbHMgfX0Ke3stIHdpdGggLlJlbW92ZSAoc3RyaW5nU2xpY2UgImFsZXJ0bmFtZSIgInNldmVyaXR5IiAiY2x1c3RlciIpIH19Cnt7LSBpZiBndCAobGVuIC4pIDAgfX0KKkFkZGl0aW9uYWwgTGFiZWxzOioKICB7ey0gcmFuZ2UgLlNvcnRlZFBhaXJzIH19CiAg4oCiICp7eyAuTmFtZSB9fToqIGB7eyAuVmFsdWUgfX1gCiAge3stIGVuZCB9fQp7ey0gZW5kIH19Cnt7LSBlbmQgfX0Ke3stIGVuZCB9fQp7ey0gd2l0aCAuQW5ub3RhdGlvbnMgfX0Ke3stIHdpdGggLlJlbW92ZSAoc3RyaW5nU2xpY2UgInN1bW1hcnkiICJtZXNzYWdlIiAiZGVzY3JpcHRpb24iICJydW5ib29rX3VybCIpIH19Cnt7LSBpZiBndCAobGVuIC4pIDAgfX0KKkFkZGl0aW9uYWwgQW5ub3RhdGlvbnM6KgogIHt7LSByYW5nZSAuU29ydGVkUGFpcnMgfX0KICDigKIgKnt7IC5OYW1lIH19OiogYHt7IC5WYWx1ZSB9fWAKICB7ey0gZW5kIH19Cnt7LSBlbmQgfX0Ke3stIGVuZCB9fQp7ey0gZW5kIH19Cnt7LSBlbmQgLX19'
  },
  kind:     'Secret',
  metadata: {
    annotations: {
      'helm.sh/hook':            'pre-install, pre-upgrade',
      'helm.sh/hook-weight':     '3',
      'helm.sh/resource-policy': 'keep'
    },
    creationTimestamp: '2024-04-03T09:17:25Z',
    fields:            [
      'alertmanager-rancher-monitoring-alertmanager',
      'Opaque',
      2,
      '14m'
    ],
    labels: {
      app:                            'rancher-monitoring-alertmanager',
      'app.kubernetes.io/instance':   'rancher-monitoring',
      'app.kubernetes.io/managed-by': 'Helm',
      'app.kubernetes.io/part-of':    'rancher-monitoring',
      'app.kubernetes.io/version':    '103.0.3_up45.31.1',
      chart:                          'rancher-monitoring-103.0.3_up45.31.1',
      heritage:                       'Helm',
      release:                        'rancher-monitoring'
    },
    managedFields: [
      {
        apiVersion: 'v1',
        fieldsType: 'FieldsV1',
        fieldsV1:   {
          'f:data': {
            '.':                       {},
            'f:alertmanager.yaml':     {},
            'f:rancher_defaults.tmpl': {}
          },
          'f:metadata': {
            'f:annotations': {
              '.':                         {},
              'f:helm.sh/hook':            {},
              'f:helm.sh/hook-weight':     {},
              'f:helm.sh/resource-policy': {}
            },
            'f:labels': {
              '.':                              {},
              'f:app':                          {},
              'f:app.kubernetes.io/instance':   {},
              'f:app.kubernetes.io/managed-by': {},
              'f:app.kubernetes.io/part-of':    {},
              'f:app.kubernetes.io/version':    {},
              'f:chart':                        {},
              'f:heritage':                     {},
              'f:release':                      {}
            }
          },
          'f:type': {}
        },
        manager:   'helm',
        operation: 'Update',
        time:      '2024-04-03T09:17:25Z'
      }
    ],
    name:            'alertmanager-rancher-monitoring-alertmanager',
    namespace:       'cattle-monitoring-system',
    relationships:   null,
    resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
    state:           {
      error:         false,
      message:       'Resource is always ready',
      name:          'active',
      transitioning: false
    },
    uid: '0efdb1fb-e312-4a81-8a0d-f5261a9b02d5'
  }
};

// GET /k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules
const prometheusRulesGet = {
  type:         'collection',
  links:        { self: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules' },
  createTypes:  { 'monitoring.coreos.com.prometheusrule': 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules' },
  actions:      {},
  resourceType: 'monitoring.coreos.com.prometheusrule',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        27,
  data:         [
    {
      id:    'cattle-monitoring-system/rancher-monitoring-alertmanager.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-alertmanager.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-alertmanager.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-alertmanager.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-alertmanager.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-alertmanager.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                               {},
                  'k:{"name":"alertmanager.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-alertmanager.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '219a56ce-3f2b-4fc6-a1f8-c8fe82eddf42'
      },
      spec: {
        groups: [
          {
            name:  'alertmanager.rules',
            rules: [
              {
                alert:       'AlertmanagerFailedReload',
                annotations: {
                  description: 'Configuration has failed to load for {{ $labels.namespace }}/{{ $labels.pod}}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagerfailedreload',
                  summary:     'Reloading an Alertmanager configuration has failed.'
                },
                expr:   '# Without max_over_time, failed scrapes could create false negatives, see\n# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.\nmax_over_time(alertmanager_config_last_reload_successful{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}[5m]) == 0',
                for:    '10m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'AlertmanagerMembersInconsistent',
                annotations: {
                  description: 'Alertmanager {{ $labels.namespace }}/{{ $labels.pod}} has only found {{ $value }} members of the {{$labels.job}} cluster.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagermembersinconsistent',
                  summary:     'A member of an Alertmanager cluster has not found all other cluster members.'
                },
                expr:   '# Without max_over_time, failed scrapes could create false negatives, see\n# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.\n  max_over_time(alertmanager_cluster_members{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}[5m])\n< on (namespace,service) group_left\n  count by (namespace,service) (max_over_time(alertmanager_cluster_members{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}[5m]))',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'AlertmanagerFailedToSendAlerts',
                annotations: {
                  description: 'Alertmanager {{ $labels.namespace }}/{{ $labels.pod}} failed to send {{ $value | humanizePercentage }} of notifications to {{ $labels.integration }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagerfailedtosendalerts',
                  summary:     'An Alertmanager instance failed to send notifications.'
                },
                expr:   '(\n  rate(alertmanager_notifications_failed_total{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}[5m])\n/\n  rate(alertmanager_notifications_total{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}[5m])\n)\n> 0.01',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'AlertmanagerClusterFailedToSendAlerts',
                annotations: {
                  description: 'The minimum notification failure rate to {{ $labels.integration }} sent from any instance in the {{$labels.job}} cluster is {{ $value | humanizePercentage }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagerclusterfailedtosendalerts',
                  summary:     'All Alertmanager instances in a cluster failed to send notifications to a critical integration.'
                },
                expr:   'min by (namespace,service, integration) (\n  rate(alertmanager_notifications_failed_total{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system", integration=~`.*`}[5m])\n/\n  rate(alertmanager_notifications_total{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system", integration=~`.*`}[5m])\n)\n> 0.01',
                for:    '5m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'AlertmanagerClusterFailedToSendAlerts',
                annotations: {
                  description: 'The minimum notification failure rate to {{ $labels.integration }} sent from any instance in the {{$labels.job}} cluster is {{ $value | humanizePercentage }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagerclusterfailedtosendalerts',
                  summary:     'All Alertmanager instances in a cluster failed to send notifications to a non-critical integration.'
                },
                expr:   'min by (namespace,service, integration) (\n  rate(alertmanager_notifications_failed_total{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system", integration!~`.*`}[5m])\n/\n  rate(alertmanager_notifications_total{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system", integration!~`.*`}[5m])\n)\n> 0.01',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'AlertmanagerConfigInconsistent',
                annotations: {
                  description: 'Alertmanager instances within the {{$labels.job}} cluster have different configurations.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagerconfiginconsistent',
                  summary:     'Alertmanager instances within the same cluster have different configurations.'
                },
                expr:   'count by (namespace,service) (\n  count_values by (namespace,service) ("config_hash", alertmanager_config_hash{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"})\n)\n!= 1',
                for:    '20m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'AlertmanagerClusterDown',
                annotations: {
                  description: '{{ $value | humanizePercentage }} of Alertmanager instances within the {{$labels.job}} cluster have been up for less than half of the last 5m.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagerclusterdown',
                  summary:     'Half or more of the Alertmanager instances within the same cluster are down.'
                },
                expr:   '(\n  count by (namespace,service) (\n    avg_over_time(up{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}[5m]) < 0.5\n  )\n/\n  count by (namespace,service) (\n    up{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}\n  )\n)\n>= 0.5',
                for:    '5m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'AlertmanagerClusterCrashlooping',
                annotations: {
                  description: '{{ $value | humanizePercentage }} of Alertmanager instances within the {{$labels.job}} cluster have restarted at least 5 times in the last 10m.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/alertmanager/alertmanagerclustercrashlooping',
                  summary:     'Half or more of the Alertmanager instances within the same cluster are crashlooping.'
                },
                expr:   '(\n  count by (namespace,service) (\n    changes(process_start_time_seconds{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}[10m]) > 4\n  )\n/\n  count by (namespace,service) (\n    up{job="rancher-monitoring-alertmanager",namespace="cattle-monitoring-system"}\n  )\n)\n>= 0.5',
                for:    '5m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-config-reloaders',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-config-reloaders',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-config-reloaders',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-config-reloaders',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-config-reloaders'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-config-reloaders',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                             {},
                  'k:{"name":"config-reloaders"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-config-reloaders',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'd4e0b07c-2884-4367-a76f-969375c97504'
      },
      spec: {
        groups: [
          {
            name:  'config-reloaders',
            rules: [
              {
                alert:       'ConfigReloaderSidecarErrors',
                annotations: {
                  description: 'Errors encountered while the {{$labels.pod}} config-reloader sidecar attempts to sync config in {{$labels.namespace}} namespace.\nAs a result, configuration for service running in {{$labels.pod}} may be stale and cannot be updated anymore.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/configreloadersidecarerrors',
                  summary:     'config-reloader sidecar has not had a successful reload for 10m'
                },
                expr:   'max_over_time(reloader_last_reload_successful{namespace=~".+"}[5m]) == 0',
                for:    '10m',
                labels: { severity: 'warning' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-etcd',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-etcd',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-etcd',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-etcd',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-etcd'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-etcd',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                 {},
                  'k:{"name":"etcd"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-etcd',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '2334d6fc-7b46-499f-a0da-3f83f600362e'
      },
      spec: {
        groups: [
          {
            name:  'etcd',
            rules: [
              {
                alert:       'etcdMembersDown',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": members are down ({{ $value }}).',
                  summary:     'etcd cluster members are down.'
                },
                expr:   'max without (endpoint) (\n  sum without (instance) (up{job=~".*etcd.*"} == bool 0)\nor\n  count without (To) (\n    sum without (instance) (rate(etcd_network_peer_sent_failures_total{job=~".*etcd.*"}[120s])) > 0.01\n  )\n)\n> 0',
                for:    '10m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'etcdInsufficientMembers',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": insufficient members ({{ $value }}).',
                  summary:     'etcd cluster has insufficient number of members.'
                },
                expr:   'sum(up{job=~".*etcd.*"} == bool 1) without (instance) < ((count(up{job=~".*etcd.*"}) without (instance) + 1) / 2)',
                for:    '3m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'etcdNoLeader',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": member {{ $labels.instance }} has no leader.',
                  summary:     'etcd cluster has no leader.'
                },
                expr:   'etcd_server_has_leader{job=~".*etcd.*"} == 0',
                for:    '1m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'etcdHighNumberOfLeaderChanges',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": {{ $value }} leader changes within the last 15 minutes. Frequent elections may be a sign of insufficient resources, high network latency, or disruptions by other components and should be investigated.',
                  summary:     'etcd cluster has high number of leader changes.'
                },
                expr:   'increase((max without (instance) (etcd_server_leader_changes_seen_total{job=~".*etcd.*"}) or 0*absent(etcd_server_leader_changes_seen_total{job=~".*etcd.*"}))[15m:1m]) >= 4',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'etcdHighNumberOfFailedGRPCRequests',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": {{ $value }}% of requests for {{ $labels.grpc_method }} failed on etcd instance {{ $labels.instance }}.',
                  summary:     'etcd cluster has high number of failed grpc requests.'
                },
                expr:   '100 * sum(rate(grpc_server_handled_total{job=~".*etcd.*", grpc_code=~"Unknown|FailedPrecondition|ResourceExhausted|Internal|Unavailable|DataLoss|DeadlineExceeded"}[5m])) without (grpc_type, grpc_code)\n  /\nsum(rate(grpc_server_handled_total{job=~".*etcd.*"}[5m])) without (grpc_type, grpc_code)\n  > 1',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'etcdHighNumberOfFailedGRPCRequests',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": {{ $value }}% of requests for {{ $labels.grpc_method }} failed on etcd instance {{ $labels.instance }}.',
                  summary:     'etcd cluster has high number of failed grpc requests.'
                },
                expr:   '100 * sum(rate(grpc_server_handled_total{job=~".*etcd.*", grpc_code=~"Unknown|FailedPrecondition|ResourceExhausted|Internal|Unavailable|DataLoss|DeadlineExceeded"}[5m])) without (grpc_type, grpc_code)\n  /\nsum(rate(grpc_server_handled_total{job=~".*etcd.*"}[5m])) without (grpc_type, grpc_code)\n  > 5',
                for:    '5m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'etcdGRPCRequestsSlow',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": 99th percentile of gRPC requests is {{ $value }}s on etcd instance {{ $labels.instance }} for {{ $labels.grpc_method }} method.',
                  summary:     'etcd grpc requests are slow'
                },
                expr:   'histogram_quantile(0.99, sum(rate(grpc_server_handling_seconds_bucket{job=~".*etcd.*", grpc_method!="Defragment", grpc_type="unary"}[5m])) without(grpc_type))\n> 0.15',
                for:    '10m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'etcdMemberCommunicationSlow',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": member communication with {{ $labels.To }} is taking {{ $value }}s on etcd instance {{ $labels.instance }}.',
                  summary:     'etcd cluster member communication is slow.'
                },
                expr:   'histogram_quantile(0.99, rate(etcd_network_peer_round_trip_time_seconds_bucket{job=~".*etcd.*"}[5m]))\n> 0.15',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'etcdHighNumberOfFailedProposals',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": {{ $value }} proposal failures within the last 30 minutes on etcd instance {{ $labels.instance }}.',
                  summary:     'etcd cluster has high number of proposal failures.'
                },
                expr:   'rate(etcd_server_proposals_failed_total{job=~".*etcd.*"}[15m]) > 5',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'etcdHighFsyncDurations',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": 99th percentile fsync durations are {{ $value }}s on etcd instance {{ $labels.instance }}.',
                  summary:     'etcd cluster 99th percentile fsync durations are too high.'
                },
                expr:   'histogram_quantile(0.99, rate(etcd_disk_wal_fsync_duration_seconds_bucket{job=~".*etcd.*"}[5m]))\n> 0.5',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'etcdHighFsyncDurations',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": 99th percentile fsync durations are {{ $value }}s on etcd instance {{ $labels.instance }}.',
                  summary:     'etcd cluster 99th percentile fsync durations are too high.'
                },
                expr:   'histogram_quantile(0.99, rate(etcd_disk_wal_fsync_duration_seconds_bucket{job=~".*etcd.*"}[5m]))\n> 1',
                for:    '10m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'etcdHighCommitDurations',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": 99th percentile commit durations {{ $value }}s on etcd instance {{ $labels.instance }}.',
                  summary:     'etcd cluster 99th percentile commit durations are too high.'
                },
                expr:   'histogram_quantile(0.99, rate(etcd_disk_backend_commit_duration_seconds_bucket{job=~".*etcd.*"}[5m]))\n> 0.25',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'etcdDatabaseQuotaLowSpace',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": database size exceeds the defined quota on etcd instance {{ $labels.instance }}, please defrag or increase the quota as the writes to etcd will be disabled when it is full.',
                  summary:     'etcd cluster database is running full.'
                },
                expr:   '(last_over_time(etcd_mvcc_db_total_size_in_bytes[5m]) / last_over_time(etcd_server_quota_backend_bytes[5m]))*100 > 95',
                for:    '10m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'etcdExcessiveDatabaseGrowth',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": Predicting running out of disk space in the next four hours, based on write observations within the past four hours on etcd instance {{ $labels.instance }}, please check as it might be disruptive.',
                  summary:     'etcd cluster database growing very fast.'
                },
                expr:   'predict_linear(etcd_mvcc_db_total_size_in_bytes[4h], 4*60*60) > etcd_server_quota_backend_bytes',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'etcdDatabaseHighFragmentationRatio',
                annotations: {
                  description: 'etcd cluster "{{ $labels.job }}": database size in use on instance {{ $labels.instance }} is {{ $value | humanizePercentage }} of the actual allocated disk space, please run defragmentation (e.g. etcdctl defrag) to retrieve the unused fragmented disk space.',
                  runbook_url: 'https://etcd.io/docs/v3.5/op-guide/maintenance/#defragmentation',
                  summary:     'etcd database size in use is less than 50% of the actual allocated storage.'
                },
                expr:   '(last_over_time(etcd_mvcc_db_total_size_in_use_in_bytes[5m]) / last_over_time(etcd_mvcc_db_total_size_in_bytes[5m])) < 0.5 and etcd_mvcc_db_total_size_in_use_in_bytes > 104857600',
                for:    '10m',
                labels: { severity: 'warning' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-general.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-general.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-general.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-general.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-general.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-general.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                          {},
                  'k:{"name":"general.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-general.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '5cf7335e-8bf0-44fe-b2e4-568bd9ebbef8'
      },
      spec: {
        groups: [
          {
            name:  'general.rules',
            rules: [
              {
                alert:       'TargetDown',
                annotations: {
                  description: '{{ printf "%.4g" $value }}% of the {{ $labels.job }}/{{ $labels.service }} targets in {{ $labels.namespace }} namespace are down.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/general/targetdown',
                  summary:     'One or more targets are unreachable.'
                },
                expr:   '100 * (count(up == 0) BY (job, namespace, service) / count(up) BY (job, namespace, service)) > 10',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'Watchdog',
                annotations: {
                  description: 'This is an alert meant to ensure that the entire alerting pipeline is functional.\nThis alert is always firing, therefore it should always be firing in Alertmanager\nand always fire against a receiver. There are integrations with various notification\nmechanisms that send a notification when this alert is not firing. For example the\n"DeadMansSnitch" integration in PagerDuty.\n',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/general/watchdog',
                  summary:     'An alert that should always be firing to certify that Alertmanager is working properly.'
                },
                expr:   'vector(1)',
                labels: { severity: 'none' }
              },
              {
                alert:       'InfoInhibitor',
                annotations: {
                  description: "This is an alert that is used to inhibit info alerts.\nBy themselves, the info-level alerts are sometimes very noisy, but they are relevant when combined with\nother alerts.\nThis alert fires whenever there's a severity=\"info\" alert, and stops firing when another alert with a\nseverity of 'warning' or 'critical' starts firing on the same namespace.\nThis alert should be routed to a null receiver and configured to inhibit alerts with severity=\"info\".\n",
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/general/infoinhibitor',
                  summary:     'Info-level alert inhibition.'
                },
                expr:   'ALERTS{severity = "info"} == 1 unless on(namespace) ALERTS{alertname != "InfoInhibitor", severity =~ "warning|critical", alertstate="firing"} == 1',
                labels: { severity: 'none' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-k8s.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-k8s.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-k8s.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-k8s.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-k8s.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-k8s.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                      {},
                  'k:{"name":"k8s.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-k8s.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '82891e61-4d1e-4a29-a56c-3b67ea180f79'
      },
      spec: {
        groups: [
          {
            name:  'k8s.rules',
            rules: [
              {
                expr:   'sum by (cluster, namespace, pod, container) (\n  irate(container_cpu_usage_seconds_total{job="kubelet", metrics_path="/metrics/cadvisor", image!=""}[5m])\n) * on (cluster, namespace, pod) group_left(node) topk by (cluster, namespace, pod) (\n  1, max by(cluster, namespace, pod, node) (kube_pod_info{node!=""})\n)',
                record: 'node_namespace_pod_container:container_cpu_usage_seconds_total:sum_irate'
              },
              {
                expr:   'container_memory_working_set_bytes{job="kubelet", metrics_path="/metrics/cadvisor", image!=""}\n* on (cluster, namespace, pod) group_left(node) topk by(cluster, namespace, pod) (1,\n  max by(cluster, namespace, pod, node) (kube_pod_info{node!=""})\n)',
                record: 'node_namespace_pod_container:container_memory_working_set_bytes'
              },
              {
                expr:   'container_memory_rss{job="kubelet", metrics_path="/metrics/cadvisor", image!=""}\n* on (cluster, namespace, pod) group_left(node) topk by(cluster, namespace, pod) (1,\n  max by(cluster, namespace, pod, node) (kube_pod_info{node!=""})\n)',
                record: 'node_namespace_pod_container:container_memory_rss'
              },
              {
                expr:   'container_memory_cache{job="kubelet", metrics_path="/metrics/cadvisor", image!=""}\n* on (cluster, namespace, pod) group_left(node) topk by(cluster, namespace, pod) (1,\n  max by(cluster, namespace, pod, node) (kube_pod_info{node!=""})\n)',
                record: 'node_namespace_pod_container:container_memory_cache'
              },
              {
                expr:   'container_memory_swap{job="kubelet", metrics_path="/metrics/cadvisor", image!=""}\n* on (cluster, namespace, pod) group_left(node) topk by(cluster, namespace, pod) (1,\n  max by(cluster, namespace, pod, node) (kube_pod_info{node!=""})\n)',
                record: 'node_namespace_pod_container:container_memory_swap'
              },
              {
                expr:   'kube_pod_container_resource_requests{resource="memory",job="kube-state-metrics"}  * on (namespace, pod, cluster)\ngroup_left() max by (namespace, pod, cluster) (\n  (kube_pod_status_phase{phase=~"Pending|Running"} == 1)\n)',
                record: 'cluster:namespace:pod_memory:active:kube_pod_container_resource_requests'
              },
              {
                expr:   'sum by (namespace, cluster) (\n    sum by (namespace, pod, cluster) (\n        max by (namespace, pod, container, cluster) (\n          kube_pod_container_resource_requests{resource="memory",job="kube-state-metrics"}\n        ) * on(namespace, pod, cluster) group_left() max by (namespace, pod, cluster) (\n          kube_pod_status_phase{phase=~"Pending|Running"} == 1\n        )\n    )\n)',
                record: 'namespace_memory:kube_pod_container_resource_requests:sum'
              },
              {
                expr:   'kube_pod_container_resource_requests{resource="cpu",job="kube-state-metrics"}  * on (namespace, pod, cluster)\ngroup_left() max by (namespace, pod, cluster) (\n  (kube_pod_status_phase{phase=~"Pending|Running"} == 1)\n)',
                record: 'cluster:namespace:pod_cpu:active:kube_pod_container_resource_requests'
              },
              {
                expr:   'sum by (namespace, cluster) (\n    sum by (namespace, pod, cluster) (\n        max by (namespace, pod, container, cluster) (\n          kube_pod_container_resource_requests{resource="cpu",job="kube-state-metrics"}\n        ) * on(namespace, pod, cluster) group_left() max by (namespace, pod, cluster) (\n          kube_pod_status_phase{phase=~"Pending|Running"} == 1\n        )\n    )\n)',
                record: 'namespace_cpu:kube_pod_container_resource_requests:sum'
              },
              {
                expr:   'kube_pod_container_resource_limits{resource="memory",job="kube-state-metrics"}  * on (namespace, pod, cluster)\ngroup_left() max by (namespace, pod, cluster) (\n  (kube_pod_status_phase{phase=~"Pending|Running"} == 1)\n)',
                record: 'cluster:namespace:pod_memory:active:kube_pod_container_resource_limits'
              },
              {
                expr:   'sum by (namespace, cluster) (\n    sum by (namespace, pod, cluster) (\n        max by (namespace, pod, container, cluster) (\n          kube_pod_container_resource_limits{resource="memory",job="kube-state-metrics"}\n        ) * on(namespace, pod, cluster) group_left() max by (namespace, pod, cluster) (\n          kube_pod_status_phase{phase=~"Pending|Running"} == 1\n        )\n    )\n)',
                record: 'namespace_memory:kube_pod_container_resource_limits:sum'
              },
              {
                expr:   'kube_pod_container_resource_limits{resource="cpu",job="kube-state-metrics"}  * on (namespace, pod, cluster)\ngroup_left() max by (namespace, pod, cluster) (\n (kube_pod_status_phase{phase=~"Pending|Running"} == 1)\n )',
                record: 'cluster:namespace:pod_cpu:active:kube_pod_container_resource_limits'
              },
              {
                expr:   'sum by (namespace, cluster) (\n    sum by (namespace, pod, cluster) (\n        max by (namespace, pod, container, cluster) (\n          kube_pod_container_resource_limits{resource="cpu",job="kube-state-metrics"}\n        ) * on(namespace, pod, cluster) group_left() max by (namespace, pod, cluster) (\n          kube_pod_status_phase{phase=~"Pending|Running"} == 1\n        )\n    )\n)',
                record: 'namespace_cpu:kube_pod_container_resource_limits:sum'
              },
              {
                expr:   'max by (cluster, namespace, workload, pod) (\n  label_replace(\n    label_replace(\n      kube_pod_owner{job="kube-state-metrics", owner_kind="ReplicaSet"},\n      "replicaset", "$1", "owner_name", "(.*)"\n    ) * on(replicaset, namespace) group_left(owner_name) topk by(replicaset, namespace) (\n      1, max by (replicaset, namespace, owner_name) (\n        kube_replicaset_owner{job="kube-state-metrics"}\n      )\n    ),\n    "workload", "$1", "owner_name", "(.*)"\n  )\n)',
                labels: { workload_type: 'deployment' },
                record: 'namespace_workload_pod:kube_pod_owner:relabel'
              },
              {
                expr:   'max by (cluster, namespace, workload, pod) (\n  label_replace(\n    kube_pod_owner{job="kube-state-metrics", owner_kind="DaemonSet"},\n    "workload", "$1", "owner_name", "(.*)"\n  )\n)',
                labels: { workload_type: 'daemonset' },
                record: 'namespace_workload_pod:kube_pod_owner:relabel'
              },
              {
                expr:   'max by (cluster, namespace, workload, pod) (\n  label_replace(\n    kube_pod_owner{job="kube-state-metrics", owner_kind="StatefulSet"},\n    "workload", "$1", "owner_name", "(.*)"\n  )\n)',
                labels: { workload_type: 'statefulset' },
                record: 'namespace_workload_pod:kube_pod_owner:relabel'
              },
              {
                expr:   'max by (cluster, namespace, workload, pod) (\n  label_replace(\n    kube_pod_owner{job="kube-state-metrics", owner_kind="Job"},\n    "workload", "$1", "owner_name", "(.*)"\n  )\n)',
                labels: { workload_type: 'job' },
                record: 'namespace_workload_pod:kube_pod_owner:relabel'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-apiserver-availability.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-availability.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-availability.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-availability.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kube-apiserver-availability.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-apiserver-availability.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                              {},
                  'k:{"name":"kube-apiserver-availability.rules"}': {
                    '.':          {},
                    'f:interval': {},
                    'f:name':     {},
                    'f:rules':    {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-apiserver-availability.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'f66230f4-57d9-4a56-bf04-589ae1299b3d'
      },
      spec: {
        groups: [
          {
            interval: '3m',
            name:     'kube-apiserver-availability.rules',
            rules:    [
              {
                expr:   'avg_over_time(code_verb:apiserver_request_total:increase1h[30d]) * 24 * 30',
                record: 'code_verb:apiserver_request_total:increase30d'
              },
              {
                expr:   'sum by (cluster, code) (code_verb:apiserver_request_total:increase30d{verb=~"LIST|GET"})',
                labels: { verb: 'read' },
                record: 'code:apiserver_request_total:increase30d'
              },
              {
                expr:   'sum by (cluster, code) (code_verb:apiserver_request_total:increase30d{verb=~"POST|PUT|PATCH|DELETE"})',
                labels: { verb: 'write' },
                record: 'code:apiserver_request_total:increase30d'
              },
              {
                expr:   'sum by (cluster, verb, scope) (increase(apiserver_request_slo_duration_seconds_count[1h]))',
                record: 'cluster_verb_scope:apiserver_request_slo_duration_seconds_count:increase1h'
              },
              {
                expr:   'sum by (cluster, verb, scope) (avg_over_time(cluster_verb_scope:apiserver_request_slo_duration_seconds_count:increase1h[30d]) * 24 * 30)',
                record: 'cluster_verb_scope:apiserver_request_slo_duration_seconds_count:increase30d'
              },
              {
                expr:   'sum by (cluster, verb, scope, le) (increase(apiserver_request_slo_duration_seconds_bucket[1h]))',
                record: 'cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase1h'
              },
              {
                expr:   'sum by (cluster, verb, scope, le) (avg_over_time(cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase1h[30d]) * 24 * 30)',
                record: 'cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d'
              },
              {
                expr:   '1 - (\n  (\n    # write too slow\n    sum by (cluster) (cluster_verb_scope:apiserver_request_slo_duration_seconds_count:increase30d{verb=~"POST|PUT|PATCH|DELETE"})\n    -\n    sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"POST|PUT|PATCH|DELETE",le="1"})\n  ) +\n  (\n    # read too slow\n    sum by (cluster) (cluster_verb_scope:apiserver_request_slo_duration_seconds_count:increase30d{verb=~"LIST|GET"})\n    -\n    (\n      (\n        sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"LIST|GET",scope=~"resource|",le="1"})\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"LIST|GET",scope="namespace",le="5"})\n      +\n      sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"LIST|GET",scope="cluster",le="30"})\n    )\n  ) +\n  # errors\n  sum by (cluster) (code:apiserver_request_total:increase30d{code=~"5.."} or vector(0))\n)\n/\nsum by (cluster) (code:apiserver_request_total:increase30d)',
                labels: { verb: 'all' },
                record: 'apiserver_request:availability30d'
              },
              {
                expr:   '1 - (\n  sum by (cluster) (cluster_verb_scope:apiserver_request_slo_duration_seconds_count:increase30d{verb=~"LIST|GET"})\n  -\n  (\n    # too slow\n    (\n      sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"LIST|GET",scope=~"resource|",le="1"})\n      or\n      vector(0)\n    )\n    +\n    sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"LIST|GET",scope="namespace",le="5"})\n    +\n    sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"LIST|GET",scope="cluster",le="30"})\n  )\n  +\n  # errors\n  sum by (cluster) (code:apiserver_request_total:increase30d{verb="read",code=~"5.."} or vector(0))\n)\n/\nsum by (cluster) (code:apiserver_request_total:increase30d{verb="read"})',
                labels: { verb: 'read' },
                record: 'apiserver_request:availability30d'
              },
              {
                expr:   '1 - (\n  (\n    # too slow\n    sum by (cluster) (cluster_verb_scope:apiserver_request_slo_duration_seconds_count:increase30d{verb=~"POST|PUT|PATCH|DELETE"})\n    -\n    sum by (cluster) (cluster_verb_scope_le:apiserver_request_slo_duration_seconds_bucket:increase30d{verb=~"POST|PUT|PATCH|DELETE",le="1"})\n  )\n  +\n  # errors\n  sum by (cluster) (code:apiserver_request_total:increase30d{verb="write",code=~"5.."} or vector(0))\n)\n/\nsum by (cluster) (code:apiserver_request_total:increase30d{verb="write"})',
                labels: { verb: 'write' },
                record: 'apiserver_request:availability30d'
              },
              {
                expr:   'sum by (cluster,code,resource) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[5m]))',
                labels: { verb: 'read' },
                record: 'code_resource:apiserver_request_total:rate5m'
              },
              {
                expr:   'sum by (cluster,code,resource) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[5m]))',
                labels: { verb: 'write' },
                record: 'code_resource:apiserver_request_total:rate5m'
              },
              {
                expr:   'sum by (cluster, code, verb) (increase(apiserver_request_total{job="apiserver",verb=~"LIST|GET|POST|PUT|PATCH|DELETE",code=~"2.."}[1h]))',
                record: 'code_verb:apiserver_request_total:increase1h'
              },
              {
                expr:   'sum by (cluster, code, verb) (increase(apiserver_request_total{job="apiserver",verb=~"LIST|GET|POST|PUT|PATCH|DELETE",code=~"3.."}[1h]))',
                record: 'code_verb:apiserver_request_total:increase1h'
              },
              {
                expr:   'sum by (cluster, code, verb) (increase(apiserver_request_total{job="apiserver",verb=~"LIST|GET|POST|PUT|PATCH|DELETE",code=~"4.."}[1h]))',
                record: 'code_verb:apiserver_request_total:increase1h'
              },
              {
                expr:   'sum by (cluster, code, verb) (increase(apiserver_request_total{job="apiserver",verb=~"LIST|GET|POST|PUT|PATCH|DELETE",code=~"5.."}[1h]))',
                record: 'code_verb:apiserver_request_total:increase1h'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-apiserver-burnrate.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-burnrate.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-burnrate.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-burnrate.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kube-apiserver-burnrate.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-apiserver-burnrate.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                          {},
                  'k:{"name":"kube-apiserver-burnrate.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-apiserver-burnrate.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '1180ccb7-a995-4fb5-ac1f-56a96102864d'
      },
      spec: {
        groups: [
          {
            name:  'kube-apiserver-burnrate.rules',
            rules: [
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[1d]))\n    -\n    (\n      (\n        sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope=~"resource|",le="1"}[1d]))\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="namespace",le="5"}[1d]))\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="cluster",le="30"}[1d]))\n    )\n  )\n  +\n  # errors\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET",code=~"5.."}[1d]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[1d]))',
                labels: { verb: 'read' },
                record: 'apiserver_request:burnrate1d'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[1h]))\n    -\n    (\n      (\n        sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope=~"resource|",le="1"}[1h]))\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="namespace",le="5"}[1h]))\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="cluster",le="30"}[1h]))\n    )\n  )\n  +\n  # errors\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET",code=~"5.."}[1h]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[1h]))',
                labels: { verb: 'read' },
                record: 'apiserver_request:burnrate1h'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[2h]))\n    -\n    (\n      (\n        sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope=~"resource|",le="1"}[2h]))\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="namespace",le="5"}[2h]))\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="cluster",le="30"}[2h]))\n    )\n  )\n  +\n  # errors\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET",code=~"5.."}[2h]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[2h]))',
                labels: { verb: 'read' },
                record: 'apiserver_request:burnrate2h'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[30m]))\n    -\n    (\n      (\n        sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope=~"resource|",le="1"}[30m]))\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="namespace",le="5"}[30m]))\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="cluster",le="30"}[30m]))\n    )\n  )\n  +\n  # errors\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET",code=~"5.."}[30m]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[30m]))',
                labels: { verb: 'read' },
                record: 'apiserver_request:burnrate30m'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[3d]))\n    -\n    (\n      (\n        sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope=~"resource|",le="1"}[3d]))\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="namespace",le="5"}[3d]))\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="cluster",le="30"}[3d]))\n    )\n  )\n  +\n  # errors\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET",code=~"5.."}[3d]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[3d]))',
                labels: { verb: 'read' },
                record: 'apiserver_request:burnrate3d'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[5m]))\n    -\n    (\n      (\n        sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope=~"resource|",le="1"}[5m]))\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="namespace",le="5"}[5m]))\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="cluster",le="30"}[5m]))\n    )\n  )\n  +\n  # errors\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET",code=~"5.."}[5m]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[5m]))',
                labels: { verb: 'read' },
                record: 'apiserver_request:burnrate5m'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[6h]))\n    -\n    (\n      (\n        sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope=~"resource|",le="1"}[6h]))\n        or\n        vector(0)\n      )\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="namespace",le="5"}[6h]))\n      +\n      sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward",scope="cluster",le="30"}[6h]))\n    )\n  )\n  +\n  # errors\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET",code=~"5.."}[6h]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"LIST|GET"}[6h]))',
                labels: { verb: 'read' },
                record: 'apiserver_request:burnrate6h'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[1d]))\n    -\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward",le="1"}[1d]))\n  )\n  +\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",code=~"5.."}[1d]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[1d]))',
                labels: { verb: 'write' },
                record: 'apiserver_request:burnrate1d'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[1h]))\n    -\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward",le="1"}[1h]))\n  )\n  +\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",code=~"5.."}[1h]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[1h]))',
                labels: { verb: 'write' },
                record: 'apiserver_request:burnrate1h'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[2h]))\n    -\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward",le="1"}[2h]))\n  )\n  +\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",code=~"5.."}[2h]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[2h]))',
                labels: { verb: 'write' },
                record: 'apiserver_request:burnrate2h'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[30m]))\n    -\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward",le="1"}[30m]))\n  )\n  +\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",code=~"5.."}[30m]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[30m]))',
                labels: { verb: 'write' },
                record: 'apiserver_request:burnrate30m'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[3d]))\n    -\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward",le="1"}[3d]))\n  )\n  +\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",code=~"5.."}[3d]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[3d]))',
                labels: { verb: 'write' },
                record: 'apiserver_request:burnrate3d'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[5m]))\n    -\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward",le="1"}[5m]))\n  )\n  +\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",code=~"5.."}[5m]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[5m]))',
                labels: { verb: 'write' },
                record: 'apiserver_request:burnrate5m'
              },
              {
                expr:   '(\n  (\n    # too slow\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_count{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[6h]))\n    -\n    sum by (cluster) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward",le="1"}[6h]))\n  )\n  +\n  sum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",code=~"5.."}[6h]))\n)\n/\nsum by (cluster) (rate(apiserver_request_total{job="apiserver",verb=~"POST|PUT|PATCH|DELETE"}[6h]))',
                labels: { verb: 'write' },
                record: 'apiserver_request:burnrate6h'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-apiserver-histogram.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-histogram.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-histogram.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-histogram.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kube-apiserver-histogram.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-apiserver-histogram.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                           {},
                  'k:{"name":"kube-apiserver-histogram.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-apiserver-histogram.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'b6b33ca5-3f40-4c52-8ba8-ed7f74457596'
      },
      spec: {
        groups: [
          {
            name:  'kube-apiserver-histogram.rules',
            rules: [
              {
                expr:   'histogram_quantile(0.99, sum by (cluster, le, resource) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"LIST|GET",subresource!~"proxy|attach|log|exec|portforward"}[5m]))) > 0',
                labels: {
                  quantile: '0.99',
                  verb:     'read'
                },
                record: 'cluster_quantile:apiserver_request_slo_duration_seconds:histogram_quantile'
              },
              {
                expr:   'histogram_quantile(0.99, sum by (cluster, le, resource) (rate(apiserver_request_slo_duration_seconds_bucket{job="apiserver",verb=~"POST|PUT|PATCH|DELETE",subresource!~"proxy|attach|log|exec|portforward"}[5m]))) > 0',
                labels: {
                  quantile: '0.99',
                  verb:     'write'
                },
                record: 'cluster_quantile:apiserver_request_slo_duration_seconds:histogram_quantile'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-apiserver-slos',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-slos',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-slos',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-apiserver-slos',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kube-apiserver-slos'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-apiserver-slos',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                {},
                  'k:{"name":"kube-apiserver-slos"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-apiserver-slos',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '6097ad9e-d262-42f7-b48e-6433c31d9097'
      },
      spec: {
        groups: [
          {
            name:  'kube-apiserver-slos',
            rules: [
              {
                alert:       'KubeAPIErrorBudgetBurn',
                annotations: {
                  description: 'The API server is burning too much error budget.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeapierrorbudgetburn',
                  summary:     'The API server is burning too much error budget.'
                },
                expr:   'sum(apiserver_request:burnrate1h) > (14.40 * 0.01000)\nand\nsum(apiserver_request:burnrate5m) > (14.40 * 0.01000)',
                for:    '2m',
                labels: {
                  long:     '1h',
                  severity: 'critical',
                  short:    '5m'
                }
              },
              {
                alert:       'KubeAPIErrorBudgetBurn',
                annotations: {
                  description: 'The API server is burning too much error budget.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeapierrorbudgetburn',
                  summary:     'The API server is burning too much error budget.'
                },
                expr:   'sum(apiserver_request:burnrate6h) > (6.00 * 0.01000)\nand\nsum(apiserver_request:burnrate30m) > (6.00 * 0.01000)',
                for:    '15m',
                labels: {
                  long:     '6h',
                  severity: 'critical',
                  short:    '30m'
                }
              },
              {
                alert:       'KubeAPIErrorBudgetBurn',
                annotations: {
                  description: 'The API server is burning too much error budget.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeapierrorbudgetburn',
                  summary:     'The API server is burning too much error budget.'
                },
                expr:   'sum(apiserver_request:burnrate1d) > (3.00 * 0.01000)\nand\nsum(apiserver_request:burnrate2h) > (3.00 * 0.01000)',
                for:    '1h',
                labels: {
                  long:     '1d',
                  severity: 'warning',
                  short:    '2h'
                }
              },
              {
                alert:       'KubeAPIErrorBudgetBurn',
                annotations: {
                  description: 'The API server is burning too much error budget.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeapierrorbudgetburn',
                  summary:     'The API server is burning too much error budget.'
                },
                expr:   'sum(apiserver_request:burnrate3d) > (1.00 * 0.01000)\nand\nsum(apiserver_request:burnrate6h) > (1.00 * 0.01000)',
                for:    '3h',
                labels: {
                  long:     '3d',
                  severity: 'warning',
                  short:    '6h'
                }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-prometheus-general.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-prometheus-general.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-prometheus-general.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-prometheus-general.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kube-prometheus-general.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-prometheus-general.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                          {},
                  'k:{"name":"kube-prometheus-general.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-prometheus-general.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'd2f8abf8-9b6a-49a0-8ddd-2d41d407f398'
      },
      spec: {
        groups: [
          {
            name:  'kube-prometheus-general.rules',
            rules: [
              {
                expr:   'count without(instance, pod, node) (up == 1)',
                record: 'count:up1'
              },
              {
                expr:   'count without(instance, pod, node) (up == 0)',
                record: 'count:up0'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-prometheus-node-recording.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-prometheus-node-recording.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-prometheus-node-recording.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-prometheus-node-recording.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kube-prometheus-node-recording.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-prometheus-node-recording.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                                 {},
                  'k:{"name":"kube-prometheus-node-recording.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-prometheus-node-recording.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '91299411-b8ab-4574-8963-c67b18963df7'
      },
      spec: {
        groups: [
          {
            name:  'kube-prometheus-node-recording.rules',
            rules: [
              {
                expr:   'sum(rate(node_cpu_seconds_total{mode!="idle",mode!="iowait",mode!="steal"}[3m])) BY (instance)',
                record: 'instance:node_cpu:rate:sum'
              },
              {
                expr:   'sum(rate(node_network_receive_bytes_total[3m])) BY (instance)',
                record: 'instance:node_network_receive_bytes:rate:sum'
              },
              {
                expr:   'sum(rate(node_network_transmit_bytes_total[3m])) BY (instance)',
                record: 'instance:node_network_transmit_bytes:rate:sum'
              },
              {
                expr:   'sum(rate(node_cpu_seconds_total{mode!="idle",mode!="iowait",mode!="steal"}[5m])) WITHOUT (cpu, mode) / ON(instance) GROUP_LEFT() count(sum(node_cpu_seconds_total) BY (instance, cpu)) BY (instance)',
                record: 'instance:node_cpu:ratio'
              },
              {
                expr:   'sum(rate(node_cpu_seconds_total{mode!="idle",mode!="iowait",mode!="steal"}[5m]))',
                record: 'cluster:node_cpu:sum_rate5m'
              },
              {
                expr:   'cluster:node_cpu:sum_rate5m / count(sum(node_cpu_seconds_total) BY (instance, cpu))',
                record: 'cluster:node_cpu:ratio'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kube-state-metrics'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kube-state-metrics',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                               {},
                  'k:{"name":"kube-state-metrics"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kube-state-metrics',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '687ef2b3-50f1-4c22-bb63-973f559b368e'
      },
      spec: {
        groups: [
          {
            name:  'kube-state-metrics',
            rules: [
              {
                alert:       'KubeStateMetricsListErrors',
                annotations: {
                  description: 'kube-state-metrics is experiencing errors at an elevated rate in list operations. This is likely causing it to not be able to expose metrics about Kubernetes objects correctly or at all.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kube-state-metrics/kubestatemetricslisterrors',
                  summary:     'kube-state-metrics is experiencing errors in list operations.'
                },
                expr:   '(sum(rate(kube_state_metrics_list_total{job="kube-state-metrics",result="error"}[5m])) by (cluster)\n  /\nsum(rate(kube_state_metrics_list_total{job="kube-state-metrics"}[5m])) by (cluster))\n> 0.01',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubeStateMetricsWatchErrors',
                annotations: {
                  description: 'kube-state-metrics is experiencing errors at an elevated rate in watch operations. This is likely causing it to not be able to expose metrics about Kubernetes objects correctly or at all.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kube-state-metrics/kubestatemetricswatcherrors',
                  summary:     'kube-state-metrics is experiencing errors in watch operations.'
                },
                expr:   '(sum(rate(kube_state_metrics_watch_total{job="kube-state-metrics",result="error"}[5m])) by (cluster)\n  /\nsum(rate(kube_state_metrics_watch_total{job="kube-state-metrics"}[5m])) by (cluster))\n> 0.01',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubeStateMetricsShardingMismatch',
                annotations: {
                  description: 'kube-state-metrics pods are running with different --total-shards configuration, some Kubernetes objects may be exposed multiple times or not exposed at all.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kube-state-metrics/kubestatemetricsshardingmismatch',
                  summary:     'kube-state-metrics sharding is misconfigured.'
                },
                expr:   'stdvar (kube_state_metrics_total_shards{job="kube-state-metrics"}) by (cluster) != 0',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubeStateMetricsShardsMissing',
                annotations: {
                  description: 'kube-state-metrics shards are missing, some Kubernetes objects are not being exposed.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kube-state-metrics/kubestatemetricsshardsmissing',
                  summary:     'kube-state-metrics shards are missing.'
                },
                expr:   '2^max(kube_state_metrics_total_shards{job="kube-state-metrics"}) by (cluster) - 1\n  -\nsum( 2 ^ max by (cluster, shard_ordinal) (kube_state_metrics_shard_ordinal{job="kube-state-metrics"}) ) by (cluster)\n!= 0',
                for:    '15m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubelet.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubelet.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubelet.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubelet.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubelet.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubelet.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                          {},
                  'k:{"name":"kubelet.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubelet.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'c4cb3d47-5a47-440f-acad-cc604c7eba0d'
      },
      spec: {
        groups: [
          {
            name:  'kubelet.rules',
            rules: [
              {
                expr:   'histogram_quantile(0.99, sum(rate(kubelet_pleg_relist_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"})',
                labels: { quantile: '0.99' },
                record: 'node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile'
              },
              {
                expr:   'histogram_quantile(0.9, sum(rate(kubelet_pleg_relist_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"})',
                labels: { quantile: '0.9' },
                record: 'node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile'
              },
              {
                expr:   'histogram_quantile(0.5, sum(rate(kubelet_pleg_relist_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"})',
                labels: { quantile: '0.5' },
                record: 'node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-apps',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-apps',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-apps',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-apps',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-apps'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-apps',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                            {},
                  'k:{"name":"kubernetes-apps"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-apps',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '554134cc-2e14-4ae9-8dd9-edd54b890bc6'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-apps',
            rules: [
              {
                alert:       'KubePodCrashLooping',
                annotations: {
                  description: 'Pod {{ $labels.namespace }}/{{ $labels.pod }} ({{ $labels.container }}) is in waiting state (reason: "CrashLoopBackOff").',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubepodcrashlooping',
                  summary:     'Pod is crash looping.'
                },
                expr:   'max_over_time(kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", job="kube-state-metrics", namespace=~".*"}[5m]) >= 1',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubePodNotReady',
                annotations: {
                  description: 'Pod {{ $labels.namespace }}/{{ $labels.pod }} has been in a non-ready state for longer than 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubepodnotready',
                  summary:     'Pod has been in a non-ready state for more than 15 minutes.'
                },
                expr:   'sum by (namespace, pod, cluster) (\n  max by(namespace, pod, cluster) (\n    kube_pod_status_phase{job="kube-state-metrics", namespace=~".*", phase=~"Pending|Unknown|Failed"}\n  ) * on(namespace, pod, cluster) group_left(owner_kind) topk by(namespace, pod, cluster) (\n    1, max by(namespace, pod, owner_kind, cluster) (kube_pod_owner{owner_kind!="Job"})\n  )\n) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeDeploymentGenerationMismatch',
                annotations: {
                  description: 'Deployment generation for {{ $labels.namespace }}/{{ $labels.deployment }} does not match, this indicates that the Deployment has failed but has not been rolled back.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubedeploymentgenerationmismatch',
                  summary:     'Deployment generation mismatch due to possible roll-back'
                },
                expr:   'kube_deployment_status_observed_generation{job="kube-state-metrics", namespace=~".*"}\n  !=\nkube_deployment_metadata_generation{job="kube-state-metrics", namespace=~".*"}',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeDeploymentReplicasMismatch',
                annotations: {
                  description: 'Deployment {{ $labels.namespace }}/{{ $labels.deployment }} has not matched the expected number of replicas for longer than 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubedeploymentreplicasmismatch',
                  summary:     'Deployment has not matched the expected number of replicas.'
                },
                expr:   '(\n  kube_deployment_spec_replicas{job="kube-state-metrics", namespace=~".*"}\n    >\n  kube_deployment_status_replicas_available{job="kube-state-metrics", namespace=~".*"}\n) and (\n  changes(kube_deployment_status_replicas_updated{job="kube-state-metrics", namespace=~".*"}[10m])\n    ==\n  0\n)',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeStatefulSetReplicasMismatch',
                annotations: {
                  description: 'StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} has not matched the expected number of replicas for longer than 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubestatefulsetreplicasmismatch',
                  summary:     'Deployment has not matched the expected number of replicas.'
                },
                expr:   '(\n  kube_statefulset_status_replicas_ready{job="kube-state-metrics", namespace=~".*"}\n    !=\n  kube_statefulset_status_replicas{job="kube-state-metrics", namespace=~".*"}\n) and (\n  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics", namespace=~".*"}[10m])\n    ==\n  0\n)',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeStatefulSetGenerationMismatch',
                annotations: {
                  description: 'StatefulSet generation for {{ $labels.namespace }}/{{ $labels.statefulset }} does not match, this indicates that the StatefulSet has failed but has not been rolled back.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubestatefulsetgenerationmismatch',
                  summary:     'StatefulSet generation mismatch due to possible roll-back'
                },
                expr:   'kube_statefulset_status_observed_generation{job="kube-state-metrics", namespace=~".*"}\n  !=\nkube_statefulset_metadata_generation{job="kube-state-metrics", namespace=~".*"}',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeStatefulSetUpdateNotRolledOut',
                annotations: {
                  description: 'StatefulSet {{ $labels.namespace }}/{{ $labels.statefulset }} update has not been rolled out.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubestatefulsetupdatenotrolledout',
                  summary:     'StatefulSet update has not been rolled out.'
                },
                expr:   '(\n  max without (revision) (\n    kube_statefulset_status_current_revision{job="kube-state-metrics", namespace=~".*"}\n      unless\n    kube_statefulset_status_update_revision{job="kube-state-metrics", namespace=~".*"}\n  )\n    *\n  (\n    kube_statefulset_replicas{job="kube-state-metrics", namespace=~".*"}\n      !=\n    kube_statefulset_status_replicas_updated{job="kube-state-metrics", namespace=~".*"}\n  )\n)  and (\n  changes(kube_statefulset_status_replicas_updated{job="kube-state-metrics", namespace=~".*"}[5m])\n    ==\n  0\n)',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeDaemonSetRolloutStuck',
                annotations: {
                  description: 'DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} has not finished or progressed for at least 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubedaemonsetrolloutstuck',
                  summary:     'DaemonSet rollout is stuck.'
                },
                expr:   '(\n  (\n    kube_daemonset_status_current_number_scheduled{job="kube-state-metrics", namespace=~".*"}\n     !=\n    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics", namespace=~".*"}\n  ) or (\n    kube_daemonset_status_number_misscheduled{job="kube-state-metrics", namespace=~".*"}\n     !=\n    0\n  ) or (\n    kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics", namespace=~".*"}\n     !=\n    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics", namespace=~".*"}\n  ) or (\n    kube_daemonset_status_number_available{job="kube-state-metrics", namespace=~".*"}\n     !=\n    kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics", namespace=~".*"}\n  )\n) and (\n  changes(kube_daemonset_status_updated_number_scheduled{job="kube-state-metrics", namespace=~".*"}[5m])\n    ==\n  0\n)',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeContainerWaiting',
                annotations: {
                  description: 'pod/{{ $labels.pod }} in namespace {{ $labels.namespace }} on container {{ $labels.container}} has been in waiting state for longer than 1 hour.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubecontainerwaiting',
                  summary:     'Pod container waiting longer than 1 hour'
                },
                expr:   'sum by (namespace, pod, container, cluster) (kube_pod_container_status_waiting_reason{job="kube-state-metrics", namespace=~".*"}) > 0',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeDaemonSetNotScheduled',
                annotations: {
                  description: '{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are not scheduled.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubedaemonsetnotscheduled',
                  summary:     'DaemonSet pods are not scheduled.'
                },
                expr:   'kube_daemonset_status_desired_number_scheduled{job="kube-state-metrics", namespace=~".*"}\n  -\nkube_daemonset_status_current_number_scheduled{job="kube-state-metrics", namespace=~".*"} > 0',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeDaemonSetMisScheduled',
                annotations: {
                  description: '{{ $value }} Pods of DaemonSet {{ $labels.namespace }}/{{ $labels.daemonset }} are running where they are not supposed to run.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubedaemonsetmisscheduled',
                  summary:     'DaemonSet pods are misscheduled.'
                },
                expr:   'kube_daemonset_status_number_misscheduled{job="kube-state-metrics", namespace=~".*"} > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeJobNotCompleted',
                annotations: {
                  description: 'Job {{ $labels.namespace }}/{{ $labels.job_name }} is taking more than {{ "43200" | humanizeDuration }} to complete.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubejobnotcompleted',
                  summary:     'Job did not complete in time'
                },
                expr:   'time() - max by(namespace, job_name, cluster) (kube_job_status_start_time{job="kube-state-metrics", namespace=~".*"}\n  and\nkube_job_status_active{job="kube-state-metrics", namespace=~".*"} > 0) > 43200',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeJobFailed',
                annotations: {
                  description: 'Job {{ $labels.namespace }}/{{ $labels.job_name }} failed to complete. Removing failed job after investigation should clear this alert.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubejobfailed',
                  summary:     'Job failed to complete.'
                },
                expr:   'kube_job_failed{job="kube-state-metrics", namespace=~".*"}  > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeHpaReplicasMismatch',
                annotations: {
                  description: 'HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler  }} has not matched the desired number of replicas for longer than 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubehpareplicasmismatch',
                  summary:     'HPA has not matched desired number of replicas.'
                },
                expr:   '(kube_horizontalpodautoscaler_status_desired_replicas{job="kube-state-metrics", namespace=~".*"}\n  !=\nkube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics", namespace=~".*"})\n  and\n(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics", namespace=~".*"}\n  >\nkube_horizontalpodautoscaler_spec_min_replicas{job="kube-state-metrics", namespace=~".*"})\n  and\n(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics", namespace=~".*"}\n  <\nkube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics", namespace=~".*"})\n  and\nchanges(kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics", namespace=~".*"}[15m]) == 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeHpaMaxedOut',
                annotations: {
                  description: 'HPA {{ $labels.namespace }}/{{ $labels.horizontalpodautoscaler  }} has been running at max replicas for longer than 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubehpamaxedout',
                  summary:     'HPA is running at max replicas'
                },
                expr:   'kube_horizontalpodautoscaler_status_current_replicas{job="kube-state-metrics", namespace=~".*"}\n  ==\nkube_horizontalpodautoscaler_spec_max_replicas{job="kube-state-metrics", namespace=~".*"}',
                for:    '15m',
                labels: { severity: 'warning' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-resources',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-resources',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-resources',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-resources',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-resources'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-resources',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                 {},
                  'k:{"name":"kubernetes-resources"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-resources',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'cb888b8f-ca0b-441b-8219-24b5e8c778c7'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-resources',
            rules: [
              {
                alert:       'KubeCPUOvercommit',
                annotations: {
                  description: 'Cluster has overcommitted CPU resource requests for Pods by {{ $value }} CPU shares and cannot tolerate node failure.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubecpuovercommit',
                  summary:     'Cluster has overcommitted CPU resource requests.'
                },
                expr:   'sum(namespace_cpu:kube_pod_container_resource_requests:sum{}) - (sum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"}) - max(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"})) > 0\nand\n(sum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"}) - max(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"})) > 0',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeMemoryOvercommit',
                annotations: {
                  description: 'Cluster has overcommitted memory resource requests for Pods by {{ $value | humanize }} bytes and cannot tolerate node failure.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubememoryovercommit',
                  summary:     'Cluster has overcommitted memory resource requests.'
                },
                expr:   'sum(namespace_memory:kube_pod_container_resource_requests:sum{}) - (sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"})) > 0\nand\n(sum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"}) - max(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"})) > 0',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeCPUQuotaOvercommit',
                annotations: {
                  description: 'Cluster has overcommitted CPU resource requests for Namespaces.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubecpuquotaovercommit',
                  summary:     'Cluster has overcommitted CPU resource requests.'
                },
                expr:   'sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(cpu|requests.cpu)"}))\n  /\nsum(kube_node_status_allocatable{resource="cpu", job="kube-state-metrics"})\n  > 1.5',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeMemoryQuotaOvercommit',
                annotations: {
                  description: 'Cluster has overcommitted memory resource requests for Namespaces.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubememoryquotaovercommit',
                  summary:     'Cluster has overcommitted memory resource requests.'
                },
                expr:   'sum(min without(resource) (kube_resourcequota{job="kube-state-metrics", type="hard", resource=~"(memory|requests.memory)"}))\n  /\nsum(kube_node_status_allocatable{resource="memory", job="kube-state-metrics"})\n  > 1.5',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeQuotaAlmostFull',
                annotations: {
                  description: 'Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubequotaalmostfull',
                  summary:     'Namespace quota is going to be full.'
                },
                expr:   'kube_resourcequota{job="kube-state-metrics", type="used"}\n  / ignoring(instance, job, type)\n(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)\n  > 0.9 < 1',
                for:    '15m',
                labels: { severity: 'info' }
              },
              {
                alert:       'KubeQuotaFullyUsed',
                annotations: {
                  description: 'Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubequotafullyused',
                  summary:     'Namespace quota is fully used.'
                },
                expr:   'kube_resourcequota{job="kube-state-metrics", type="used"}\n  / ignoring(instance, job, type)\n(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)\n  == 1',
                for:    '15m',
                labels: { severity: 'info' }
              },
              {
                alert:       'KubeQuotaExceeded',
                annotations: {
                  description: 'Namespace {{ $labels.namespace }} is using {{ $value | humanizePercentage }} of its {{ $labels.resource }} quota.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubequotaexceeded',
                  summary:     'Namespace quota has exceeded the limits.'
                },
                expr:   'kube_resourcequota{job="kube-state-metrics", type="used"}\n  / ignoring(instance, job, type)\n(kube_resourcequota{job="kube-state-metrics", type="hard"} > 0)\n  > 1',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'CPUThrottlingHigh',
                annotations: {
                  description: '{{ $value | humanizePercentage }} throttling of CPU in namespace {{ $labels.namespace }} for container {{ $labels.container }} in pod {{ $labels.pod }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/cputhrottlinghigh',
                  summary:     'Processes experience elevated CPU throttling.'
                },
                expr:   'sum(increase(container_cpu_cfs_throttled_periods_total{container!="", }[5m])) by (container, pod, namespace)\n  /\nsum(increase(container_cpu_cfs_periods_total{}[5m])) by (container, pod, namespace)\n  > ( 25 / 100 )',
                for:    '15m',
                labels: { severity: 'info' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-storage',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-storage',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-storage',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-storage',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-storage'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-storage',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                               {},
                  'k:{"name":"kubernetes-storage"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-storage',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '159f3ab9-df1f-4c19-ab30-d43396d4304e'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-storage',
            rules: [
              {
                alert:       'KubePersistentVolumeFillingUp',
                annotations: {
                  description: 'The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is only {{ $value | humanizePercentage }} free.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubepersistentvolumefillingup',
                  summary:     'PersistentVolume is filling up.'
                },
                expr:   'kubelet_volume_stats_available_bytes{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n  /\nkubelet_volume_stats_capacity_bytes{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n  < 0.03\nand\nkubelet_volume_stats_used_bytes{job="kubelet", namespace=~".*", metrics_path="/metrics"} > 0\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1',
                for:    '1m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubePersistentVolumeFillingUp',
                annotations: {
                  description: 'Based on recent sampling, the PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is expected to fill up within four days. Currently {{ $value | humanizePercentage }} is available.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubepersistentvolumefillingup',
                  summary:     'PersistentVolume is filling up.'
                },
                expr:   '(\n  kubelet_volume_stats_available_bytes{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n    /\n  kubelet_volume_stats_capacity_bytes{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n) < 0.15\nand\nkubelet_volume_stats_used_bytes{job="kubelet", namespace=~".*", metrics_path="/metrics"} > 0\nand\npredict_linear(kubelet_volume_stats_available_bytes{job="kubelet", namespace=~".*", metrics_path="/metrics"}[6h], 4 * 24 * 3600) < 0\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubePersistentVolumeInodesFillingUp',
                annotations: {
                  description: 'The PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} only has {{ $value | humanizePercentage }} free inodes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubepersistentvolumeinodesfillingup',
                  summary:     'PersistentVolumeInodes are filling up.'
                },
                expr:   '(\n  kubelet_volume_stats_inodes_free{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n    /\n  kubelet_volume_stats_inodes{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n) < 0.03\nand\nkubelet_volume_stats_inodes_used{job="kubelet", namespace=~".*", metrics_path="/metrics"} > 0\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1',
                for:    '1m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubePersistentVolumeInodesFillingUp',
                annotations: {
                  description: 'Based on recent sampling, the PersistentVolume claimed by {{ $labels.persistentvolumeclaim }} in Namespace {{ $labels.namespace }} is expected to run out of inodes within four days. Currently {{ $value | humanizePercentage }} of its inodes are free.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubepersistentvolumeinodesfillingup',
                  summary:     'PersistentVolumeInodes are filling up.'
                },
                expr:   '(\n  kubelet_volume_stats_inodes_free{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n    /\n  kubelet_volume_stats_inodes{job="kubelet", namespace=~".*", metrics_path="/metrics"}\n) < 0.15\nand\nkubelet_volume_stats_inodes_used{job="kubelet", namespace=~".*", metrics_path="/metrics"} > 0\nand\npredict_linear(kubelet_volume_stats_inodes_free{job="kubelet", namespace=~".*", metrics_path="/metrics"}[6h], 4 * 24 * 3600) < 0\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_access_mode{ access_mode="ReadOnlyMany"} == 1\nunless on(namespace, persistentvolumeclaim)\nkube_persistentvolumeclaim_labels{label_excluded_from_alerts="true"} == 1',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubePersistentVolumeErrors',
                annotations: {
                  description: 'The persistent volume {{ $labels.persistentvolume }} has status {{ $labels.phase }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubepersistentvolumeerrors',
                  summary:     'PersistentVolume is having issues with provisioning.'
                },
                expr:   'kube_persistentvolume_status_phase{phase=~"Failed|Pending",job="kube-state-metrics"} > 0',
                for:    '5m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-system',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-system'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-system',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                              {},
                  'k:{"name":"kubernetes-system"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-system',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '16bd6c8b-4701-42b8-afc8-b13a8f23764e'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-system',
            rules: [
              {
                alert:       'KubeVersionMismatch',
                annotations: {
                  description: 'There are {{ $value }} different semantic versions of Kubernetes components running.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeversionmismatch',
                  summary:     'Different semantic versions of Kubernetes components running.'
                },
                expr:   'count by (cluster) (count by (git_version, cluster) (label_replace(kubernetes_build_info{job!~"kube-dns|coredns"},"git_version","$1","git_version","(v[0-9]*.[0-9]*).*"))) > 1',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeClientErrors',
                annotations: {
                  description: "Kubernetes API server client '{{ $labels.job }}/{{ $labels.instance }}' is experiencing {{ $value | humanizePercentage }} errors.'",
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeclienterrors',
                  summary:     'Kubernetes API server client is experiencing errors.'
                },
                expr:   '(sum(rate(rest_client_requests_total{job="apiserver",code=~"5.."}[5m])) by (cluster, instance, job, namespace)\n  /\nsum(rate(rest_client_requests_total{job="apiserver"}[5m])) by (cluster, instance, job, namespace))\n> 0.01',
                for:    '15m',
                labels: { severity: 'warning' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-system-apiserver',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-apiserver',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-apiserver',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-apiserver',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-system-apiserver'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-system-apiserver',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                        {},
                  'k:{"name":"kubernetes-system-apiserver"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-system-apiserver',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'a95f8b53-a751-4264-a923-091ef0ff92a6'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-system-apiserver',
            rules: [
              {
                alert:       'KubeClientCertificateExpiration',
                annotations: {
                  description: 'A client certificate used to authenticate to kubernetes apiserver is expiring in less than 7.0 days.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeclientcertificateexpiration',
                  summary:     'Client certificate is about to expire.'
                },
                expr:   'apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 604800',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeClientCertificateExpiration',
                annotations: {
                  description: 'A client certificate used to authenticate to kubernetes apiserver is expiring in less than 24.0 hours.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeclientcertificateexpiration',
                  summary:     'Client certificate is about to expire.'
                },
                expr:   'apiserver_client_certificate_expiration_seconds_count{job="apiserver"} > 0 and on(job) histogram_quantile(0.01, sum by (job, le) (rate(apiserver_client_certificate_expiration_seconds_bucket{job="apiserver"}[5m]))) < 86400',
                for:    '5m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubeAggregatedAPIErrors',
                annotations: {
                  description: 'Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has reported errors. It has appeared unavailable {{ $value | humanize }} times averaged over the past 10m.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeaggregatedapierrors',
                  summary:     'Kubernetes aggregated API has reported errors.'
                },
                expr:   'sum by(name, namespace, cluster)(increase(aggregator_unavailable_apiservice_total[10m])) > 4',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeAggregatedAPIDown',
                annotations: {
                  description: 'Kubernetes aggregated API {{ $labels.name }}/{{ $labels.namespace }} has been only {{ $value | humanize }}% available over the last 10m.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeaggregatedapidown',
                  summary:     'Kubernetes aggregated API is down.'
                },
                expr:   '(1 - max by(name, namespace, cluster)(avg_over_time(aggregator_unavailable_apiservice[10m]))) * 100 < 85',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeAPIDown',
                annotations: {
                  description: 'KubeAPI has disappeared from Prometheus target discovery.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeapidown',
                  summary:     'Target disappeared from Prometheus target discovery.'
                },
                expr:   'absent(up{job="apiserver"} == 1)',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubeAPITerminatedRequests',
                annotations: {
                  description: 'The kubernetes apiserver has terminated {{ $value | humanizePercentage }} of its incoming requests.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeapiterminatedrequests',
                  summary:     'The kubernetes apiserver has terminated {{ $value | humanizePercentage }} of its incoming requests.'
                },
                expr:   'sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m]))  / (  sum(rate(apiserver_request_total{job="apiserver"}[10m])) + sum(rate(apiserver_request_terminations_total{job="apiserver"}[10m])) ) > 0.20',
                for:    '5m',
                labels: { severity: 'warning' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-system-controller-manager',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-controller-manager',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-controller-manager',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-controller-manager',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-system-controller-manager'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-system-controller-manager',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                                 {},
                  'k:{"name":"kubernetes-system-controller-manager"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-system-controller-manager',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '5ea3327e-85e5-42a3-8635-ee09d9398cf7'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-system-controller-manager',
            rules: [
              {
                alert:       'KubeControllerManagerDown',
                annotations: {
                  description: 'KubeControllerManager has disappeared from Prometheus target discovery.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubecontrollermanagerdown',
                  summary:     'Target disappeared from Prometheus target discovery.'
                },
                expr:   'absent(up{job="kube-controller-manager"} == 1)',
                for:    '15m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-system-kube-proxy',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-kube-proxy',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-kube-proxy',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-kube-proxy',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-system-kube-proxy'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-system-kube-proxy',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                         {},
                  'k:{"name":"kubernetes-system-kube-proxy"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-system-kube-proxy',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'da2ac5b5-81b6-4e68-bc86-8b8ab122a8c9'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-system-kube-proxy',
            rules: [
              {
                alert:       'KubeProxyDown',
                annotations: {
                  description: 'KubeProxy has disappeared from Prometheus target discovery.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeproxydown',
                  summary:     'Target disappeared from Prometheus target discovery.'
                },
                expr:   'absent(up{job="kube-proxy"} == 1)',
                for:    '15m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kubernetes-system-kubelet',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-kubelet',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-kubelet',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-kubernetes-system-kubelet',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-kubernetes-system-kubelet'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-kubernetes-system-kubelet',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                      {},
                  'k:{"name":"kubernetes-system-kubelet"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-kubernetes-system-kubelet',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'a78e4f87-2c8e-412b-a5ea-db64bd0dfe25'
      },
      spec: {
        groups: [
          {
            name:  'kubernetes-system-kubelet',
            rules: [
              {
                alert:       'KubeNodeNotReady',
                annotations: {
                  description: '{{ $labels.node }} has been unready for more than 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubenodenotready',
                  summary:     'Node is not ready.'
                },
                expr:   'kube_node_status_condition{job="kube-state-metrics",condition="Ready",status="true"} == 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeNodeUnreachable',
                annotations: {
                  description: '{{ $labels.node }} is unreachable and some workloads may be rescheduled.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubenodeunreachable',
                  summary:     'Node is unreachable.'
                },
                expr:   '(kube_node_spec_taint{job="kube-state-metrics",key="node.kubernetes.io/unreachable",effect="NoSchedule"} unless ignoring(key,value) kube_node_spec_taint{job="kube-state-metrics",key=~"ToBeDeletedByClusterAutoscaler|cloud.google.com/impending-node-termination|aws-node-termination-handler/spot-itn"}) == 1',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletTooManyPods',
                annotations: {
                  description: "Kubelet '{{ $labels.node }}' is running at {{ $value | humanizePercentage }} of its Pod capacity.",
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubelettoomanypods',
                  summary:     'Kubelet is running at capacity.'
                },
                expr:   'count by(cluster, node) (\n  (kube_pod_status_phase{job="kube-state-metrics",phase="Running"} == 1) * on(instance,pod,namespace,cluster) group_left(node) topk by(instance,pod,namespace,cluster) (1, kube_pod_info{job="kube-state-metrics"})\n)\n/\nmax by(cluster, node) (\n  kube_node_status_capacity{job="kube-state-metrics",resource="pods"} != 1\n) > 0.95',
                for:    '15m',
                labels: { severity: 'info' }
              },
              {
                alert:       'KubeNodeReadinessFlapping',
                annotations: {
                  description: 'The readiness status of node {{ $labels.node }} has changed {{ $value }} times in the last 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubenodereadinessflapping',
                  summary:     'Node readiness status is flapping.'
                },
                expr:   'sum(changes(kube_node_status_condition{job="kube-state-metrics",status="true",condition="Ready"}[15m])) by (cluster, node) > 2',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletPlegDurationHigh',
                annotations: {
                  description: 'The Kubelet Pod Lifecycle Event Generator has a 99th percentile duration of {{ $value }} seconds on node {{ $labels.node }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletplegdurationhigh',
                  summary:     'Kubelet Pod Lifecycle Event Generator is taking too long to relist.'
                },
                expr:   'node_quantile:kubelet_pleg_relist_duration_seconds:histogram_quantile{quantile="0.99"} >= 10',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletPodStartUpLatencyHigh',
                annotations: {
                  description: 'Kubelet Pod startup 99th percentile latency is {{ $value }} seconds on node {{ $labels.node }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletpodstartuplatencyhigh',
                  summary:     'Kubelet Pod startup latency is too high.'
                },
                expr:   'histogram_quantile(0.99, sum(rate(kubelet_pod_worker_duration_seconds_bucket{job="kubelet", metrics_path="/metrics"}[5m])) by (cluster, instance, le)) * on(cluster, instance) group_left(node) kubelet_node_name{job="kubelet", metrics_path="/metrics"} > 60',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletClientCertificateExpiration',
                annotations: {
                  description: 'Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletclientcertificateexpiration',
                  summary:     'Kubelet client certificate is about to expire.'
                },
                expr:   'kubelet_certificate_manager_client_ttl_seconds < 604800',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletClientCertificateExpiration',
                annotations: {
                  description: 'Client certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletclientcertificateexpiration',
                  summary:     'Kubelet client certificate is about to expire.'
                },
                expr:   'kubelet_certificate_manager_client_ttl_seconds < 86400',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubeletServerCertificateExpiration',
                annotations: {
                  description: 'Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletservercertificateexpiration',
                  summary:     'Kubelet server certificate is about to expire.'
                },
                expr:   'kubelet_certificate_manager_server_ttl_seconds < 604800',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletServerCertificateExpiration',
                annotations: {
                  description: 'Server certificate for Kubelet on node {{ $labels.node }} expires in {{ $value | humanizeDuration }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletservercertificateexpiration',
                  summary:     'Kubelet server certificate is about to expire.'
                },
                expr:   'kubelet_certificate_manager_server_ttl_seconds < 86400',
                labels: { severity: 'critical' }
              },
              {
                alert:       'KubeletClientCertificateRenewalErrors',
                annotations: {
                  description: 'Kubelet on node {{ $labels.node }} has failed to renew its client certificate ({{ $value | humanize }} errors in the last 5 minutes).',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletclientcertificaterenewalerrors',
                  summary:     'Kubelet has failed to renew its client certificate.'
                },
                expr:   'increase(kubelet_certificate_manager_client_expiration_renew_errors[5m]) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletServerCertificateRenewalErrors',
                annotations: {
                  description: 'Kubelet on node {{ $labels.node }} has failed to renew its server certificate ({{ $value | humanize }} errors in the last 5 minutes).',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletservercertificaterenewalerrors',
                  summary:     'Kubelet has failed to renew its server certificate.'
                },
                expr:   'increase(kubelet_server_expiration_renew_errors[5m]) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'KubeletDown',
                annotations: {
                  description: 'Kubelet has disappeared from Prometheus target discovery.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/kubernetes/kubeletdown',
                  summary:     'Target disappeared from Prometheus target discovery.'
                },
                expr:   'absent(up{job="kubelet", metrics_path="/metrics"} == 1)',
                for:    '15m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-node-exporter',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-exporter',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-exporter',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-exporter',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-node-exporter'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-node-exporter',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                          {},
                  'k:{"name":"node-exporter"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-node-exporter',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'c8e3b9ae-6f19-4d38-8526-a5e09d7a5185'
      },
      spec: {
        groups: [
          {
            name:  'node-exporter',
            rules: [
              {
                alert:       'NodeFilesystemSpaceFillingUp',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemspacefillingup',
                  summary:     'Filesystem is predicted to run out of space within the next 24 hours.'
                },
                expr:   '(\n  node_filesystem_avail_bytes{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 15\nand\n  predict_linear(node_filesystem_avail_bytes{job="node-exporter",fstype!="",mountpoint!=""}[6h], 24*60*60) < 0\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeFilesystemSpaceFillingUp',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left and is filling up fast.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemspacefillingup',
                  summary:     'Filesystem is predicted to run out of space within the next 4 hours.'
                },
                expr:   '(\n  node_filesystem_avail_bytes{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 10\nand\n  predict_linear(node_filesystem_avail_bytes{job="node-exporter",fstype!="",mountpoint!=""}[6h], 4*60*60) < 0\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '1h',
                labels: { severity: 'critical' }
              },
              {
                alert:       'NodeFilesystemAlmostOutOfSpace',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemalmostoutofspace',
                  summary:     'Filesystem has less than 5% space left.'
                },
                expr:   '(\n  node_filesystem_avail_bytes{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 5\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '30m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeFilesystemAlmostOutOfSpace',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available space left.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemalmostoutofspace',
                  summary:     'Filesystem has less than 3% space left.'
                },
                expr:   '(\n  node_filesystem_avail_bytes{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_size_bytes{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 3\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '30m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'NodeFilesystemFilesFillingUp',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemfilesfillingup',
                  summary:     'Filesystem is predicted to run out of inodes within the next 24 hours.'
                },
                expr:   '(\n  node_filesystem_files_free{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_files{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 40\nand\n  predict_linear(node_filesystem_files_free{job="node-exporter",fstype!="",mountpoint!=""}[6h], 24*60*60) < 0\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeFilesystemFilesFillingUp',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left and is filling up fast.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemfilesfillingup',
                  summary:     'Filesystem is predicted to run out of inodes within the next 4 hours.'
                },
                expr:   '(\n  node_filesystem_files_free{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_files{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 20\nand\n  predict_linear(node_filesystem_files_free{job="node-exporter",fstype!="",mountpoint!=""}[6h], 4*60*60) < 0\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '1h',
                labels: { severity: 'critical' }
              },
              {
                alert:       'NodeFilesystemAlmostOutOfFiles',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemalmostoutoffiles',
                  summary:     'Filesystem has less than 5% inodes left.'
                },
                expr:   '(\n  node_filesystem_files_free{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_files{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 5\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeFilesystemAlmostOutOfFiles',
                annotations: {
                  description: 'Filesystem on {{ $labels.device }} at {{ $labels.instance }} has only {{ printf "%.2f" $value }}% available inodes left.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefilesystemalmostoutoffiles',
                  summary:     'Filesystem has less than 3% inodes left.'
                },
                expr:   '(\n  node_filesystem_files_free{job="node-exporter",fstype!="",mountpoint!=""} / node_filesystem_files{job="node-exporter",fstype!="",mountpoint!=""} * 100 < 3\nand\n  node_filesystem_readonly{job="node-exporter",fstype!="",mountpoint!=""} == 0\n)',
                for:    '1h',
                labels: { severity: 'critical' }
              },
              {
                alert:       'NodeNetworkReceiveErrs',
                annotations: {
                  description: '{{ $labels.instance }} interface {{ $labels.device }} has encountered {{ printf "%.0f" $value }} receive errors in the last two minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodenetworkreceiveerrs',
                  summary:     'Network interface is reporting many receive errors.'
                },
                expr:   'rate(node_network_receive_errs_total[2m]) / rate(node_network_receive_packets_total[2m]) > 0.01',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeNetworkTransmitErrs',
                annotations: {
                  description: '{{ $labels.instance }} interface {{ $labels.device }} has encountered {{ printf "%.0f" $value }} transmit errors in the last two minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodenetworktransmiterrs',
                  summary:     'Network interface is reporting many transmit errors.'
                },
                expr:   'rate(node_network_transmit_errs_total[2m]) / rate(node_network_transmit_packets_total[2m]) > 0.01',
                for:    '1h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeHighNumberConntrackEntriesUsed',
                annotations: {
                  description: '{{ $value | humanizePercentage }} of conntrack entries are used.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodehighnumberconntrackentriesused',
                  summary:     'Number of conntrack are getting close to the limit.'
                },
                expr:   '(node_nf_conntrack_entries / node_nf_conntrack_entries_limit) > 0.75',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeTextFileCollectorScrapeError',
                annotations: {
                  description: 'Node Exporter text file collector failed to scrape.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodetextfilecollectorscrapeerror',
                  summary:     'Node Exporter text file collector failed to scrape.'
                },
                expr:   'node_textfile_scrape_error{job="node-exporter"} == 1',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeClockSkewDetected',
                annotations: {
                  description: 'Clock on {{ $labels.instance }} is out of sync by more than 0.05s. Ensure NTP is configured correctly on this host.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodeclockskewdetected',
                  summary:     'Clock skew detected.'
                },
                expr:   '(\n  node_timex_offset_seconds{job="node-exporter"} > 0.05\nand\n  deriv(node_timex_offset_seconds{job="node-exporter"}[5m]) >= 0\n)\nor\n(\n  node_timex_offset_seconds{job="node-exporter"} < -0.05\nand\n  deriv(node_timex_offset_seconds{job="node-exporter"}[5m]) <= 0\n)',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeClockNotSynchronising',
                annotations: {
                  description: 'Clock on {{ $labels.instance }} is not synchronising. Ensure NTP is configured on this host.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodeclocknotsynchronising',
                  summary:     'Clock not synchronising.'
                },
                expr:   'min_over_time(node_timex_sync_status{job="node-exporter"}[5m]) == 0\nand\nnode_timex_maxerror_seconds{job="node-exporter"} >= 16',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeRAIDDegraded',
                annotations: {
                  description: "RAID array '{{ $labels.device }}' on {{ $labels.instance }} is in degraded state due to one or more disks failures. Number of spare drives is insufficient to fix issue automatically.",
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/noderaiddegraded',
                  summary:     'RAID Array is degraded'
                },
                expr:   'node_md_disks_required{job="node-exporter",device=~"(/dev/)?(mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|md.+|dasd.+)"} - ignoring (state) (node_md_disks{state="active",job="node-exporter",device=~"(/dev/)?(mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|md.+|dasd.+)"}) > 0',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'NodeRAIDDiskFailure',
                annotations: {
                  description: "At least one device in RAID array on {{ $labels.instance }} failed. Array '{{ $labels.device }}' needs attention and possibly a disk swap.",
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/noderaiddiskfailure',
                  summary:     'Failed device in RAID array'
                },
                expr:   'node_md_disks{state="failed",job="node-exporter",device=~"(/dev/)?(mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|md.+|dasd.+)"} > 0',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeFileDescriptorLimit',
                annotations: {
                  description: 'File descriptors limit at {{ $labels.instance }} is currently at {{ printf "%.2f" $value }}%.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefiledescriptorlimit',
                  summary:     'Kernel is predicted to exhaust file descriptors limit soon.'
                },
                expr:   '(\n  node_filefd_allocated{job="node-exporter"} * 100 / node_filefd_maximum{job="node-exporter"} > 70\n)',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'NodeFileDescriptorLimit',
                annotations: {
                  description: 'File descriptors limit at {{ $labels.instance }} is currently at {{ printf "%.2f" $value }}%.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/node/nodefiledescriptorlimit',
                  summary:     'Kernel is predicted to exhaust file descriptors limit soon.'
                },
                expr:   '(\n  node_filefd_allocated{job="node-exporter"} * 100 / node_filefd_maximum{job="node-exporter"} > 90\n)',
                for:    '15m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-node-exporter.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-exporter.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-exporter.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-exporter.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-node-exporter.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-node-exporter.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                {},
                  'k:{"name":"node-exporter.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-node-exporter.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '94f940c7-3dd0-454b-939e-7d499465783e'
      },
      spec: {
        groups: [
          {
            name:  'node-exporter.rules',
            rules: [
              {
                expr:   'count without (cpu, mode) (\n  node_cpu_seconds_total{job="node-exporter",mode="idle"}\n)',
                record: 'instance:node_num_cpu:sum'
              },
              {
                expr:   '1 - avg without (cpu) (\n  sum without (mode) (rate(node_cpu_seconds_total{job="node-exporter", mode=~"idle|iowait|steal"}[5m]))\n)',
                record: 'instance:node_cpu_utilisation:rate5m'
              },
              {
                expr:   '(\n  node_load1{job="node-exporter"}\n/\n  instance:node_num_cpu:sum{job="node-exporter"}\n)',
                record: 'instance:node_load1_per_cpu:ratio'
              },
              {
                expr:   '1 - (\n  (\n    node_memory_MemAvailable_bytes{job="node-exporter"}\n    or\n    (\n      node_memory_Buffers_bytes{job="node-exporter"}\n      +\n      node_memory_Cached_bytes{job="node-exporter"}\n      +\n      node_memory_MemFree_bytes{job="node-exporter"}\n      +\n      node_memory_Slab_bytes{job="node-exporter"}\n    )\n  )\n/\n  node_memory_MemTotal_bytes{job="node-exporter"}\n)',
                record: 'instance:node_memory_utilisation:ratio'
              },
              {
                expr:   'rate(node_vmstat_pgmajfault{job="node-exporter"}[5m])',
                record: 'instance:node_vmstat_pgmajfault:rate5m'
              },
              {
                expr:   'rate(node_disk_io_time_seconds_total{job="node-exporter", device=~"(/dev/)?(mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|md.+|dasd.+)"}[5m])',
                record: 'instance_device:node_disk_io_time_seconds:rate5m'
              },
              {
                expr:   'rate(node_disk_io_time_weighted_seconds_total{job="node-exporter", device=~"(/dev/)?(mmcblk.p.+|nvme.+|rbd.+|sd.+|vd.+|xvd.+|dm-.+|md.+|dasd.+)"}[5m])',
                record: 'instance_device:node_disk_io_time_weighted_seconds:rate5m'
              },
              {
                expr:   'sum without (device) (\n  rate(node_network_receive_bytes_total{job="node-exporter", device!="lo"}[5m])\n)',
                record: 'instance:node_network_receive_bytes_excluding_lo:rate5m'
              },
              {
                expr:   'sum without (device) (\n  rate(node_network_transmit_bytes_total{job="node-exporter", device!="lo"}[5m])\n)',
                record: 'instance:node_network_transmit_bytes_excluding_lo:rate5m'
              },
              {
                expr:   'sum without (device) (\n  rate(node_network_receive_drop_total{job="node-exporter", device!="lo"}[5m])\n)',
                record: 'instance:node_network_receive_drop_excluding_lo:rate5m'
              },
              {
                expr:   'sum without (device) (\n  rate(node_network_transmit_drop_total{job="node-exporter", device!="lo"}[5m])\n)',
                record: 'instance:node_network_transmit_drop_excluding_lo:rate5m'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-node-network',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-network',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-network',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node-network',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-node-network'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-node-network',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                         {},
                  'k:{"name":"node-network"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-node-network',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '516f1f9b-c5a4-4b09-83c9-e3b15e7d9318'
      },
      spec: {
        groups: [
          {
            name:  'node-network',
            rules: [
              {
                alert:       'NodeNetworkInterfaceFlapping',
                annotations: {
                  description: 'Network interface "{{ $labels.device }}" changing its up status often on node-exporter {{ $labels.namespace }}/{{ $labels.pod }}',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/general/nodenetworkinterfaceflapping',
                  summary:     'Network interface is often changing its status'
                },
                expr:   'changes(node_network_up{job="node-exporter",device!~"veth.+"}[2m]) > 2',
                for:    '2m',
                labels: { severity: 'warning' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-node.rules',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node.rules',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node.rules',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-node.rules',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-node.rules'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-node.rules',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                       {},
                  'k:{"name":"node.rules"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-node.rules',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'ac53451e-e568-4dba-8b26-8d83f8897e00'
      },
      spec: {
        groups: [
          {
            name:  'node.rules',
            rules: [
              {
                expr:   'topk by(cluster, namespace, pod) (1,\n  max by (cluster, node, namespace, pod) (\n    label_replace(kube_pod_info{job="kube-state-metrics",node!=""}, "pod", "$1", "pod", "(.*)")\n))',
                record: 'node_namespace_pod:kube_pod_info:'
              },
              {
                expr:   'count by (cluster, node) (\n  node_cpu_seconds_total{mode="idle",job="node-exporter"}\n  * on (namespace, pod) group_left(node)\n  topk by(namespace, pod) (1, node_namespace_pod:kube_pod_info:)\n)',
                record: 'node:node_num_cpu:sum'
              },
              {
                expr:   'sum(\n  node_memory_MemAvailable_bytes{job="node-exporter"} or\n  (\n    node_memory_Buffers_bytes{job="node-exporter"} +\n    node_memory_Cached_bytes{job="node-exporter"} +\n    node_memory_MemFree_bytes{job="node-exporter"} +\n    node_memory_Slab_bytes{job="node-exporter"}\n  )\n) by (cluster)',
                record: ':node_memory_MemAvailable_bytes:sum'
              },
              {
                expr:   'avg by (cluster, node) (\n  sum without (mode) (\n    rate(node_cpu_seconds_total{mode!="idle",mode!="iowait",mode!="steal",job="node-exporter"}[5m])\n  )\n)',
                record: 'node:node_cpu_utilization:ratio_rate5m'
              },
              {
                expr:   'avg by (cluster) (\n  node:node_cpu_utilization:ratio_rate5m\n)',
                record: 'cluster:node_cpu:ratio_rate5m'
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-prometheus',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-prometheus',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-prometheus',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-prometheus',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-prometheus'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-prometheus',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                       {},
                  'k:{"name":"prometheus"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-prometheus',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '5c3a792c-d3e0-41ce-8c70-8a92b55f26e4'
      },
      spec: {
        groups: [
          {
            name:  'prometheus',
            rules: [
              {
                alert:       'PrometheusBadConfig',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to reload its configuration.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusbadconfig',
                  summary:     'Failed Prometheus configuration reload.'
                },
                expr:   '# Without max_over_time, failed scrapes could create false negatives, see\n# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.\nmax_over_time(prometheus_config_last_reload_successful{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) == 0',
                for:    '10m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'PrometheusNotificationQueueRunningFull',
                annotations: {
                  description: 'Alert notification queue of Prometheus {{$labels.namespace}}/{{$labels.pod}} is running full.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusnotificationqueuerunningfull',
                  summary:     'Prometheus alert notification queue predicted to run full in less than 30m.'
                },
                expr:   '# Without min_over_time, failed scrapes could create false negatives, see\n# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.\n(\n  predict_linear(prometheus_notifications_queue_length{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m], 60 * 30)\n>\n  min_over_time(prometheus_notifications_queue_capacity{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m])\n)',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusErrorSendingAlertsToSomeAlertmanagers',
                annotations: {
                  description: '{{ printf "%.1f" $value }}% errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to Alertmanager {{$labels.alertmanager}}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheuserrorsendingalertstosomealertmanagers',
                  summary:     'Prometheus has encountered more than 1% errors sending alerts to a specific Alertmanager.'
                },
                expr:   '(\n  rate(prometheus_notifications_errors_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m])\n/\n  rate(prometheus_notifications_sent_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m])\n)\n* 100\n> 1',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusNotConnectedToAlertmanagers',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} is not connected to any Alertmanagers.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusnotconnectedtoalertmanagers',
                  summary:     'Prometheus is not connected to any Alertmanagers.'
                },
                expr:   '# Without max_over_time, failed scrapes could create false negatives, see\n# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.\nmax_over_time(prometheus_notifications_alertmanagers_discovered{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) < 1',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusTSDBReloadsFailing',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} reload failures over the last 3h.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheustsdbreloadsfailing',
                  summary:     'Prometheus has issues reloading blocks from disk.'
                },
                expr:   'increase(prometheus_tsdb_reloads_failures_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[3h]) > 0',
                for:    '4h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusTSDBCompactionsFailing',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has detected {{$value | humanize}} compaction failures over the last 3h.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheustsdbcompactionsfailing',
                  summary:     'Prometheus has issues compacting blocks.'
                },
                expr:   'increase(prometheus_tsdb_compactions_failed_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[3h]) > 0',
                for:    '4h',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusNotIngestingSamples',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} is not ingesting samples.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusnotingestingsamples',
                  summary:     'Prometheus is not ingesting samples.'
                },
                expr:   '(\n  rate(prometheus_tsdb_head_samples_appended_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) <= 0\nand\n  (\n    sum without(scrape_job) (prometheus_target_metadata_cache_entries{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}) > 0\n  or\n    sum without(rule_group) (prometheus_rule_group_rules{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}) > 0\n  )\n)',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusDuplicateTimestamps',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value  }} samples/s with different values but duplicated timestamp.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusduplicatetimestamps',
                  summary:     'Prometheus is dropping samples with duplicate timestamps.'
                },
                expr:   'rate(prometheus_target_scrapes_sample_duplicate_timestamp_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusOutOfOrderTimestamps',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} is dropping {{ printf "%.4g" $value  }} samples/s with timestamps arriving out of order.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusoutofordertimestamps',
                  summary:     'Prometheus drops samples with out-of-order timestamps.'
                },
                expr:   'rate(prometheus_target_scrapes_sample_out_of_order_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusRemoteStorageFailures',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} failed to send {{ printf "%.1f" $value }}% of the samples to {{ $labels.remote_name}}:{{ $labels.url }}',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusremotestoragefailures',
                  summary:     'Prometheus fails to send samples to remote storage.'
                },
                expr:   '(\n  (rate(prometheus_remote_storage_failed_samples_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]))\n/\n  (\n    (rate(prometheus_remote_storage_failed_samples_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) or rate(prometheus_remote_storage_samples_failed_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]))\n  +\n    (rate(prometheus_remote_storage_succeeded_samples_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) or rate(prometheus_remote_storage_samples_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]))\n  )\n)\n* 100\n> 1',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'PrometheusRemoteWriteBehind',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write is {{ printf "%.1f" $value }}s behind for {{ $labels.remote_name}}:{{ $labels.url }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusremotewritebehind',
                  summary:     'Prometheus remote write is behind.'
                },
                expr:   '# Without max_over_time, failed scrapes could create false negatives, see\n# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.\n(\n  max_over_time(prometheus_remote_storage_highest_timestamp_in_seconds{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m])\n- ignoring(remote_name, url) group_right\n  max_over_time(prometheus_remote_storage_queue_highest_sent_timestamp_seconds{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m])\n)\n> 120',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'PrometheusRemoteWriteDesiredShards',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} remote write desired shards calculation wants to run {{ $value }} shards for queue {{ $labels.remote_name}}:{{ $labels.url }}, which is more than the max of {{ printf `prometheus_remote_storage_shards_max{instance="%s",job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}` $labels.instance | query | first | value }}.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusremotewritedesiredshards',
                  summary:     'Prometheus remote write desired shards calculation wants to run more than configured max shards.'
                },
                expr:   '# Without max_over_time, failed scrapes could create false negatives, see\n# https://www.robustperception.io/alerting-on-gauges-in-prometheus-2-0 for details.\n(\n  max_over_time(prometheus_remote_storage_shards_desired{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m])\n>\n  max_over_time(prometheus_remote_storage_shards_max{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m])\n)',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusRuleFailures',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed to evaluate {{ printf "%.0f" $value }} rules in the last 5m.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusrulefailures',
                  summary:     'Prometheus is failing rule evaluations.'
                },
                expr:   'increase(prometheus_rule_evaluation_failures_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '15m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'PrometheusMissingRuleEvaluations',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has missed {{ printf "%.0f" $value }} rule group evaluations in the last 5m.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusmissingruleevaluations',
                  summary:     'Prometheus is missing rule evaluations due to slow rule group evaluation.'
                },
                expr:   'increase(prometheus_rule_group_iterations_missed_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusTargetLimitHit',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because the number of targets exceeded the configured target_limit.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheustargetlimithit',
                  summary:     'Prometheus has dropped targets because some scrape configs have exceeded the targets limit.'
                },
                expr:   'increase(prometheus_target_scrape_pool_exceeded_target_limit_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusLabelLimitHit',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has dropped {{ printf "%.0f" $value }} targets because some samples exceeded the configured label_limit, label_name_length_limit or label_value_length_limit.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheuslabellimithit',
                  summary:     'Prometheus has dropped targets because some scrape configs have exceeded the labels limit.'
                },
                expr:   'increase(prometheus_target_scrape_pool_exceeded_label_limits_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusScrapeBodySizeLimitHit',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured body_size_limit.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusscrapebodysizelimithit',
                  summary:     'Prometheus has dropped some targets that exceeded body size limit.'
                },
                expr:   'increase(prometheus_target_scrapes_exceeded_body_size_limit_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusScrapeSampleLimitHit',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} has failed {{ printf "%.0f" $value }} scrapes in the last 5m because some targets exceeded the configured sample_limit.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheusscrapesamplelimithit',
                  summary:     'Prometheus has failed scrapes that have exceeded the configured sample limit.'
                },
                expr:   'increase(prometheus_target_scrapes_exceeded_sample_limit_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusTargetSyncFailure',
                annotations: {
                  description: '{{ printf "%.0f" $value }} targets in Prometheus {{$labels.namespace}}/{{$labels.pod}} have failed to sync because invalid configuration was supplied.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheustargetsyncfailure',
                  summary:     'Prometheus has failed to sync targets.'
                },
                expr:   'increase(prometheus_target_sync_failed_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[30m]) > 0',
                for:    '5m',
                labels: { severity: 'critical' }
              },
              {
                alert:       'PrometheusHighQueryLoad',
                annotations: {
                  description: 'Prometheus {{$labels.namespace}}/{{$labels.pod}} query API has less than 20% available capacity in its query engine for the last 15 minutes.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheushighqueryload',
                  summary:     'Prometheus is reaching its maximum capacity serving concurrent requests.'
                },
                expr:   'avg_over_time(prometheus_engine_queries{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) / max_over_time(prometheus_engine_queries_concurrent_max{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system"}[5m]) > 0.8',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusErrorSendingAlertsToAnyAlertmanager',
                annotations: {
                  description: '{{ printf "%.1f" $value }}% minimum errors while sending alerts from Prometheus {{$labels.namespace}}/{{$labels.pod}} to any Alertmanager.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus/prometheuserrorsendingalertstoanyalertmanager',
                  summary:     'Prometheus encounters more than 3% errors sending alerts to any Alertmanager.'
                },
                expr:   'min without (alertmanager) (\n  rate(prometheus_notifications_errors_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system",alertmanager!~``}[5m])\n/\n  rate(prometheus_notifications_sent_total{job="rancher-monitoring-prometheus",namespace="cattle-monitoring-system",alertmanager!~``}[5m])\n)\n* 100\n> 3',
                for:    '15m',
                labels: { severity: 'critical' }
              }
            ]
          }
        ]
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-prometheus-operator',
      type:  'monitoring.coreos.com.prometheusrule',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-prometheus-operator',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-prometheus-operator',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules/cattle-monitoring-system/rancher-monitoring-prometheus-operator',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheusrules/rancher-monitoring-prometheus-operator'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'PrometheusRule',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-prometheus-operator',
          '17m'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':        {},
                'f:groups': {
                  '.':                                {},
                  'k:{"name":"prometheus-operator"}': {
                    '.':       {},
                    'f:name':  {},
                    'f:rules': {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          }
        ],
        name:          'rancher-monitoring-prometheus-operator',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: 'e8675c68-a259-4e5f-a30c-90128b272697'
      },
      spec: {
        groups: [
          {
            name:  'prometheus-operator',
            rules: [
              {
                alert:       'PrometheusOperatorListErrors',
                annotations: {
                  description: 'Errors while performing List operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/prometheusoperatorlisterrors',
                  summary:     'Errors while performing list operations in controller.'
                },
                expr:   '(sum by (controller,namespace,cluster) (rate(prometheus_operator_list_operations_failed_total{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[10m])) / sum by (controller,namespace,cluster) (rate(prometheus_operator_list_operations_total{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[10m]))) > 0.4',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusOperatorWatchErrors',
                annotations: {
                  description: 'Errors while performing watch operations in controller {{$labels.controller}} in {{$labels.namespace}} namespace.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/prometheusoperatorwatcherrors',
                  summary:     'Errors while performing watch operations in controller.'
                },
                expr:   '(sum by (controller,namespace,cluster) (rate(prometheus_operator_watch_operations_failed_total{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m])) / sum by (controller,namespace,cluster) (rate(prometheus_operator_watch_operations_total{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m]))) > 0.4',
                for:    '15m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusOperatorSyncFailed',
                annotations: {
                  description: 'Controller {{ $labels.controller }} in {{ $labels.namespace }} namespace fails to reconcile {{ $value }} objects.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/prometheusoperatorsyncfailed',
                  summary:     'Last controller reconciliation failed'
                },
                expr:   'min_over_time(prometheus_operator_syncs{status="failed",job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusOperatorReconcileErrors',
                annotations: {
                  description: '{{ $value | humanizePercentage }} of reconciling operations failed for {{ $labels.controller }} controller in {{ $labels.namespace }} namespace.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/prometheusoperatorreconcileerrors',
                  summary:     'Errors while reconciling controller.'
                },
                expr:   '(sum by (controller,namespace,cluster) (rate(prometheus_operator_reconcile_errors_total{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m]))) / (sum by (controller,namespace,cluster) (rate(prometheus_operator_reconcile_operations_total{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m]))) > 0.1',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusOperatorNodeLookupErrors',
                annotations: {
                  description: 'Errors while reconciling Prometheus in {{ $labels.namespace }} Namespace.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/prometheusoperatornodelookuperrors',
                  summary:     'Errors while reconciling Prometheus.'
                },
                expr:   'rate(prometheus_operator_node_address_lookup_errors_total{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m]) > 0.1',
                for:    '10m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusOperatorNotReady',
                annotations: {
                  description: "Prometheus operator in {{ $labels.namespace }} namespace isn't ready to reconcile {{ $labels.controller }} resources.",
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/prometheusoperatornotready',
                  summary:     'Prometheus operator not ready'
                },
                expr:   'min by (controller,namespace,cluster) (max_over_time(prometheus_operator_ready{job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m]) == 0)',
                for:    '5m',
                labels: { severity: 'warning' }
              },
              {
                alert:       'PrometheusOperatorRejectedResources',
                annotations: {
                  description: 'Prometheus operator in {{ $labels.namespace }} namespace rejected {{ printf "%0.0f" $value }} {{ $labels.controller }}/{{ $labels.resource }} resources.',
                  runbook_url: 'https://runbooks.prometheus-operator.dev/runbooks/prometheus-operator/prometheusoperatorrejectedresources',
                  summary:     'Resources rejected by Prometheus operator'
                },
                expr:   'min_over_time(prometheus_operator_managed_resources{state="rejected",job="rancher-monitoring-operator",namespace="cattle-monitoring-system"}[5m]) > 0',
                for:    '5m',
                labels: { severity: 'warning' }
              }
            ]
          }
        ]
      }
    }
  ]
};

// GET /k8s/clusters/local/v1/monitoring.coreos.com.prometheuses
const prometheusesGet = {
  type:         'collection',
  links:        { self: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses' },
  createTypes:  { 'monitoring.coreos.com.prometheus': 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses' },
  actions:      {},
  resourceType: 'monitoring.coreos.com.prometheus',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [
    {
      id:    'cattle-monitoring-system/rancher-monitoring-prometheus',
      type:  'monitoring.coreos.com.prometheus',
      links: {
        remove: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses/cattle-monitoring-system/rancher-monitoring-prometheus',
        self:   'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses/cattle-monitoring-system/rancher-monitoring-prometheus',
        update: 'https://209.97.184.234.sslip.io/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses/cattle-monitoring-system/rancher-monitoring-prometheus',
        view:   'https://209.97.184.234.sslip.io/k8s/clusters/local/apis/monitoring.coreos.com/v1/namespaces/cattle-monitoring-system/prometheuses/rancher-monitoring-prometheus'
      },
      apiVersion: 'monitoring.coreos.com/v1',
      kind:       'Prometheus',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-monitoring',
          'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
        },
        creationTimestamp: '2024-04-03T09:17:26Z',
        fields:            [
          'rancher-monitoring-prometheus',
          'v2.42.0',
          1,
          1,
          'True',
          'True',
          '18m',
          false
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-prometheus',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '103.0.3_up45.31.1',
          chart:                          'rancher-monitoring-103.0.3_up45.31.1',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                {},
                  'f:meta.helm.sh/release-name':      {},
                  'f:meta.helm.sh/release-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:app':                          {},
                  'f:app.kubernetes.io/instance':   {},
                  'f:app.kubernetes.io/managed-by': {},
                  'f:app.kubernetes.io/part-of':    {},
                  'f:app.kubernetes.io/version':    {},
                  'f:chart':                        {},
                  'f:heritage':                     {},
                  'f:release':                      {}
                }
              },
              'f:spec': {
                '.':          {},
                'f:alerting': {
                  '.':               {},
                  'f:alertmanagers': {}
                },
                'f:containers':         {},
                'f:enableAdminAPI':     {},
                'f:evaluationInterval': {},
                'f:externalUrl':        {},
                'f:hostNetwork':        {},
                'f:image':              {},
                'f:listenLocal':        {},
                'f:logFormat':          {},
                'f:logLevel':           {},
                'f:nodeSelector':       {
                  '.':                  {},
                  'f:kubernetes.io/os': {}
                },
                'f:paused':                      {},
                'f:podMonitorNamespaceSelector': {},
                'f:podMonitorSelector':          {},
                'f:portName':                    {},
                'f:probeNamespaceSelector':      {},
                'f:probeSelector':               {},
                'f:replicas':                    {},
                'f:resources':                   {
                  '.':        {},
                  'f:limits': {
                    '.':        {},
                    'f:cpu':    {},
                    'f:memory': {}
                  },
                  'f:requests': {
                    '.':        {},
                    'f:cpu':    {},
                    'f:memory': {}
                  }
                },
                'f:retention':             {},
                'f:retentionSize':         {},
                'f:routePrefix':           {},
                'f:ruleNamespaceSelector': {},
                'f:ruleSelector':          {},
                'f:scrapeInterval':        {},
                'f:securityContext':       {
                  '.':              {},
                  'f:fsGroup':      {},
                  'f:runAsGroup':   {},
                  'f:runAsNonRoot': {},
                  'f:runAsUser':    {}
                },
                'f:serviceAccountName':              {},
                'f:serviceMonitorNamespaceSelector': {},
                'f:serviceMonitorSelector':          {},
                'f:shards':                          {},
                'f:tolerations':                     {},
                'f:tsdb':                            {
                  '.':                      {},
                  'f:outOfOrderTimeWindow': {}
                },
                'f:version':        {},
                'f:volumes':        {},
                'f:walCompression': {}
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2024-04-03T09:17:26Z'
          },
          {
            apiVersion: 'monitoring.coreos.com/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:status': {
                '.':                   {},
                'f:availableReplicas': {},
                'f:conditions':        {
                  '.':                      {},
                  'k:{"type":"Available"}': {
                    '.':                    {},
                    'f:lastTransitionTime': {},
                    'f:observedGeneration': {},
                    'f:status':             {},
                    'f:type':               {}
                  },
                  'k:{"type":"Reconciled"}': {
                    '.':                    {},
                    'f:lastTransitionTime': {},
                    'f:observedGeneration': {},
                    'f:status':             {},
                    'f:type':               {}
                  }
                },
                'f:paused':        {},
                'f:replicas':      {},
                'f:shardStatuses': {
                  '.':                 {},
                  'k:{"shardID":"0"}': {
                    '.':                     {},
                    'f:availableReplicas':   {},
                    'f:replicas':            {},
                    'f:shardID':             {},
                    'f:unavailableReplicas': {},
                    'f:updatedReplicas':     {}
                  }
                },
                'f:unavailableReplicas': {},
                'f:updatedReplicas':     {}
              }
            },
            manager:     'PrometheusOperator',
            operation:   'Update',
            subresource: 'status',
            time:        '2024-04-03T09:18:08Z'
          }
        ],
        name:          'rancher-monitoring-prometheus',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            toId:    'cattle-monitoring-system/prometheus-rancher-monitoring-prometheus-rulefiles-0',
            toType:  'configmap',
            rel:     'owner',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/prometheus-rancher-monitoring-prometheus',
            toType:  'secret',
            rel:     'owner',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/prometheus-rancher-monitoring-prometheus-tls-assets-0',
            toType:  'secret',
            rel:     'owner',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/prometheus-rancher-monitoring-prometheus-web-config',
            toType:  'secret',
            rel:     'owner',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/prometheus-operated',
            toType:  'service',
            rel:     'owner',
            state:   'active',
            message: 'Service is ready'
          },
          {
            toId:    'cattle-monitoring-system/prometheus-rancher-monitoring-prometheus',
            toType:  'apps.statefulset',
            rel:     'owner',
            state:   'active',
            message: 'All replicas scheduled as expected. Replicas: 1'
          },
          {
            fromId:   'cattle-monitoring-system/rancher-monitoring',
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
        uid: '022ca0e7-b959-4a16-ab68-e9096f6ce3cb'
      },
      spec: {
        alerting: {
          alertmanagers: [
            {
              apiVersion: 'v2',
              name:       'rancher-monitoring-alertmanager',
              namespace:  'cattle-monitoring-system',
              pathPrefix: '/',
              port:       'http-web'
            }
          ]
        },
        containers: [
          {
            args: [
              'nginx',
              '-g',
              'daemon off;',
              '-c',
              '/nginx/nginx.conf'
            ],
            image: 'rancher/mirrored-library-nginx:1.24.0-alpine',
            name:  'prometheus-proxy',
            ports: [
              {
                containerPort: 8081,
                name:          'nginx-http',
                protocol:      'TCP'
              }
            ],
            securityContext: {
              runAsGroup: 101,
              runAsUser:  101
            },
            volumeMounts: [
              {
                mountPath: '/nginx',
                name:      'prometheus-nginx'
              },
              {
                mountPath: '/var/cache/nginx',
                name:      'nginx-home'
              }
            ]
          }
        ],
        enableAdminAPI:              false,
        evaluationInterval:          '1m',
        externalUrl:                 'https://209.97.184.234.sslip.io/k8s/clusters/local/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy',
        hostNetwork:                 false,
        image:                       'docker.io/rancher/mirrored-prometheus-prometheus:v2.42.0',
        listenLocal:                 false,
        logFormat:                   'logfmt',
        logLevel:                    'info',
        nodeSelector:                { 'kubernetes.io/os': 'linux' },
        paused:                      false,
        podMonitorNamespaceSelector: {},
        podMonitorSelector:          {},
        portName:                    'http-web',
        probeNamespaceSelector:      {},
        probeSelector:               { matchLabels: { release: 'rancher-monitoring' } },
        replicas:                    1,
        resources:                   {
          limits: {
            cpu:    '1000m',
            memory: '3000Mi'
          },
          requests: {
            cpu:    '750m',
            memory: '750Mi'
          }
        },
        retention:             '10d',
        retentionSize:         '50GiB',
        routePrefix:           '/',
        ruleNamespaceSelector: {},
        ruleSelector:          {},
        scrapeInterval:        '1m',
        securityContext:       {
          fsGroup:      2000,
          runAsGroup:   2000,
          runAsNonRoot: true,
          runAsUser:    1000
        },
        serviceAccountName:              'rancher-monitoring-prometheus',
        serviceMonitorNamespaceSelector: {},
        serviceMonitorSelector:          {},
        shards:                          1,
        tolerations:                     [
          {
            effect:   'NoSchedule',
            key:      'cattle.io/os',
            operator: 'Equal',
            value:    'linux'
          }
        ],
        tsdb:    { outOfOrderTimeWindow: '0s' },
        version: 'v2.42.0',
        volumes: [
          {
            emptyDir: {},
            name:     'nginx-home'
          },
          {
            configMap: {
              defaultMode: 438,
              name:        'prometheus-nginx-proxy-config'
            },
            name: 'prometheus-nginx'
          }
        ],
        walCompression: true
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2024-04-03T09:18:08Z',
            lastUpdateTime:     '2024-04-03T09:18:08Z',
            observedGeneration: 1,
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2024-04-03T09:18:08Z',
            lastUpdateTime:     '2024-04-03T09:18:08Z',
            observedGeneration: 1,
            status:             'True',
            transitioning:      false,
            type:               'Reconciled'
          }
        ],
        paused:        false,
        replicas:      1,
        shardStatuses: [
          {
            availableReplicas:   1,
            replicas:            1,
            shardID:             '0',
            unavailableReplicas: 0,
            updatedReplicas:     1
          }
        ],
        unavailableReplicas: 0,
        updatedReplicas:     1
      }
    }
  ]
};

const v3Schemas = [
  {
    baseType:       'schema',
    id:             'monitoringConfig',
    links:          { self: 'https://localhost:8005/v3/schemas/monitoringConfig' },
    pluralName:     'monitoringConfigs',
    resourceFields: {
      metricsServerPriorityClassName: {
        create:   true,
        nullable: true,
        type:     'string',
        update:   true
      },
      nodeSelector: {
        create:   true,
        nullable: true,
        type:     'map[string]',
        update:   true
      },
      options: {
        create:   true,
        nullable: true,
        type:     'map[string]',
        update:   true
      },
      provider: {
        create:   true,
        default:  'metrics-server',
        nullable: true,
        type:     'string',
        update:   true
      },
      replicas: {
        create:   true,
        default:  1,
        nullable: true,
        type:     'int',
        update:   true
      },
      tolerations: {
        create:   true,
        nullable: true,
        type:     'array[toleration]',
        update:   true
      },
      updateStrategy: {
        create:   true,
        nullable: true,
        type:     'deploymentStrategy',
        update:   true
      }
    },
    type:    'schema',
    version: {
      group:   'management.cattle.io',
      path:    '/v3',
      version: 'v3'
    }
  }
];

const k8sSchemas = [
  {
    id:    'monitoring.coreos.com.thanosruler',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.thanosrulers',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.thanosruler'
    },
    description:     'ThanosRuler defines a ThanosRuler deployment.',
    pluralName:      'monitoring.coreos.com.thanosrulers',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:  'Replicas',
          field: '.spec.replicas',
          type:  'integer'
        },
        {
          name:  'Age',
          field: '.metadata.creationTimestamp',
          type:  'date'
        },
        {
          name:  'Paused',
          field: '.status.paused',
          type:  'boolean'
        }
      ],
      group:      'monitoring.coreos.com',
      kind:       'ThanosRuler',
      namespaced: true,
      resource:   'thanosrulers',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'monitoring.coreos.com.prometheus',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.prometheus'
    },
    description:     'Prometheus defines a Prometheus deployment.',
    pluralName:      'monitoring.coreos.com.prometheuses',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:  'Version',
          field: '.spec.version',
          type:  'string'
        },
        {
          name:  'Desired',
          field: '.spec.replicas',
          type:  'integer'
        },
        {
          name:  'Ready',
          field: '.status.availableReplicas',
          type:  'integer'
        },
        {
          name:  'Reconciled',
          field: ".status.conditions[?(@.type == 'Reconciled')].status",
          type:  'string'
        },
        {
          name:  'Available',
          field: ".status.conditions[?(@.type == 'Available')].status",
          type:  'string'
        },
        {
          name:  'Age',
          field: '.metadata.creationTimestamp',
          type:  'date'
        },
        {
          name:  'Paused',
          field: '.status.paused',
          type:  'boolean'
        }
      ],
      group:      'monitoring.coreos.com',
      kind:       'Prometheus',
      namespaced: true,
      resource:   'prometheuses',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'monitoring.coreos.com.alertmanagerconfig',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.alertmanagerconfig'
    },
    description:     'AlertmanagerConfig defines a namespaced AlertmanagerConfig to be aggregated across multiple namespaces configuring one Alertmanager cluster.',
    pluralName:      'monitoring.coreos.com.alertmanagerconfigs',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:            'monitoring.coreos.com',
      kind:             'AlertmanagerConfig',
      namespaced:       true,
      preferredVersion: 'v1',
      resource:         'alertmanagerconfigs',
      verbs:            [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1alpha1'
    }
  },
  {
    id:    'monitoring.coreos.com.servicemonitor',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.servicemonitor'
    },
    description:     'ServiceMonitor defines monitoring for a set of services.',
    pluralName:      'monitoring.coreos.com.servicemonitors',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'monitoring.coreos.com',
      kind:       'ServiceMonitor',
      namespaced: true,
      resource:   'servicemonitors',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'monitoring.coreos.com.alertmanager',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagers',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.alertmanager'
    },
    description:     'Alertmanager describes an Alertmanager cluster.',
    pluralName:      'monitoring.coreos.com.alertmanagers',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:  'Version',
          field: '.spec.version',
          type:  'string'
        },
        {
          name:  'Replicas',
          field: '.spec.replicas',
          type:  'integer'
        },
        {
          name:  'Ready',
          field: '.status.availableReplicas',
          type:  'integer'
        },
        {
          name:  'Reconciled',
          field: ".status.conditions[?(@.type == 'Reconciled')].status",
          type:  'string'
        },
        {
          name:  'Available',
          field: ".status.conditions[?(@.type == 'Available')].status",
          type:  'string'
        },
        {
          name:  'Age',
          field: '.metadata.creationTimestamp',
          type:  'date'
        },
        {
          name:  'Paused',
          field: '.status.paused',
          type:  'boolean'
        }
      ],
      group:      'monitoring.coreos.com',
      kind:       'Alertmanager',
      namespaced: true,
      resource:   'alertmanagers',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'monitoring.coreos.com.podmonitor',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.podmonitors',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.podmonitor'
    },
    description:     'PodMonitor defines monitoring for a set of pods.',
    pluralName:      'monitoring.coreos.com.podmonitors',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'monitoring.coreos.com',
      kind:       'PodMonitor',
      namespaced: true,
      resource:   'podmonitors',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'monitoring.coreos.com.probe',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.probes',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.probe'
    },
    description:     'Probe defines monitoring for a set of static targets or ingresses.',
    pluralName:      'monitoring.coreos.com.probes',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'monitoring.coreos.com',
      kind:       'Probe',
      namespaced: true,
      resource:   'probes',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'monitoring.coreos.com.prometheusrule',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/monitoring.coreos.com.prometheusrule'
    },
    description:     'PrometheusRule defines recording and alerting rules for a Prometheus instance',
    pluralName:      'monitoring.coreos.com.prometheusrules',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'monitoring.coreos.com',
      kind:       'PrometheusRule',
      namespaced: true,
      resource:   'prometheusrules',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  }
];

function reply(statusCode, body) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function generateV2MonitoringForLocalCluster() {
  // all intercepts needed to mock install of V2 monitoring

  cy.intercept('GET', `/v3/schemas`, (req) => {
    req.continue((res) => {
      const schemaData = [...res.body.data, ...v3Schemas];

      res.body.data = schemaData;
      res.send(res.body);
    });
  }).as('v3Schemas');

  cy.intercept('GET', `/k8s/clusters/local/v1/schemas?*`, (req) => {
    req.continue((res) => {
      const schemaData = [...res.body.data, ...k8sSchemas];

      res.body.data = schemaData;
      res.send(res.body);
    });
  }).as('k8sSchemas');

  // NOTE: alertManagerConfigsGet has an item for the proxyURL test
  // testing https://github.com/rancher/dashboard/issues/10389
  const interceptsData = [
    ['/k8s/clusters/local/v1/monitoring.coreos.com.podmonitors', podMonitorsGet],
    ['/k8s/clusters/local/v1/monitoring.coreos.com.servicemonitors', serviceMonitorsGet],
    ['/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagerconfigs', alertManagerConfigsGet],
    ['/k8s/clusters/local/v1/monitoring.coreos.com.alertmanagers/cattle-monitoring-system/rancher-monitoring-alertmanager', rancherMonitoringAlertmanagerGet],
    ['/k8s/clusters/local/v1/secrets/cattle-monitoring-system/alertmanager-rancher-monitoring-alertmanager', alertManagerRancherMonitoringAlertmanagerGet],
    ['/k8s/clusters/local/v1/monitoring.coreos.com.prometheusrules', prometheusRulesGet],
    ['/k8s/clusters/local/v1/monitoring.coreos.com.prometheuses', prometheusesGet],
  ];

  interceptsData.forEach((requestData, i) => {
    cy.intercept('GET', `${ requestData[0] }?*`,
      reply(200, requestData[1])).as(`monitoring-req-${ i }`);
  });

  return true;
}
