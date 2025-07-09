import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

export const deploymentGetResponse = {
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
    annotations:       { 'deployment.kubernetes.io/revision': '1' },
    creationTimestamp: '2023-06-19T15:51:02Z',
    fields:            [
      'test-deployment',
      '1/1',
      1,
      1,
      '11m',
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
      },
      {
        apiVersion: 'apps/v1',
        fieldsType: 'FieldsV1',
        fieldsV1:   {
          'f:metadata': {
            'f:annotations': {
              '.':                                   {},
              'f:deployment.kubernetes.io/revision': {}
            }
          },
          'f:status': {
            'f:availableReplicas': {},
            'f:conditions':        {
              '.':                      {},
              'k:{"type":"Available"}': {
                '.':                    {},
                'f:lastTransitionTime': {},
                'f:lastUpdateTime':     {},
                'f:message':            {},
                'f:reason':             {},
                'f:status':             {},
                'f:type':               {}
              },
              'k:{"type":"Progressing"}': {
                '.':                    {},
                'f:lastTransitionTime': {},
                'f:lastUpdateTime':     {},
                'f:message':            {},
                'f:reason':             {},
                'f:status':             {},
                'f:type':               {}
              }
            },
            'f:observedGeneration': {},
            'f:readyReplicas':      {},
            'f:replicas':           {},
            'f:updatedReplicas':    {}
          }
        },
        manager:     'k3s',
        operation:   'Update',
        subresource: 'status',
        time:        '2023-06-19T15:51:03Z'
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
      },
      {
        toId:    'default/test-deployment-b97b798c8',
        toType:  'apps.replicaset',
        rel:     'owner',
        state:   'active',
        message: 'ReplicaSet is available. Replicas: 1'
      }
    ],
    resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
    state:           {
      error:         false,
      message:       'Deployment is available. Replicas: 1',
      name:          'active',
      transitioning: false
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
  status: {
    availableReplicas: 1,
    conditions:        [
      {
        error:              false,
        lastTransitionTime: '2023-06-19T15:51:03Z',
        lastUpdateTime:     '2023-06-19T15:51:03Z',
        message:            'Deployment has minimum availability.',
        reason:             'MinimumReplicasAvailable',
        status:             'True',
        transitioning:      false,
        type:               'Available'
      },
      {
        error:              false,
        lastTransitionTime: '2023-06-19T15:51:02Z',
        lastUpdateTime:     '2023-06-19T15:51:03Z',
        message:            'ReplicaSet "test-deployment-b97b798c8" has successfully progressed.',
        reason:             'NewReplicaSetAvailable',
        status:             'True',
        transitioning:      false,
        type:               'Progressing'
      }
    ],
    observedGeneration: 1,
    readyReplicas:      1,
    replicas:           1,
    updatedReplicas:    1
  }
};
