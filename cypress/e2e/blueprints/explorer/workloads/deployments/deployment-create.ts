import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

export const createDeploymentBlueprint = {
  apiVersion: 'apps/v1',
  kind:       'Deployment',
  metadata:   {
    name:      'test-deployment-kubectl',
    namespace: 'default',
    labels:    { 'e2e-test': 'true' },
  },
  spec: {
    replicas: 1,
    template: {
      spec: {
        containers: [
          {
            name:      'nginx',
            image:     'nginx:alpine',
            resources: {
              requests: {
                cpu:    '200m',
                memory: '512Mi'
              },
              limits: {
                cpu:    '500m',
                memory: '1Gi'
              }
            }
          }
        ],
        volumes: [
          {
            name:      'test-vol',
            projected: {
              defaultMode: 420,
              sources:     [
                {
                  configMap: {
                    items: [{ key: 'test-vol-key', path: 'test-vol-path' }],
                    name:  'configmap-name'
                  }
                }
              ]
            }
          },
          {
            name:      'test-vol1',
            projected: {
              defaultMode: 420,
              sources:     [
                {
                  configMap: {
                    items: [{ key: 'test-vol-key1', path: 'test-vol-path1' }],
                    name:  'configmap-name1'
                  }
                }
              ]
            }
          }
        ]
      },
      metadata: {
        labels:    { 'e2e-test': 'true' },
        namespace: 'default'
      }
    },
    selector: { matchLabels: { 'e2e-test': 'true' } }
  }
};

export const deploymentCreateRequest = {
  metadata: {
    namespace: 'default',
    labels:    { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test-deployment' },
    name:      'test-deployment'
  },
  spec: {
    replicas: 1,
    template: {
      spec: {
        restartPolicy: 'Always',
        containers:    [
          {
            imagePullPolicy: 'Always',
            name:            'container-0',
            securityContext: {
              runAsNonRoot:             false,
              readOnlyRootFilesystem:   false,
              privileged:               false,
              allowPrivilegeEscalation: false
            },
            volumeMounts: [],
            image:        'nginx'
          }
        ],
        initContainers:   [],
        imagePullSecrets: [],
        volumes:          [],
        affinity:         {}
      },
      metadata: {
        labels:    { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test-deployment' },
        namespace: 'default'
      }
    },
    selector: { matchLabels: { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test-deployment' } }
  }
};

export const deploymentCreateResponse = {
  id:    'default/test-deployment',
  links: {
    remove: 'https://localhost:8005/v1/apps.deployments/default/test-deployment',
    self:   'https://localhost:8005/v1/apps.deployments/default/test-deployment',
    update: 'https://localhost:8005/v1/apps.deployments/default/test-deployment',
    view:   'https://localhost:8005/apis/apps/v1/namespaces/default/deployments/test-deployment'
  },
  apiVersion: 'apps/v1',
  kind:       'Deployment',
  metadata:   {
    creationTimestamp: '2023-06-19T15:51:02Z',
    fields:            [
      'test-deployment',
      '0/1',
      0,
      0,
      '0s',
      'container-0',
      'nginx',
      'workload.user.cattle.io/workloadselector=apps.deployment-default-test-deployment'
    ],
    generation:    1,
    labels:        { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test-deployment' },
    managedFields: [
      {
        apiVersion: 'apps/v1',
        fieldsType: 'FieldsV1',
        fieldsV1:   {
          'f:metadata': {
            'f:labels': {
              '.':                                          {},
              'f:workload.user.cattle.io/workloadselector': {}
            }
          },
          'f:spec': {
            'f:progressDeadlineSeconds': {},
            'f:replicas':                {},
            'f:revisionHistoryLimit':    {},
            'f:selector':                {},
            'f:strategy':                {
              'f:rollingUpdate': {
                '.':                {},
                'f:maxSurge':       {},
                'f:maxUnavailable': {}
              },
              'f:type': {}
            },
            'f:template': {
              'f:metadata': {
                'f:labels': {
                  '.':                                          {},
                  'f:workload.user.cattle.io/workloadselector': {}
                },
                'f:namespace': {}
              },
              'f:spec': {
                'f:affinity':   {},
                'f:containers': {
                  'k:{"name":"container-0"}': {
                    '.':                 {},
                    'f:image':           {},
                    'f:imagePullPolicy': {},
                    'f:name':            {},
                    'f:resources':       {},
                    'f:securityContext': {
                      '.':                          {},
                      'f:allowPrivilegeEscalation': {},
                      'f:privileged':               {},
                      'f:readOnlyRootFilesystem':   {},
                      'f:runAsNonRoot':             {}
                    },
                    'f:terminationMessagePath':   {},
                    'f:terminationMessagePolicy': {}
                  }
                },
                'f:dnsPolicy':                     {},
                'f:restartPolicy':                 {},
                'f:schedulerName':                 {},
                'f:securityContext':               {},
                'f:terminationGracePeriodSeconds': {}
              }
            }
          }
        },
        manager:   'rancher',
        operation: 'Update',
        time:      '2023-06-19T15:51:02Z'
      }
    ],
    name:          'test-deployment',
    namespace:     'default',
    relationships: [
      {
        toType:      'pod',
        toNamespace: 'default',
        rel:         'creates',
        selector:    'workload.user.cattle.io/workloadselector=apps.deployment-default-test-deployment'
      },
      {
        toType: 'serviceaccount',
        rel:    'uses'
      }
    ],
    resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
    state:           {
      error:         false,
      message:       'replicas: 0/1',
      name:          'in-progress',
      transitioning: true
    },
    uid: '3c14fcfb-d62c-4dd6-be5e-441ae808470a'
  },
  spec: {
    progressDeadlineSeconds: 600,
    replicas:                1,
    revisionHistoryLimit:    10,
    selector:                { matchLabels: { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test-deployment' } },
    strategy:                {
      rollingUpdate: {
        maxSurge:       '25%',
        maxUnavailable: '25%'
      },
      type: 'RollingUpdate'
    },
    template: {
      metadata: {
        creationTimestamp: null,
        labels:            { 'workload.user.cattle.io/workloadselector': 'apps.deployment-default-test-deployment' },
        namespace:         'default'
      },
      spec: {
        affinity:   {},
        containers: [
          {
            image:           'nginx',
            imagePullPolicy: 'Always',
            name:            'container-0',
            resources:       {},
            securityContext: {
              allowPrivilegeEscalation: false,
              privileged:               false,
              readOnlyRootFilesystem:   false,
              runAsNonRoot:             false
            },
            terminationMessagePath:   '/dev/termination-log',
            terminationMessagePolicy: 'File'
          }
        ],
        dnsPolicy:                     'ClusterFirst',
        restartPolicy:                 'Always',
        schedulerName:                 'default-scheduler',
        securityContext:               {},
        terminationGracePeriodSeconds: 30
      }
    }
  },
  status: {}
};
