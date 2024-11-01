import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

export const deploymentCollection = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/apps.deployments' },
  createTypes:  { 'apps.deployment': 'https://localhost:8005/v1/apps.deployments' },
  actions:      {},
  resourceType: 'apps.deployment',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        15,
  data:         [

    {
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
          '0/1',
          1,
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
                'f:annotations': {
                  '.':                                   {},
                  'f:deployment.kubernetes.io/revision': {}
                }
              },
              'f:status': {
                'f:conditions': {
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
                'f:observedGeneration':  {},
                'f:replicas':            {},
                'f:unavailableReplicas': {},
                'f:updatedReplicas':     {}
              }
            },
            manager:     'k3s',
            operation:   'Update',
            subresource: 'status',
            time:        '2023-06-19T15:51:02Z'
          },
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
          },
          {
            toId:          'default/test-deployment-b97b798c8',
            toType:        'apps.replicaset',
            rel:           'owner',
            state:         'in-progress',
            message:       'Available: 0/1',
            transitioning: true
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Deployment does not have minimum availability.',
          name:          'updating',
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
      status: {
        conditions: [
          {
            error:              false,
            lastTransitionTime: '2023-06-19T15:51:02Z',
            lastUpdateTime:     '2023-06-19T15:51:02Z',
            message:            'Deployment does not have minimum availability.',
            reason:             'MinimumReplicasUnavailable',
            status:             'False',
            transitioning:      true,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-06-19T15:51:02Z',
            lastUpdateTime:     '2023-06-19T15:51:02Z',
            message:            'ReplicaSet "test-deployment-b97b798c8" is progressing.',
            reason:             'ReplicaSetUpdated',
            status:             'True',
            transitioning:      false,
            type:               'Progressing'
          }
        ],
        observedGeneration:  1,
        replicas:            1,
        unavailableReplicas: 1,
        updatedReplicas:     1
      }
    }
  ]
};

export const deploymentCollectionResponseFull = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/apps.deployments' },
  createTypes:  { 'apps.deployment': 'https://localhost:8005/v1/apps.deployments' },
  actions:      {},
  resourceType: 'apps.deployment',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        15,
  data:         [
    {
      id:    'cattle-fleet-local-system/fleet-agent',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-fleet-local-system/fleet-agent',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-fleet-local-system/fleet-agent',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-fleet-local-system/fleet-agent',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-fleet-local-system/deployments/fleet-agent'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'objectset.rio.cattle.io/applied':   'H4sIAAAAAAAA/4RUTXPjNgz9LzhLimwn/tDN41VTT7daT5LuZcezQ1GQzYYiWRJ043r03zuUbUXph/dkCQIeHvAefAJmxFe0TmgFGTBj3N1hBBG8ClVBBp/QSH1sUBFE0CCxihGD7ARMKU2MhFYuvOryd+TkkBIrdMIZkcRE6DsRQGqJSDHboaK41JocWWbic1J8/ig1ZzJ2R0fYQBuBZCXKm8h75vaQwWQ6TseTevYwxlk9WswX1bycPowxHS/KasynD3OGM35/H0AVa/AjHTgHnWE8fLlJyRnkgZBDiZy0Dc8NI77/3HNlxvwDvw2FZBnh7gjZqY2AsDGSEXblg4Vyi906X0SDjlhjIFNeyuEq/gf+wovVtVCCQhtQusLl4N1YrNFarD55K9Tume+x8lKo3XqndB/O35B76pzw7VqDimM/af5mLDp3Fv3bCV7xeCU0UOa6WW3Qsm5RsFYQwYFJj6EQyHqEbbttI/gTxW5PkI3abRiGa0VMKLTnBqgO3e9FuWL5a/68Wa7yK9pPVjeBXS1QVk9Y988bRsEd1wUn7yq3bRv1gMvHvHj5/rz6sukhf2CDvnT1c776ZV18Xxcv+dPX5edB/eihSd0w9zEv8qfly/pLMcgq68WcszKNJ+NZGd+XsypeLNJFvJjXk6pKp1WZTuMxtNsIRMN2ocQyxfdo7wYWyA5pMkvS2PJkApfMjZdyo6XgQZ11XWjaWHTvdv/XDVh02lsexDm1oWHwz/PA56++RKuQ0AWBtYMMpFD+rbsL5N4KOq60InyjkG69WrpHq72BbJSmaXSOFFo9aU2QBf0vsd8c2nNSB2UPguOSc+0VFf9FlbQMruotiHWNnII39MXVGP69OmOGKRIuta+M1QdRoU0+DuJVuBDBpPgLq4+Ozf/wTA7U6iwbJL3V8P0GtLsNd9netm3b9u8AAAD//4N7lciEBQAA',
          'objectset.rio.cattle.io/id':        'fleet-agent-bootstrap-cattle-fleet-local-system'
        },
        creationTimestamp: '2023-05-29T13:37:43Z',
        fields:            [
          'fleet-agent',
          '1/1',
          1,
          1,
          '21d',
          'fleet-agent',
          'rancher/fleet-agent:v0.7.0-rc.3',
          'app=fleet-agent'
        ],
        generation:    1,
        labels:        { 'objectset.rio.cattle.io/hash': '362023f752e7f1989d8b652e029bd2c658ae7c44' },
        managedFields: [
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                 {},
                  'f:objectset.rio.cattle.io/applied': {},
                  'f:objectset.rio.cattle.io/id':      {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:objectset.rio.cattle.io/hash': {}
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
                      '.':     {},
                      'f:app': {}
                    }
                  },
                  'f:spec': {
                    'f:affinity': {
                      '.':              {},
                      'f:nodeAffinity': {
                        '.':                                                 {},
                        'f:preferredDuringSchedulingIgnoredDuringExecution': {}
                      }
                    },
                    'f:containers': {
                      'k:{"name":"fleet-agent"}': {
                        '.':     {},
                        'f:env': {
                          '.':                        {},
                          'k:{"name":"AGENT_SCOPE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"CHECKIN_INTERVAL"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"GENERATION"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"NAMESPACE"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':          {},
                              'f:fieldRef': {}
                            }
                          }
                        },
                        'f:image':                    {},
                        'f:imagePullPolicy':          {},
                        'f:name':                     {},
                        'f:resources':                {},
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {}
                      }
                    },
                    'f:dnsPolicy':       {},
                    'f:nodeSelector':    {},
                    'f:restartPolicy':   {},
                    'f:schedulerName':   {},
                    'f:securityContext': {
                      '.':              {},
                      'f:runAsGroup':   {},
                      'f:runAsNonRoot': {},
                      'f:runAsUser':    {}
                    },
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {}
                  }
                }
              }
            },
            manager:   'fleetcontroller',
            operation: 'Update',
            time:      '2023-05-29T13:37:43Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-29T13:37:49Z'
          }
        ],
        name:          'fleet-agent',
        namespace:     'cattle-fleet-local-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-fleet-local-system',
            rel:         'creates',
            selector:    'app=fleet-agent'
          },
          {
            toId:    'cattle-fleet-local-system/fleet-agent',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-fleet-local-system/fleet-agent-79c5558c74',
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
        uid: '4f3b1076-70aa-4774-800f-efba99ab79bf'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                { matchLabels: { app: 'fleet-agent' } },
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
            labels:            { app: 'fleet-agent' }
          },
          spec: {
            affinity: {
              nodeAffinity: {
                preferredDuringSchedulingIgnoredDuringExecution: [
                  {
                    preference: {
                      matchExpressions: [
                        {
                          key:      'fleet.cattle.io/agent',
                          operator: 'In',
                          values:   [
                            'true'
                          ]
                        }
                      ]
                    },
                    weight: 1
                  }
                ]
              }
            },
            containers: [
              {
                env: [
                  {
                    name:      'NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      }
                    }
                  },
                  {
                    name:  'AGENT_SCOPE',
                    value: 'cattle-fleet-local-system'
                  },
                  {
                    name:  'CHECKIN_INTERVAL',
                    value: '15m0s'
                  },
                  {
                    name:  'GENERATION',
                    value: 'bf98cab0-327b-4b7d-9909-98f3dd06db06-2'
                  }
                ],
                image:                    'rancher/fleet-agent:v0.7.0-rc.3',
                imagePullPolicy:          'IfNotPresent',
                name:                     'fleet-agent',
                resources:                {},
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File'
              }
            ],
            dnsPolicy:       'ClusterFirst',
            nodeSelector:    { 'kubernetes.io/os': 'linux' },
            restartPolicy:   'Always',
            schedulerName:   'default-scheduler',
            securityContext: {
              runAsGroup:   1000,
              runAsNonRoot: true,
              runAsUser:    1000
            },
            serviceAccount:                'fleet-agent',
            serviceAccountName:            'fleet-agent',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'node.cloudprovider.kubernetes.io/uninitialized',
                operator: 'Equal',
                value:    'true'
              },
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:37:49Z',
            lastUpdateTime:     '2023-05-29T13:37:49Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:37:43Z',
            lastUpdateTime:     '2023-05-29T13:37:49Z',
            message:            'ReplicaSet "fleet-agent-79c5558c74" has successfully progressed.',
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
    },
    {
      id:    'cattle-fleet-system/fleet-controller',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-fleet-system/fleet-controller',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-fleet-system/fleet-controller',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-fleet-system/fleet-controller',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-fleet-system/deployments/fleet-controller'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'fleet',
          'meta.helm.sh/release-namespace':    'cattle-fleet-system'
        },
        creationTimestamp: '2023-05-29T13:32:55Z',
        fields:            [
          'fleet-controller',
          '1/1',
          1,
          1,
          '21d',
          'fleet-controller',
          'rancher/fleet:v0.7.0-rc.3',
          'app=fleet-controller'
        ],
        generation:    1,
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                  'f:app.kubernetes.io/managed-by': {}
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
                      '.':     {},
                      'f:app': {}
                    }
                  },
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"fleet-controller"}': {
                        '.':         {},
                        'f:command': {},
                        'f:env':     {
                          '.':                                                     {},
                          'k:{"name":"FLEET_PROPAGATE_DEBUG_SETTINGS_TO_AGENTS"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"NAMESPACE"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':          {},
                              'f:fieldRef': {}
                            }
                          }
                        },
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:name':            {},
                        'f:resources':       {},
                        'f:securityContext': {
                          '.':                          {},
                          'f:allowPrivilegeEscalation': {},
                          'f:capabilities':             {
                            '.':      {},
                            'f:drop': {}
                          },
                          'f:privileged':             {},
                          'f:readOnlyRootFilesystem': {}
                        },
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                      {},
                          'k:{"mountPath":"/tmp"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      }
                    },
                    'f:dnsPolicy':       {},
                    'f:nodeSelector':    {},
                    'f:restartPolicy':   {},
                    'f:schedulerName':   {},
                    'f:securityContext': {
                      '.':              {},
                      'f:runAsGroup':   {},
                      'f:runAsNonRoot': {},
                      'f:runAsUser':    {}
                    },
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {},
                    'f:volumes':                       {
                      '.':                {},
                      'k:{"name":"tmp"}': {
                        '.':          {},
                        'f:emptyDir': {},
                        'f:name':     {}
                      }
                    }
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-29T13:32:55Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-29T13:33:01Z'
          }
        ],
        name:          'fleet-controller',
        namespace:     'cattle-fleet-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-fleet-system',
            rel:         'creates',
            selector:    'app=fleet-controller'
          },
          {
            toId:    'cattle-fleet-system/fleet-controller',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-fleet-system/fleet-controller-85c5fd5f69',
            toType:  'apps.replicaset',
            rel:     'owner',
            state:   'active',
            message: 'ReplicaSet is available. Replicas: 1'
          },
          {
            fromId:   'cattle-fleet-system/fleet',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Deployment is available. Replicas: 1',
          name:          'active',
          transitioning: false
        },
        uid: 'cebfee64-7d7e-4f06-8a29-e63d73ec65d1'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                { matchLabels: { app: 'fleet-controller' } },
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
            labels:            { app: 'fleet-controller' }
          },
          spec: {
            containers: [
              {
                command: [
                  'fleetcontroller',
                  '--disable-bootstrap'
                ],
                env: [
                  {
                    name:      'NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      }
                    }
                  },
                  {
                    name:  'FLEET_PROPAGATE_DEBUG_SETTINGS_TO_AGENTS',
                    value: 'true'
                  }
                ],
                image:           'rancher/fleet:v0.7.0-rc.3',
                imagePullPolicy: 'IfNotPresent',
                name:            'fleet-controller',
                resources:       {},
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities:             {
                    drop: [
                      'ALL'
                    ]
                  },
                  privileged:             false,
                  readOnlyRootFilesystem: true
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/tmp',
                    name:      'tmp'
                  }
                ]
              }
            ],
            dnsPolicy:       'ClusterFirst',
            nodeSelector:    { 'kubernetes.io/os': 'linux' },
            restartPolicy:   'Always',
            schedulerName:   'default-scheduler',
            securityContext: {
              runAsGroup:   1000,
              runAsNonRoot: true,
              runAsUser:    1000
            },
            serviceAccount:                'fleet-controller',
            serviceAccountName:            'fleet-controller',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ],
            volumes: [
              {
                emptyDir: {},
                name:     'tmp'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:33:01Z',
            lastUpdateTime:     '2023-05-29T13:33:01Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:32:55Z',
            lastUpdateTime:     '2023-05-29T13:33:01Z',
            message:            'ReplicaSet "fleet-controller-85c5fd5f69" has successfully progressed.',
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
    },
    {
      id:    'cattle-fleet-system/gitjob',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-fleet-system/gitjob',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-fleet-system/gitjob',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-fleet-system/gitjob',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-fleet-system/deployments/gitjob'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'fleet',
          'meta.helm.sh/release-namespace':    'cattle-fleet-system'
        },
        creationTimestamp: '2023-05-29T13:32:55Z',
        fields:            [
          'gitjob',
          '1/1',
          1,
          1,
          '21d',
          'gitjob',
          'rancher/gitjob:v0.1.54',
          'app=gitjob'
        ],
        generation:    1,
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                  'f:app.kubernetes.io/managed-by': {}
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
                      '.':     {},
                      'f:app': {}
                    }
                  },
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"gitjob"}': {
                        '.':      {},
                        'f:args': {},
                        'f:env':  {
                          '.':                      {},
                          'k:{"name":"NAMESPACE"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':          {},
                              'f:fieldRef': {}
                            }
                          }
                        },
                        'f:image':                    {},
                        'f:imagePullPolicy':          {},
                        'f:name':                     {},
                        'f:resources':                {},
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {}
                      }
                    },
                    'f:dnsPolicy':                     {},
                    'f:nodeSelector':                  {},
                    'f:restartPolicy':                 {},
                    'f:schedulerName':                 {},
                    'f:securityContext':               {},
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-29T13:32:55Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-29T13:33:03Z'
          }
        ],
        name:          'gitjob',
        namespace:     'cattle-fleet-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-fleet-system',
            rel:         'creates',
            selector:    'app=gitjob'
          },
          {
            toId:    'cattle-fleet-system/gitjob',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-fleet-system/gitjob-7c95f8997c',
            toType:  'apps.replicaset',
            rel:     'owner',
            state:   'active',
            message: 'ReplicaSet is available. Replicas: 1'
          },
          {
            fromId:   'cattle-fleet-system/fleet',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Deployment is available. Replicas: 1',
          name:          'active',
          transitioning: false
        },
        uid: '67dd750c-2d8b-4da0-a36b-e0a94abdbb55'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                { matchLabels: { app: 'gitjob' } },
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
            labels:            { app: 'gitjob' }
          },
          spec: {
            containers: [
              {
                args: [
                  '--tekton-image',
                  'rancher/tekton-utils:v0.1.22'
                ],
                env: [
                  {
                    name:      'NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      }
                    }
                  }
                ],
                image:                    'rancher/gitjob:v0.1.54',
                imagePullPolicy:          'IfNotPresent',
                name:                     'gitjob',
                resources:                {},
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File'
              }
            ],
            dnsPolicy:                     'ClusterFirst',
            nodeSelector:                  { 'kubernetes.io/os': 'linux' },
            restartPolicy:                 'Always',
            schedulerName:                 'default-scheduler',
            securityContext:               {},
            serviceAccount:                'gitjob',
            serviceAccountName:            'gitjob',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:33:03Z',
            lastUpdateTime:     '2023-05-29T13:33:03Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:32:55Z',
            lastUpdateTime:     '2023-05-29T13:33:03Z',
            message:            'ReplicaSet "gitjob-7c95f8997c" has successfully progressed.',
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
    },
    {
      id:    'cattle-monitoring-system/pushprox-k3s-server-proxy',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/pushprox-k3s-server-proxy',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/pushprox-k3s-server-proxy',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/pushprox-k3s-server-proxy',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-monitoring-system/deployments/pushprox-k3s-server-proxy'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'rancher-monitoring',
          'meta.helm.sh/release-namespace':    'cattle-monitoring-system'
        },
        creationTimestamp: '2023-05-30T20:59:38Z',
        fields:            [
          'pushprox-k3s-server-proxy',
          '1/1',
          1,
          1,
          '19d',
          'pushprox-proxy',
          'rancher/pushprox-proxy:v0.1.0-rancher2-proxy',
          'component=k3s-server,k8s-app=pushprox-k3s-server-proxy,provider=kubernetes,release=rancher-monitoring'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/managed-by': 'Helm',
          component:                      'k3s-server',
          'k8s-app':                      'pushprox-k3s-server-proxy',
          provider:                       'kubernetes',
          'pushprox-exporter':            'proxy',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                  'f:app.kubernetes.io/managed-by': {},
                  'f:component':                    {},
                  'f:k8s-app':                      {},
                  'f:provider':                     {},
                  'f:pushprox-exporter':            {},
                  'f:release':                      {}
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
                      '.':           {},
                      'f:component': {},
                      'f:k8s-app':   {},
                      'f:provider':  {},
                      'f:release':   {}
                    }
                  },
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"pushprox-proxy"}': {
                        '.':                          {},
                        'f:command':                  {},
                        'f:image':                    {},
                        'f:imagePullPolicy':          {},
                        'f:name':                     {},
                        'f:resources':                {},
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {}
                      }
                    },
                    'f:dnsPolicy':       {},
                    'f:nodeSelector':    {},
                    'f:restartPolicy':   {},
                    'f:schedulerName':   {},
                    'f:securityContext': {
                      '.':              {},
                      'f:runAsNonRoot': {},
                      'f:runAsUser':    {}
                    },
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-30T20:59:38Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-30T20:59:46Z'
          }
        ],
        name:          'pushprox-k3s-server-proxy',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-monitoring-system',
            rel:         'creates',
            selector:    'component=k3s-server,k8s-app=pushprox-k3s-server-proxy,provider=kubernetes,release=rancher-monitoring'
          },
          {
            toId:    'cattle-monitoring-system/pushprox-k3s-server-proxy',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-monitoring-system/pushprox-k3s-server-proxy-ccbd676bc',
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
        uid: 'dcbd658b-3415-4fb8-bfbe-bf11f07f0160'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                {
          matchLabels: {
            component: 'k3s-server',
            'k8s-app': 'pushprox-k3s-server-proxy',
            provider:  'kubernetes',
            release:   'rancher-monitoring'
          }
        },
        strategy: {
          rollingUpdate: {
            maxSurge:       '25%',
            maxUnavailable: '25%'
          },
          type: 'RollingUpdate'
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels:            {
              component: 'k3s-server',
              'k8s-app': 'pushprox-k3s-server-proxy',
              provider:  'kubernetes',
              release:   'rancher-monitoring'
            }
          },
          spec: {
            containers: [
              {
                command: [
                  'pushprox-proxy'
                ],
                image:                    'rancher/pushprox-proxy:v0.1.0-rancher2-proxy',
                imagePullPolicy:          'IfNotPresent',
                name:                     'pushprox-proxy',
                resources:                {},
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File'
              }
            ],
            dnsPolicy:       'ClusterFirst',
            nodeSelector:    { 'kubernetes.io/os': 'linux' },
            restartPolicy:   'Always',
            schedulerName:   'default-scheduler',
            securityContext: {
              runAsNonRoot: true,
              runAsUser:    1000
            },
            serviceAccount:                'pushprox-k3s-server-proxy',
            serviceAccountName:            'pushprox-k3s-server-proxy',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:46Z',
            lastUpdateTime:     '2023-05-30T20:59:46Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:38Z',
            lastUpdateTime:     '2023-05-30T20:59:46Z',
            message:            'ReplicaSet "pushprox-k3s-server-proxy-ccbd676bc" has successfully progressed.',
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
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-grafana',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-grafana',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-grafana',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-grafana',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-monitoring-system/deployments/rancher-monitoring-grafana'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'rancher-monitoring',
          'meta.helm.sh/release-namespace':    'cattle-monitoring-system'
        },
        creationTimestamp: '2023-05-30T20:59:38Z',
        fields:            [
          'rancher-monitoring-grafana',
          '1/1',
          1,
          1,
          '19d',
          'grafana-sc-dashboard,grafana-sc-datasources,grafana,grafana-proxy',
          'rancher/mirrored-kiwigrid-k8s-sidecar:1.19.2,rancher/mirrored-kiwigrid-k8s-sidecar:1.19.2,rancher/mirrored-grafana-grafana:9.1.5,rancher/mirrored-library-nginx:1.24.0-alpine',
          'app.kubernetes.io/instance=rancher-monitoring,app.kubernetes.io/name=grafana'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'grafana',
          'app.kubernetes.io/version':    '9.1.5',
          'helm.sh/chart':                'grafana-6.38.6'
        },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                'f:progressDeadlineSeconds': {},
                'f:replicas':                {},
                'f:revisionHistoryLimit':    {},
                'f:selector':                {},
                'f:strategy':                { 'f:type': {} },
                'f:template':                {
                  'f:metadata': {
                    'f:annotations': {
                      '.':                                       {},
                      'f:checksum/config':                       {},
                      'f:checksum/dashboards-json-config':       {},
                      'f:checksum/sc-dashboard-provider-config': {},
                      'f:checksum/secret':                       {}
                    },
                    'f:labels': {
                      '.':                            {},
                      'f:app.kubernetes.io/instance': {},
                      'f:app.kubernetes.io/name':     {}
                    }
                  },
                  'f:spec': {
                    'f:automountServiceAccountToken': {},
                    'f:containers':                   {
                      'k:{"name":"grafana"}': {
                        '.':     {},
                        'f:env': {
                          '.':                          {},
                          'k:{"name":"GF_PATHS_DATA"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"GF_PATHS_LOGS"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"GF_PATHS_PLUGINS"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"GF_PATHS_PROVISIONING"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"GF_SECURITY_ADMIN_PASSWORD"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':              {},
                              'f:secretKeyRef': {}
                            }
                          },
                          'k:{"name":"GF_SECURITY_ADMIN_USER"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':              {},
                              'f:secretKeyRef': {}
                            }
                          }
                        },
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:livenessProbe':   {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:initialDelaySeconds': {},
                          'f:periodSeconds':       {},
                          'f:successThreshold':    {},
                          'f:timeoutSeconds':      {}
                        },
                        'f:name':  {},
                        'f:ports': {
                          '.':                                         {},
                          'k:{"containerPort":8080,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
                        'f:readinessProbe': {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:periodSeconds':    {},
                          'f:successThreshold': {},
                          'f:timeoutSeconds':   {}
                        },
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
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                                          {},
                          'k:{"mountPath":"/etc/grafana/grafana.ini"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {},
                            'f:subPath':   {}
                          },
                          'k:{"mountPath":"/etc/grafana/provisioning/dashboards/sc-dashboardproviders.yaml"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {},
                            'f:subPath':   {}
                          },
                          'k:{"mountPath":"/etc/grafana/provisioning/datasources"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          },
                          'k:{"mountPath":"/tmp/dashboards"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          },
                          'k:{"mountPath":"/var/lib/grafana"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      },
                      'k:{"name":"grafana-proxy"}': {
                        '.':                 {},
                        'f:args':            {},
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:name':            {},
                        'f:ports':           {
                          '.':                                         {},
                          'k:{"containerPort":8080,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
                        'f:resources':       {},
                        'f:securityContext': {
                          '.':            {},
                          'f:runAsGroup': {},
                          'f:runAsUser':  {}
                        },
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                        {},
                          'k:{"mountPath":"/nginx"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          },
                          'k:{"mountPath":"/var/cache/nginx"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      },
                      'k:{"name":"grafana-sc-dashboard"}': {
                        '.':     {},
                        'f:env': {
                          '.':                   {},
                          'k:{"name":"FOLDER"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"LABEL"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"LABEL_VALUE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"METHOD"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"NAMESPACE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"RESOURCE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          }
                        },
                        'f:image':                    {},
                        'f:imagePullPolicy':          {},
                        'f:name':                     {},
                        'f:resources':                {},
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                                 {},
                          'k:{"mountPath":"/tmp/dashboards"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      },
                      'k:{"name":"grafana-sc-datasources"}': {
                        '.':     {},
                        'f:env': {
                          '.':                   {},
                          'k:{"name":"FOLDER"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"LABEL"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"LABEL_VALUE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"METHOD"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"REQ_PASSWORD"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':              {},
                              'f:secretKeyRef': {}
                            }
                          },
                          'k:{"name":"REQ_USERNAME"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':              {},
                              'f:secretKeyRef': {}
                            }
                          },
                          'k:{"name":"RESOURCE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          }
                        },
                        'f:image':                    {},
                        'f:imagePullPolicy':          {},
                        'f:name':                     {},
                        'f:resources':                {},
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                                                       {},
                          'k:{"mountPath":"/etc/grafana/provisioning/datasources"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      }
                    },
                    'f:dnsPolicy':          {},
                    'f:enableServiceLinks': {},
                    'f:initContainers':     {
                      '.':                                        {},
                      'k:{"name":"grafana-init-sc-datasources"}': {
                        '.':     {},
                        'f:env': {
                          '.':                   {},
                          'k:{"name":"FOLDER"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"LABEL"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"LABEL_VALUE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"METHOD"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"RESOURCE"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          }
                        },
                        'f:image':                    {},
                        'f:imagePullPolicy':          {},
                        'f:name':                     {},
                        'f:resources':                {},
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                                                       {},
                          'k:{"mountPath":"/etc/grafana/provisioning/datasources"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      }
                    },
                    'f:nodeSelector':    {},
                    'f:restartPolicy':   {},
                    'f:schedulerName':   {},
                    'f:securityContext': {
                      '.':              {},
                      'f:fsGroup':      {},
                      'f:runAsGroup':   {},
                      'f:runAsNonRoot': {},
                      'f:runAsUser':    {}
                    },
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {},
                    'f:volumes':                       {
                      '.':                   {},
                      'k:{"name":"config"}': {
                        '.':           {},
                        'f:configMap': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:name':        {}
                        },
                        'f:name': {}
                      },
                      'k:{"name":"grafana-nginx"}': {
                        '.':           {},
                        'f:configMap': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:items':       {},
                          'f:name':        {}
                        },
                        'f:name': {}
                      },
                      'k:{"name":"nginx-home"}': {
                        '.':          {},
                        'f:emptyDir': {},
                        'f:name':     {}
                      },
                      'k:{"name":"sc-dashboard-provider"}': {
                        '.':           {},
                        'f:configMap': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:name':        {}
                        },
                        'f:name': {}
                      },
                      'k:{"name":"sc-dashboard-volume"}': {
                        '.':          {},
                        'f:emptyDir': {},
                        'f:name':     {}
                      },
                      'k:{"name":"sc-datasources-volume"}': {
                        '.':          {},
                        'f:emptyDir': {},
                        'f:name':     {}
                      },
                      'k:{"name":"storage"}': {
                        '.':          {},
                        'f:emptyDir': {},
                        'f:name':     {}
                      }
                    }
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-30T20:59:38Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-30T20:59:59Z'
          }
        ],
        name:          'rancher-monitoring-grafana',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-monitoring-system',
            rel:         'creates',
            selector:    'app.kubernetes.io/instance=rancher-monitoring,app.kubernetes.io/name=grafana'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-grafana',
            toType:  'configmap',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-grafana-config-dashboards',
            toType:  'configmap',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/grafana-nginx-proxy-config',
            toType:  'configmap',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-grafana',
            toType:  'secret',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-grafana',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-grafana-768dbccd5d',
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
        uid: 'f0ea3310-6f19-48f7-b5ad-a286364a2dd0'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                {
          matchLabels: {
            'app.kubernetes.io/instance': 'rancher-monitoring',
            'app.kubernetes.io/name':     'grafana'
          }
        },
        strategy: { type: 'Recreate' },
        template: {
          metadata: {
            annotations: {
              'checksum/config':                       '5311c670a47b305488d552560a61ba742adb9f983356b63b03d04811694fea5b',
              'checksum/dashboards-json-config':       '01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b',
              'checksum/sc-dashboard-provider-config': 'f2f0f62577145d70122067f5679acd5c1de0e5496b1481a0ea6201dfa265f930',
              'checksum/secret':                       'ce70c1eeb7d82a0edb252380b14f5773303aa3d89cd3744887d490fa6def99db'
            },
            creationTimestamp: null,
            labels:            {
              'app.kubernetes.io/instance': 'rancher-monitoring',
              'app.kubernetes.io/name':     'grafana'
            }
          },
          spec: {
            automountServiceAccountToken: true,
            containers:                   [
              {
                env: [
                  {
                    name:  'METHOD',
                    value: 'WATCH'
                  },
                  {
                    name:  'LABEL',
                    value: 'grafana_dashboard'
                  },
                  {
                    name:  'LABEL_VALUE',
                    value: '1'
                  },
                  {
                    name:  'FOLDER',
                    value: '/tmp/dashboards'
                  },
                  {
                    name:  'RESOURCE',
                    value: 'both'
                  },
                  {
                    name:  'NAMESPACE',
                    value: 'cattle-dashboards'
                  }
                ],
                image:                    'rancher/mirrored-kiwigrid-k8s-sidecar:1.19.2',
                imagePullPolicy:          'IfNotPresent',
                name:                     'grafana-sc-dashboard',
                resources:                {},
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/tmp/dashboards',
                    name:      'sc-dashboard-volume'
                  }
                ]
              },
              {
                env: [
                  {
                    name:  'METHOD',
                    value: 'WATCH'
                  },
                  {
                    name:  'LABEL',
                    value: 'grafana_datasource'
                  },
                  {
                    name:  'LABEL_VALUE',
                    value: '1'
                  },
                  {
                    name:  'FOLDER',
                    value: '/etc/grafana/provisioning/datasources'
                  },
                  {
                    name:  'RESOURCE',
                    value: 'both'
                  },
                  {
                    name:      'REQ_USERNAME',
                    valueFrom: {
                      secretKeyRef: {
                        key:  'admin-user',
                        name: 'rancher-monitoring-grafana'
                      }
                    }
                  },
                  {
                    name:      'REQ_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        key:  'admin-password',
                        name: 'rancher-monitoring-grafana'
                      }
                    }
                  }
                ],
                image:                    'rancher/mirrored-kiwigrid-k8s-sidecar:1.19.2',
                imagePullPolicy:          'IfNotPresent',
                name:                     'grafana-sc-datasources',
                resources:                {},
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/etc/grafana/provisioning/datasources',
                    name:      'sc-datasources-volume'
                  }
                ]
              },
              {
                env: [
                  {
                    name:      'GF_SECURITY_ADMIN_USER',
                    valueFrom: {
                      secretKeyRef: {
                        key:  'admin-user',
                        name: 'rancher-monitoring-grafana'
                      }
                    }
                  },
                  {
                    name:      'GF_SECURITY_ADMIN_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        key:  'admin-password',
                        name: 'rancher-monitoring-grafana'
                      }
                    }
                  },
                  {
                    name:  'GF_PATHS_DATA',
                    value: '/var/lib/grafana/'
                  },
                  {
                    name:  'GF_PATHS_LOGS',
                    value: '/var/log/grafana'
                  },
                  {
                    name:  'GF_PATHS_PLUGINS',
                    value: '/var/lib/grafana/plugins'
                  },
                  {
                    name:  'GF_PATHS_PROVISIONING',
                    value: '/etc/grafana/provisioning'
                  }
                ],
                image:           'rancher/mirrored-grafana-grafana:9.1.5',
                imagePullPolicy: 'IfNotPresent',
                livenessProbe:   {
                  failureThreshold: 10,
                  httpGet:          {
                    path:   '/api/health',
                    port:   3000,
                    scheme: 'HTTP'
                  },
                  initialDelaySeconds: 60,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      30
                },
                name:  'grafana',
                ports: [
                  {
                    containerPort: 8080,
                    name:          'grafana',
                    protocol:      'TCP'
                  }
                ],
                readinessProbe: {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/api/health',
                    port:   3000,
                    scheme: 'HTTP'
                  },
                  periodSeconds:    10,
                  successThreshold: 1,
                  timeoutSeconds:   1
                },
                resources: {
                  limits: {
                    cpu:    '200m',
                    memory: '200Mi'
                  },
                  requests: {
                    cpu:    '100m',
                    memory: '100Mi'
                  }
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/etc/grafana/grafana.ini',
                    name:      'config',
                    subPath:   'grafana.ini'
                  },
                  {
                    mountPath: '/var/lib/grafana',
                    name:      'storage'
                  },
                  {
                    mountPath: '/tmp/dashboards',
                    name:      'sc-dashboard-volume'
                  },
                  {
                    mountPath: '/etc/grafana/provisioning/dashboards/sc-dashboardproviders.yaml',
                    name:      'sc-dashboard-provider',
                    subPath:   'provider.yaml'
                  },
                  {
                    mountPath: '/etc/grafana/provisioning/datasources',
                    name:      'sc-datasources-volume'
                  }
                ]
              },
              {
                args: [
                  'nginx',
                  '-g',
                  'daemon off;',
                  '-c',
                  '/nginx/nginx.conf'
                ],
                image:           'rancher/mirrored-library-nginx:1.24.0-alpine',
                imagePullPolicy: 'IfNotPresent',
                name:            'grafana-proxy',
                ports:           [
                  {
                    containerPort: 8080,
                    name:          'nginx-http',
                    protocol:      'TCP'
                  }
                ],
                resources:       {},
                securityContext: {
                  runAsGroup: 101,
                  runAsUser:  101
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/nginx',
                    name:      'grafana-nginx'
                  },
                  {
                    mountPath: '/var/cache/nginx',
                    name:      'nginx-home'
                  }
                ]
              }
            ],
            dnsPolicy:          'ClusterFirst',
            enableServiceLinks: true,
            initContainers:     [
              {
                env: [
                  {
                    name:  'METHOD',
                    value: 'LIST'
                  },
                  {
                    name:  'LABEL',
                    value: 'grafana_datasource'
                  },
                  {
                    name:  'LABEL_VALUE',
                    value: '1'
                  },
                  {
                    name:  'FOLDER',
                    value: '/etc/grafana/provisioning/datasources'
                  },
                  {
                    name:  'RESOURCE',
                    value: 'both'
                  }
                ],
                image:                    'rancher/mirrored-kiwigrid-k8s-sidecar:1.19.2',
                imagePullPolicy:          'IfNotPresent',
                name:                     'grafana-init-sc-datasources',
                resources:                {},
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/etc/grafana/provisioning/datasources',
                    name:      'sc-datasources-volume'
                  }
                ]
              }
            ],
            nodeSelector:    { 'kubernetes.io/os': 'linux' },
            restartPolicy:   'Always',
            schedulerName:   'default-scheduler',
            securityContext: {
              fsGroup:      472,
              runAsGroup:   472,
              runAsNonRoot: true,
              runAsUser:    472
            },
            serviceAccount:                'rancher-monitoring-grafana',
            serviceAccountName:            'rancher-monitoring-grafana',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ],
            volumes: [
              {
                configMap: {
                  defaultMode: 420,
                  name:        'rancher-monitoring-grafana'
                },
                name: 'config'
              },
              {
                emptyDir: {},
                name:     'storage'
              },
              {
                emptyDir: {},
                name:     'sc-dashboard-volume'
              },
              {
                configMap: {
                  defaultMode: 420,
                  name:        'rancher-monitoring-grafana-config-dashboards'
                },
                name: 'sc-dashboard-provider'
              },
              {
                emptyDir: {},
                name:     'sc-datasources-volume'
              },
              {
                emptyDir: {},
                name:     'nginx-home'
              },
              {
                configMap: {
                  defaultMode: 420,
                  items:       [
                    {
                      key:  'nginx.conf',
                      mode: 438,
                      path: 'nginx.conf'
                    }
                  ],
                  name: 'grafana-nginx-proxy-config'
                },
                name: 'grafana-nginx'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:59Z',
            lastUpdateTime:     '2023-05-30T20:59:59Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:38Z',
            lastUpdateTime:     '2023-05-30T20:59:59Z',
            message:            'ReplicaSet "rancher-monitoring-grafana-768dbccd5d" has successfully progressed.',
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
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-monitoring-system/deployments/rancher-monitoring-kube-state-metrics'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'rancher-monitoring',
          'meta.helm.sh/release-namespace':    'cattle-monitoring-system'
        },
        creationTimestamp: '2023-05-30T20:59:38Z',
        fields:            [
          'rancher-monitoring-kube-state-metrics',
          '1/1',
          1,
          1,
          '19d',
          'kube-state-metrics',
          'rancher/mirrored-kube-state-metrics-kube-state-metrics:v2.6.0',
          'app.kubernetes.io/instance=rancher-monitoring,app.kubernetes.io/name=kube-state-metrics'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/component':  'metrics',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'kube-state-metrics',
          'app.kubernetes.io/part-of':    'kube-state-metrics',
          'app.kubernetes.io/version':    '2.6.0',
          'helm.sh/chart':                'kube-state-metrics-4.18.0',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                    'f:containers': {
                      'k:{"name":"kube-state-metrics"}': {
                        '.':                 {},
                        'f:args':            {},
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:livenessProbe':   {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:initialDelaySeconds': {},
                          'f:periodSeconds':       {},
                          'f:successThreshold':    {},
                          'f:timeoutSeconds':      {}
                        },
                        'f:name':  {},
                        'f:ports': {
                          '.':                                         {},
                          'k:{"containerPort":8080,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
                        'f:readinessProbe': {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:initialDelaySeconds': {},
                          'f:periodSeconds':       {},
                          'f:successThreshold':    {},
                          'f:timeoutSeconds':      {}
                        },
                        'f:resources':                {},
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {}
                      }
                    },
                    'f:dnsPolicy':       {},
                    'f:nodeSelector':    {},
                    'f:restartPolicy':   {},
                    'f:schedulerName':   {},
                    'f:securityContext': {
                      '.':              {},
                      'f:fsGroup':      {},
                      'f:runAsGroup':   {},
                      'f:runAsNonRoot': {},
                      'f:runAsUser':    {}
                    },
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-30T20:59:38Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-30T20:59:49Z'
          }
        ],
        name:          'rancher-monitoring-kube-state-metrics',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-monitoring-system',
            rel:         'creates',
            selector:    'app.kubernetes.io/instance=rancher-monitoring,app.kubernetes.io/name=kube-state-metrics'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-kube-state-metrics',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-kube-state-metrics-56b4477cc',
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
        uid: '413529e9-bcfd-4d81-99e9-e422a24931d9'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                {
          matchLabels: {
            'app.kubernetes.io/instance': 'rancher-monitoring',
            'app.kubernetes.io/name':     'kube-state-metrics'
          }
        },
        strategy: {
          rollingUpdate: {
            maxSurge:       '25%',
            maxUnavailable: '25%'
          },
          type: 'RollingUpdate'
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels:            {
              'app.kubernetes.io/component':  'metrics',
              'app.kubernetes.io/instance':   'rancher-monitoring',
              'app.kubernetes.io/managed-by': 'Helm',
              'app.kubernetes.io/name':       'kube-state-metrics',
              'app.kubernetes.io/part-of':    'kube-state-metrics',
              'app.kubernetes.io/version':    '2.6.0',
              'helm.sh/chart':                'kube-state-metrics-4.18.0',
              release:                        'rancher-monitoring'
            }
          },
          spec: {
            containers: [
              {
                args: [
                  '--port=8080',
                  '--resources=certificatesigningrequests,configmaps,cronjobs,daemonsets,deployments,endpoints,horizontalpodautoscalers,ingresses,jobs,limitranges,mutatingwebhookconfigurations,namespaces,networkpolicies,nodes,persistentvolumeclaims,persistentvolumes,poddisruptionbudgets,pods,replicasets,replicationcontrollers,resourcequotas,secrets,services,statefulsets,storageclasses,validatingwebhookconfigurations,volumeattachments'
                ],
                image:           'rancher/mirrored-kube-state-metrics-kube-state-metrics:v2.6.0',
                imagePullPolicy: 'IfNotPresent',
                livenessProbe:   {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/healthz',
                    port:   8080,
                    scheme: 'HTTP'
                  },
                  initialDelaySeconds: 5,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      5
                },
                name:  'kube-state-metrics',
                ports: [
                  {
                    containerPort: 8080,
                    name:          'http',
                    protocol:      'TCP'
                  }
                ],
                readinessProbe: {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/',
                    port:   8080,
                    scheme: 'HTTP'
                  },
                  initialDelaySeconds: 5,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      5
                },
                resources:                {},
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File'
              }
            ],
            dnsPolicy:       'ClusterFirst',
            nodeSelector:    { 'kubernetes.io/os': 'linux' },
            restartPolicy:   'Always',
            schedulerName:   'default-scheduler',
            securityContext: {
              fsGroup:      65534,
              runAsGroup:   65534,
              runAsNonRoot: true,
              runAsUser:    65534
            },
            serviceAccount:                'rancher-monitoring-kube-state-metrics',
            serviceAccountName:            'rancher-monitoring-kube-state-metrics',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:49Z',
            lastUpdateTime:     '2023-05-30T20:59:49Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:38Z',
            lastUpdateTime:     '2023-05-30T20:59:49Z',
            message:            'ReplicaSet "rancher-monitoring-kube-state-metrics-56b4477cc" has successfully progressed.',
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
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-operator',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-operator',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-operator',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-operator',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-monitoring-system/deployments/rancher-monitoring-operator'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'rancher-monitoring',
          'meta.helm.sh/release-namespace':    'cattle-monitoring-system'
        },
        creationTimestamp: '2023-05-30T20:59:38Z',
        fields:            [
          'rancher-monitoring-operator',
          '1/1',
          1,
          1,
          '19d',
          'rancher-monitoring',
          'rancher/mirrored-prometheus-operator-prometheus-operator:v0.59.1',
          'app=rancher-monitoring-operator,release=rancher-monitoring'
        ],
        generation: 1,
        labels:     {
          app:                            'rancher-monitoring-operator',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/part-of':    'rancher-monitoring',
          'app.kubernetes.io/version':    '102.0.1_up40.1.2',
          chart:                          'rancher-monitoring-102.0.1_up40.1.2',
          heritage:                       'Helm',
          release:                        'rancher-monitoring'
        },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                    'f:containers': {
                      'k:{"name":"rancher-monitoring"}': {
                        '.':                 {},
                        'f:args':            {},
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:name':            {},
                        'f:ports':           {
                          '.':                                         {},
                          'k:{"containerPort":8443,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
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
                        'f:securityContext': {
                          '.':                          {},
                          'f:allowPrivilegeEscalation': {},
                          'f:readOnlyRootFilesystem':   {}
                        },
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                       {},
                          'k:{"mountPath":"/cert"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {},
                            'f:readOnly':  {}
                          }
                        }
                      }
                    },
                    'f:dnsPolicy':       {},
                    'f:nodeSelector':    {},
                    'f:restartPolicy':   {},
                    'f:schedulerName':   {},
                    'f:securityContext': {
                      '.':              {},
                      'f:fsGroup':      {},
                      'f:runAsGroup':   {},
                      'f:runAsNonRoot': {},
                      'f:runAsUser':    {}
                    },
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {},
                    'f:volumes':                       {
                      '.':                       {},
                      'k:{"name":"tls-secret"}': {
                        '.':        {},
                        'f:name':   {},
                        'f:secret': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:secretName':  {}
                        }
                      }
                    }
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-30T20:59:38Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-06-19T15:42:49Z'
          }
        ],
        name:          'rancher-monitoring-operator',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-monitoring-system',
            rel:         'creates',
            selector:    'app=rancher-monitoring-operator,release=rancher-monitoring'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-admission',
            toType:  'secret',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-operator',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-operator-798d6f96b5',
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
        uid: '6c224dc8-332f-4ec6-b828-e01ff148d91a'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                {
          matchLabels: {
            app:     'rancher-monitoring-operator',
            release: 'rancher-monitoring'
          }
        },
        strategy: {
          rollingUpdate: {
            maxSurge:       '25%',
            maxUnavailable: '25%'
          },
          type: 'RollingUpdate'
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels:            {
              app:                            'rancher-monitoring-operator',
              'app.kubernetes.io/instance':   'rancher-monitoring',
              'app.kubernetes.io/managed-by': 'Helm',
              'app.kubernetes.io/part-of':    'rancher-monitoring',
              'app.kubernetes.io/version':    '102.0.1_up40.1.2',
              chart:                          'rancher-monitoring-102.0.1_up40.1.2',
              heritage:                       'Helm',
              release:                        'rancher-monitoring'
            }
          },
          spec: {
            containers: [
              {
                args: [
                  '--kubelet-service=kube-system/rancher-monitoring-kubelet',
                  '--localhost=127.0.0.1',
                  '--prometheus-config-reloader=rancher/mirrored-prometheus-operator-prometheus-config-reloader:v0.59.1',
                  '--config-reloader-cpu-request=200m',
                  '--config-reloader-cpu-limit=200m',
                  '--config-reloader-memory-request=50Mi',
                  '--config-reloader-memory-limit=50Mi',
                  '--thanos-default-base-image=rancher/mirrored-thanos-thanos:v0.28.0',
                  '--web.enable-tls=true',
                  '--web.cert-file=/cert/cert',
                  '--web.key-file=/cert/key',
                  '--web.listen-address=:8443',
                  '--web.tls-min-version=VersionTLS13'
                ],
                image:           'rancher/mirrored-prometheus-operator-prometheus-operator:v0.59.1',
                imagePullPolicy: 'IfNotPresent',
                name:            'rancher-monitoring',
                ports:           [
                  {
                    containerPort: 8443,
                    name:          'https',
                    protocol:      'TCP'
                  }
                ],
                resources: {
                  limits: {
                    cpu:    '200m',
                    memory: '500Mi'
                  },
                  requests: {
                    cpu:    '100m',
                    memory: '100Mi'
                  }
                },
                securityContext: {
                  allowPrivilegeEscalation: false,
                  readOnlyRootFilesystem:   true
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/cert',
                    name:      'tls-secret',
                    readOnly:  true
                  }
                ]
              }
            ],
            dnsPolicy:       'ClusterFirst',
            nodeSelector:    { 'kubernetes.io/os': 'linux' },
            restartPolicy:   'Always',
            schedulerName:   'default-scheduler',
            securityContext: {
              fsGroup:      65534,
              runAsGroup:   65534,
              runAsNonRoot: true,
              runAsUser:    65534
            },
            serviceAccount:                'rancher-monitoring-operator',
            serviceAccountName:            'rancher-monitoring-operator',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ],
            volumes: [
              {
                name:   'tls-secret',
                secret: {
                  defaultMode: 420,
                  secretName:  'rancher-monitoring-admission'
                }
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:38Z',
            lastUpdateTime:     '2023-05-30T20:59:45Z',
            message:            'ReplicaSet "rancher-monitoring-operator-798d6f96b5" has successfully progressed.',
            reason:             'NewReplicaSetAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Progressing'
          },
          {
            error:              false,
            lastTransitionTime: '2023-06-19T15:42:49Z',
            lastUpdateTime:     '2023-06-19T15:42:49Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          }
        ],
        observedGeneration: 1,
        readyReplicas:      1,
        replicas:           1,
        updatedReplicas:    1
      }
    },
    {
      id:    'cattle-monitoring-system/rancher-monitoring-prometheus-adapter',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-prometheus-adapter',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-prometheus-adapter',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-monitoring-system/rancher-monitoring-prometheus-adapter',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-monitoring-system/deployments/rancher-monitoring-prometheus-adapter'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'rancher-monitoring',
          'meta.helm.sh/release-namespace':    'cattle-monitoring-system'
        },
        creationTimestamp: '2023-05-30T20:59:38Z',
        fields:            [
          'rancher-monitoring-prometheus-adapter',
          '1/1',
          1,
          1,
          '19d',
          'prometheus-adapter',
          'rancher/mirrored-prometheus-adapter-prometheus-adapter:v0.10.0',
          'app.kubernetes.io/instance=rancher-monitoring,app.kubernetes.io/name=prometheus-adapter'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/component':  'metrics',
          'app.kubernetes.io/instance':   'rancher-monitoring',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'prometheus-adapter',
          'app.kubernetes.io/part-of':    'prometheus-adapter',
          'app.kubernetes.io/version':    'v0.10.0',
          'helm.sh/chart':                'prometheus-adapter-3.4.0'
        },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                  'f:helm.sh/chart':                {}
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
                    'f:annotations': {
                      '.':                 {},
                      'f:checksum/config': {}
                    },
                    'f:labels': {
                      '.':                              {},
                      'f:app.kubernetes.io/component':  {},
                      'f:app.kubernetes.io/instance':   {},
                      'f:app.kubernetes.io/managed-by': {},
                      'f:app.kubernetes.io/name':       {},
                      'f:app.kubernetes.io/part-of':    {},
                      'f:app.kubernetes.io/version':    {},
                      'f:helm.sh/chart':                {}
                    },
                    'f:name': {}
                  },
                  'f:spec': {
                    'f:affinity':   {},
                    'f:containers': {
                      'k:{"name":"prometheus-adapter"}': {
                        '.':                 {},
                        'f:args':            {},
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:livenessProbe':   {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:initialDelaySeconds': {},
                          'f:periodSeconds':       {},
                          'f:successThreshold':    {},
                          'f:timeoutSeconds':      {}
                        },
                        'f:name':  {},
                        'f:ports': {
                          '.':                                         {},
                          'k:{"containerPort":6443,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
                        'f:readinessProbe': {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:initialDelaySeconds': {},
                          'f:periodSeconds':       {},
                          'f:successThreshold':    {},
                          'f:timeoutSeconds':      {}
                        },
                        'f:resources':       {},
                        'f:securityContext': {
                          '.':                          {},
                          'f:allowPrivilegeEscalation': {},
                          'f:capabilities':             {
                            '.':      {},
                            'f:drop': {}
                          },
                          'f:readOnlyRootFilesystem': {},
                          'f:runAsNonRoot':           {},
                          'f:runAsUser':              {}
                        },
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                               {},
                          'k:{"mountPath":"/etc/adapter/"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {},
                            'f:readOnly':  {}
                          },
                          'k:{"mountPath":"/tmp"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      }
                    },
                    'f:dnsPolicy':       {},
                    'f:nodeSelector':    {},
                    'f:restartPolicy':   {},
                    'f:schedulerName':   {},
                    'f:securityContext': {
                      '.':         {},
                      'f:fsGroup': {}
                    },
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {},
                    'f:volumes':                       {
                      '.':                   {},
                      'k:{"name":"config"}': {
                        '.':           {},
                        'f:configMap': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:name':        {}
                        },
                        'f:name': {}
                      },
                      'k:{"name":"tmp"}': {
                        '.':          {},
                        'f:emptyDir': {},
                        'f:name':     {}
                      }
                    }
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-30T20:59:38Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-30T21:00:20Z'
          }
        ],
        name:          'rancher-monitoring-prometheus-adapter',
        namespace:     'cattle-monitoring-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-monitoring-system',
            rel:         'creates',
            selector:    'app.kubernetes.io/instance=rancher-monitoring,app.kubernetes.io/name=prometheus-adapter'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-prometheus-adapter',
            toType:  'configmap',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-prometheus-adapter',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-monitoring-system/rancher-monitoring-prometheus-adapter-7494f789f6',
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
        uid: 'f8dbcf90-54f4-444f-bb5f-ac2c9add3ee9'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                {
          matchLabels: {
            'app.kubernetes.io/instance': 'rancher-monitoring',
            'app.kubernetes.io/name':     'prometheus-adapter'
          }
        },
        strategy: {
          rollingUpdate: {
            maxSurge:       '25%',
            maxUnavailable: '25%'
          },
          type: 'RollingUpdate'
        },
        template: {
          metadata: {
            annotations:       { 'checksum/config': '8b3a7e2709a7c24b6233127e58df21fab763b6fed38cfc65b9b9da6e0dbc4f2d' },
            creationTimestamp: null,
            labels:            {
              'app.kubernetes.io/component':  'metrics',
              'app.kubernetes.io/instance':   'rancher-monitoring',
              'app.kubernetes.io/managed-by': 'Helm',
              'app.kubernetes.io/name':       'prometheus-adapter',
              'app.kubernetes.io/part-of':    'prometheus-adapter',
              'app.kubernetes.io/version':    'v0.10.0',
              'helm.sh/chart':                'prometheus-adapter-3.4.0'
            },
            name: 'prometheus-adapter'
          },
          spec: {
            affinity:   {},
            containers: [
              {
                args: [
                  '/adapter',
                  '--secure-port=6443',
                  '--cert-dir=/tmp/cert',
                  '--logtostderr=true',
                  '--prometheus-url=http://rancher-monitoring-prometheus.cattle-monitoring-system.svc:9090',
                  '--metrics-relist-interval=1m',
                  '--v=4',
                  '--config=/etc/adapter/config.yaml'
                ],
                image:           'rancher/mirrored-prometheus-adapter-prometheus-adapter:v0.10.0',
                imagePullPolicy: 'IfNotPresent',
                livenessProbe:   {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/healthz',
                    port:   'https',
                    scheme: 'HTTPS'
                  },
                  initialDelaySeconds: 30,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      5
                },
                name:  'prometheus-adapter',
                ports: [
                  {
                    containerPort: 6443,
                    name:          'https',
                    protocol:      'TCP'
                  }
                ],
                readinessProbe: {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/healthz',
                    port:   'https',
                    scheme: 'HTTPS'
                  },
                  initialDelaySeconds: 30,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      5
                },
                resources:       {},
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities:             {
                    drop: [
                      'all'
                    ]
                  },
                  readOnlyRootFilesystem: true,
                  runAsNonRoot:           true,
                  runAsUser:              10001
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/etc/adapter/',
                    name:      'config',
                    readOnly:  true
                  },
                  {
                    mountPath: '/tmp',
                    name:      'tmp'
                  }
                ]
              }
            ],
            dnsPolicy:                     'ClusterFirst',
            nodeSelector:                  { 'kubernetes.io/os': 'linux' },
            restartPolicy:                 'Always',
            schedulerName:                 'default-scheduler',
            securityContext:               { fsGroup: 10001 },
            serviceAccount:                'rancher-monitoring-prometheus-adapter',
            serviceAccountName:            'rancher-monitoring-prometheus-adapter',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ],
            volumes: [
              {
                configMap: {
                  defaultMode: 420,
                  name:        'rancher-monitoring-prometheus-adapter'
                },
                name: 'config'
              },
              {
                emptyDir: {},
                name:     'tmp'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-30T21:00:20Z',
            lastUpdateTime:     '2023-05-30T21:00:20Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-30T20:59:38Z',
            lastUpdateTime:     '2023-05-30T21:00:20Z',
            message:            'ReplicaSet "rancher-monitoring-prometheus-adapter-7494f789f6" has successfully progressed.',
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
    },
    {
      id:    'cattle-system/rancher-webhook',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-system/rancher-webhook',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-system/rancher-webhook',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-system/rancher-webhook',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-system/deployments/rancher-webhook'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'rancher-webhook',
          'meta.helm.sh/release-namespace':    'cattle-system'
        },
        creationTimestamp: '2023-05-29T13:33:19Z',
        fields:            [
          'rancher-webhook',
          '1/1',
          1,
          1,
          '21d',
          'rancher-webhook',
          'rancher/rancher-webhook:v0.3.5-rc6',
          'app=rancher-webhook'
        ],
        generation:    1,
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                  'f:app.kubernetes.io/managed-by': {}
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
                      '.':     {},
                      'f:app': {}
                    }
                  },
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"rancher-webhook"}': {
                        '.':     {},
                        'f:env': {
                          '.':                        {},
                          'k:{"name":"ENABLE_CAPI"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"ENABLE_MCM"}': {
                            '.':       {},
                            'f:name':  {},
                            'f:value': {}
                          },
                          'k:{"name":"NAMESPACE"}': {
                            '.':           {},
                            'f:name':      {},
                            'f:valueFrom': {
                              '.':          {},
                              'f:fieldRef': {}
                            }
                          },
                          'k:{"name":"STAMP"}': {
                            '.':      {},
                            'f:name': {}
                          }
                        },
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:livenessProbe':   {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:periodSeconds':    {},
                          'f:successThreshold': {},
                          'f:timeoutSeconds':   {}
                        },
                        'f:name':  {},
                        'f:ports': {
                          '.':                                         {},
                          'k:{"containerPort":8777,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          },
                          'k:{"containerPort":9443,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
                        'f:resources':    {},
                        'f:startupProbe': {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:periodSeconds':    {},
                          'f:successThreshold': {},
                          'f:timeoutSeconds':   {}
                        },
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                                                       {},
                          'k:{"mountPath":"/tmp/k8s-webhook-server/serving-certs"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {}
                          }
                        }
                      }
                    },
                    'f:dnsPolicy':                     {},
                    'f:nodeSelector':                  {},
                    'f:restartPolicy':                 {},
                    'f:schedulerName':                 {},
                    'f:securityContext':               {},
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {},
                    'f:volumes':                       {
                      '.':                {},
                      'k:{"name":"tls"}': {
                        '.':        {},
                        'f:name':   {},
                        'f:secret': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:secretName':  {}
                        }
                      }
                    }
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-05-29T13:33:19Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-30T16:08:21Z'
          }
        ],
        name:          'rancher-webhook',
        namespace:     'cattle-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-system',
            rel:         'creates',
            selector:    'app=rancher-webhook'
          },
          {
            toId:    'cattle-system/rancher-webhook-tls',
            toType:  'secret',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'cattle-system/rancher-webhook',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-system/rancher-webhook-7975cd746f',
            toType:  'apps.replicaset',
            rel:     'owner',
            state:   'active',
            message: 'ReplicaSet is available. Replicas: 1'
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
          message:       'Deployment is available. Replicas: 1',
          name:          'active',
          transitioning: false
        },
        uid: 'f440c5f1-29cd-4bc0-bd51-48de1f18f84b'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                { matchLabels: { app: 'rancher-webhook' } },
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
            labels:            { app: 'rancher-webhook' }
          },
          spec: {
            containers: [
              {
                env: [
                  { name: 'STAMP' },
                  {
                    name:  'ENABLE_CAPI',
                    value: 'true'
                  },
                  {
                    name:  'ENABLE_MCM',
                    value: 'true'
                  },
                  {
                    name:      'NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      }
                    }
                  }
                ],
                image:           'rancher/rancher-webhook:v0.3.5-rc6',
                imagePullPolicy: 'IfNotPresent',
                livenessProbe:   {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/healthz',
                    port:   'https',
                    scheme: 'HTTPS'
                  },
                  periodSeconds:    5,
                  successThreshold: 1,
                  timeoutSeconds:   1
                },
                name:  'rancher-webhook',
                ports: [
                  {
                    containerPort: 9443,
                    name:          'https',
                    protocol:      'TCP'
                  },
                  {
                    containerPort: 8777,
                    name:          'capi-https',
                    protocol:      'TCP'
                  }
                ],
                resources:    {},
                startupProbe: {
                  failureThreshold: 60,
                  httpGet:          {
                    path:   '/healthz',
                    port:   'https',
                    scheme: 'HTTPS'
                  },
                  periodSeconds:    5,
                  successThreshold: 1,
                  timeoutSeconds:   1
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/tmp/k8s-webhook-server/serving-certs',
                    name:      'tls'
                  }
                ]
              }
            ],
            dnsPolicy:                     'ClusterFirst',
            nodeSelector:                  { 'kubernetes.io/os': 'linux' },
            restartPolicy:                 'Always',
            schedulerName:                 'default-scheduler',
            securityContext:               {},
            serviceAccount:                'rancher-webhook',
            serviceAccountName:            'rancher-webhook',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ],
            volumes: [
              {
                name:   'tls',
                secret: {
                  defaultMode: 420,
                  secretName:  'rancher-webhook-tls'
                }
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:33:19Z',
            lastUpdateTime:     '2023-05-29T13:33:41Z',
            message:            'ReplicaSet "rancher-webhook-7975cd746f" has successfully progressed.',
            reason:             'NewReplicaSetAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Progressing'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-30T16:08:21Z',
            lastUpdateTime:     '2023-05-30T16:08:21Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          }
        ],
        observedGeneration: 1,
        readyReplicas:      1,
        replicas:           1,
        updatedReplicas:    1
      }
    },
    {
      id:    'cattle-ui-plugin-system/ui-plugin-operator',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/cattle-ui-plugin-system/ui-plugin-operator',
        self:   'https://localhost:8005/v1/apps.deployments/cattle-ui-plugin-system/ui-plugin-operator',
        update: 'https://localhost:8005/v1/apps.deployments/cattle-ui-plugin-system/ui-plugin-operator',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/cattle-ui-plugin-system/deployments/ui-plugin-operator'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'meta.helm.sh/release-name':         'ui-plugin-operator',
          'meta.helm.sh/release-namespace':    'cattle-ui-plugin-system'
        },
        creationTimestamp: '2023-06-19T12:29:03Z',
        fields:            [
          'ui-plugin-operator',
          '1/1',
          1,
          1,
          '3h21m',
          'ui-plugin-operator',
          'rancher/ui-plugin-operator:v0.1.1',
          'app.kubernetes.io/instance=ui-plugin-operator,app.kubernetes.io/name=ui-plugin-operator'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/instance':   'ui-plugin-operator',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'ui-plugin-operator',
          'app.kubernetes.io/version':    '0.1.1',
          'helm.sh/chart':                'ui-plugin-operator-102.0.1_up0.2.1'
        },
        managedFields: [
          {
            apiVersion: 'apps/v1',
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
                      '.':                            {},
                      'f:app.kubernetes.io/instance': {},
                      'f:app.kubernetes.io/name':     {}
                    }
                  },
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"ui-plugin-operator"}': {
                        '.':                 {},
                        'f:args':            {},
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:name':            {},
                        'f:ports':           {
                          '.':                                       {},
                          'k:{"containerPort":80,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
                        'f:resources':       {},
                        'f:securityContext': {
                          '.':              {},
                          'f:runAsNonRoot': {},
                          'f:runAsUser':    {}
                        },
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {}
                      }
                    },
                    'f:dnsPolicy':                     {},
                    'f:nodeSelector':                  {},
                    'f:restartPolicy':                 {},
                    'f:schedulerName':                 {},
                    'f:securityContext':               {},
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {}
                  }
                }
              }
            },
            manager:   'helm',
            operation: 'Update',
            time:      '2023-06-19T12:29:03Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-06-19T12:29:08Z'
          }
        ],
        name:          'ui-plugin-operator',
        namespace:     'cattle-ui-plugin-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'cattle-ui-plugin-system',
            rel:         'creates',
            selector:    'app.kubernetes.io/instance=ui-plugin-operator,app.kubernetes.io/name=ui-plugin-operator'
          },
          {
            toId:    'cattle-ui-plugin-system/ui-plugin-operator',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            fromId:   'cattle-ui-plugin-system/ui-plugin-operator',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          },
          {
            toId:    'cattle-ui-plugin-system/ui-plugin-operator-7584497fdc',
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
        uid: '7a4f1d2a-ce7d-476b-b19b-ef12974202f2'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    10,
        selector:                {
          matchLabels: {
            'app.kubernetes.io/instance': 'ui-plugin-operator',
            'app.kubernetes.io/name':     'ui-plugin-operator'
          }
        },
        strategy: {
          rollingUpdate: {
            maxSurge:       '25%',
            maxUnavailable: '25%'
          },
          type: 'RollingUpdate'
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels:            {
              'app.kubernetes.io/instance': 'ui-plugin-operator',
              'app.kubernetes.io/name':     'ui-plugin-operator'
            }
          },
          spec: {
            containers: [
              {
                args: [
                  'ui-plugin-operator'
                ],
                image:           'rancher/ui-plugin-operator:v0.1.1',
                imagePullPolicy: 'Always',
                name:            'ui-plugin-operator',
                ports:           [
                  {
                    containerPort: 80,
                    name:          'http',
                    protocol:      'TCP'
                  }
                ],
                resources:       {},
                securityContext: {
                  runAsNonRoot: true,
                  runAsUser:    1000
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File'
              }
            ],
            dnsPolicy:                     'ClusterFirst',
            nodeSelector:                  { 'kubernetes.io/os': 'linux' },
            restartPolicy:                 'Always',
            schedulerName:                 'default-scheduler',
            securityContext:               {},
            serviceAccount:                'ui-plugin-operator',
            serviceAccountName:            'ui-plugin-operator',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                effect:   'NoSchedule',
                key:      'cattle.io/os',
                operator: 'Equal',
                value:    'linux'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-06-19T12:29:08Z',
            lastUpdateTime:     '2023-06-19T12:29:08Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-06-19T12:29:03Z',
            lastUpdateTime:     '2023-06-19T12:29:08Z',
            message:            'ReplicaSet "ui-plugin-operator-7584497fdc" has successfully progressed.',
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
    },

    {
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
          '0/1',
          1,
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
                'f:annotations': {
                  '.':                                   {},
                  'f:deployment.kubernetes.io/revision': {}
                }
              },
              'f:status': {
                'f:conditions': {
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
                'f:observedGeneration':  {},
                'f:replicas':            {},
                'f:unavailableReplicas': {},
                'f:updatedReplicas':     {}
              }
            },
            manager:     'k3s',
            operation:   'Update',
            subresource: 'status',
            time:        '2023-06-19T15:51:02Z'
          },
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
          },
          {
            toId:          'default/test-deployment-b97b798c8',
            toType:        'apps.replicaset',
            rel:           'owner',
            state:         'in-progress',
            message:       'Available: 0/1',
            transitioning: true
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Deployment does not have minimum availability.',
          name:          'updating',
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
      status: {
        conditions: [
          {
            error:              false,
            lastTransitionTime: '2023-06-19T15:51:02Z',
            lastUpdateTime:     '2023-06-19T15:51:02Z',
            message:            'Deployment does not have minimum availability.',
            reason:             'MinimumReplicasUnavailable',
            status:             'False',
            transitioning:      true,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-06-19T15:51:02Z',
            lastUpdateTime:     '2023-06-19T15:51:02Z',
            message:            'ReplicaSet "test-deployment-b97b798c8" is progressing.',
            reason:             'ReplicaSetUpdated',
            status:             'True',
            transitioning:      false,
            type:               'Progressing'
          }
        ],
        observedGeneration:  1,
        replicas:            1,
        unavailableReplicas: 1,
        updatedReplicas:     1
      }
    },
    {
      id:    'kube-system/coredns',
      links: {
        remove: 'https://localhost:8005/v1/apps.deployments/kube-system/coredns',
        self:   'https://localhost:8005/v1/apps.deployments/kube-system/coredns',
        update: 'https://localhost:8005/v1/apps.deployments/kube-system/coredns',
        view:   'https://localhost:8005/apis/apps/v1/namespaces/kube-system/deployments/coredns'
      },
      apiVersion: 'apps/v1',
      kind:       'Deployment',
      metadata:   {
        annotations: {
          'deployment.kubernetes.io/revision':       '1',
          'objectset.rio.cattle.io/applied':         'H4sIAAAAAAAA/6xVQW/bOBP9Kx/mLMVW0jaugO/QtbPboq3XqJNeCqOgqZHFNcXhkiMnRqD/vhjJduw2TdrFniyTb4ZvHucN70F58xlDNOQgB+V9HGwySGBtXAE5TNBb2tboGBKokVWhWEF+D8o5YsWGXJS/tPwLNUfks2DoTCtmi2eGBkaSQPLDfbp1GNLVZg05rC/i0c4mS/733rji/2+KgtyzKZyqEXLQFLBw8afg0SstMetmiWncRsYa2gSsWqLtilqPYqq830P6vPIZHDJGybY7dkwBJ9P5E8dWKlaQw1Lj+eji/PVolGWXLy7U8GL0Si1fZsPyvHx1ieXli/MXQ/3yUoh8V9ITpKNHLZQDbozc5VsTmcL2g6kNQz5MIKJFzRQEVCvW1YenymwlJQfFuNp2acla41Y3vlCMfYq7G6c2yli1tAh51ibAWy/MPp1gZR1rb/dxRy30pNDtUVGaHCvjMETIv9yDCiv5gFSTKyGBAbIe7FQayE2UxiIsEjC1WgmjoJyuMAxqE4LA0h14/5tnZ9nwTLq+i5g11s7IGr2FHN6VU+JZwNhbwJoNOoxxFmjZFVQqY5uA11XAWJEtIL9IoGL2fyDLvlcs9z6oUFmuIAFPgSEfDUdyKbrC7o7fXl/PRCrjDBtlJ2jVdo6aXBEhfzVMwGMwVByWMglutMYYj07OEmBTIzX8AHysj4RCL+VB2VnH6uXFAb1DBmLSZCGHm4kwfCYkZe1Pw67Hj4a9zo4Ca+RgdHwkcJFAQFWYfyW5RG4fFM9G2c8q/r3g57+gd8BITdDYtbYVB8a+9WsK0lLZ5fCjgQ74d4Ox39W+ka3hsO4G7Q7aI8UKqJtgeDsmx3jXlamspdtZMBtjcYVXUSvbzWPIS2UjJqCVV0tjDZueiioKsc306vrrb++mk6/zq0+f342vxClFIC97ylpYtL3ofzq7/UTEvxuLu0GTc2iwTWBDtqnxIzVu10e1fM52uh/ZEY66z5VmlfaR8HDCPuePcwx0E5nqo1Td//SZjAtpnsLFg5MnWKrGiokdFTg/moenI50i5GCNa+7kjnww1AlvVYzTnkCvRqptExlDqoNho5UFuaawMRrfaC3FTL81HpPFsH80v9zDGoXYeBffPXSxKyEB8oIUfnB1Z6RJRCMsS9QMOUxprissGiuV92mkqjSQxbPTesR5gWzqrXL4n2auldT/eMqFVOvJ0mo793I1Y3Lyoph9y3TTf/7Lr1Kt7uZrvO3NtzvgfcfylFtFkbt+SeC2QnfjomITS9M/VzChKfGhUGHb99FhLJZm9VF5IWIY65Pr2r8wyX7SHFZEyB40pQLfkihxQD0syXHfDOX2B0bZjc4HNqdx6cEb5KWtlD149CmztIu2bdt/AgAA//+BDg8J/AkAAA',
          'objectset.rio.cattle.io/id':              '',
          'objectset.rio.cattle.io/owner-gvk':       'k3s.cattle.io/v1, Kind=Addon',
          'objectset.rio.cattle.io/owner-name':      'coredns',
          'objectset.rio.cattle.io/owner-namespace': 'kube-system'
        },
        creationTimestamp: '2023-05-29T13:32:00Z',
        fields:            [
          'coredns',
          '1/1',
          1,
          1,
          '21d',
          'coredns',
          'rancher/mirrored-coredns-coredns:1.10.1',
          'k8s-app=kube-dns'
        ],
        generation: 1,
        labels:     {
          'k8s-app':                      'kube-dns',
          'kubernetes.io/name':           'CoreDNS',
          'objectset.rio.cattle.io/hash': 'bce283298811743a0386ab510f2f67ef74240c57'
        },
        managedFields: [
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:annotations': {
                  '.':                                         {},
                  'f:objectset.rio.cattle.io/applied':         {},
                  'f:objectset.rio.cattle.io/id':              {},
                  'f:objectset.rio.cattle.io/owner-gvk':       {},
                  'f:objectset.rio.cattle.io/owner-name':      {},
                  'f:objectset.rio.cattle.io/owner-namespace': {}
                },
                'f:labels': {
                  '.':                              {},
                  'f:k8s-app':                      {},
                  'f:kubernetes.io/name':           {},
                  'f:objectset.rio.cattle.io/hash': {}
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
                      '.':         {},
                      'f:k8s-app': {}
                    }
                  },
                  'f:spec': {
                    'f:containers': {
                      'k:{"name":"coredns"}': {
                        '.':                 {},
                        'f:args':            {},
                        'f:image':           {},
                        'f:imagePullPolicy': {},
                        'f:livenessProbe':   {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:initialDelaySeconds': {},
                          'f:periodSeconds':       {},
                          'f:successThreshold':    {},
                          'f:timeoutSeconds':      {}
                        },
                        'f:name':  {},
                        'f:ports': {
                          '.':                                       {},
                          'k:{"containerPort":53,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          },
                          'k:{"containerPort":53,"protocol":"UDP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          },
                          'k:{"containerPort":9153,"protocol":"TCP"}': {
                            '.':               {},
                            'f:containerPort': {},
                            'f:name':          {},
                            'f:protocol':      {}
                          }
                        },
                        'f:readinessProbe': {
                          '.':                  {},
                          'f:failureThreshold': {},
                          'f:httpGet':          {
                            '.':        {},
                            'f:path':   {},
                            'f:port':   {},
                            'f:scheme': {}
                          },
                          'f:periodSeconds':    {},
                          'f:successThreshold': {},
                          'f:timeoutSeconds':   {}
                        },
                        'f:resources': {
                          '.':        {},
                          'f:limits': {
                            '.':        {},
                            'f:memory': {}
                          },
                          'f:requests': {
                            '.':        {},
                            'f:cpu':    {},
                            'f:memory': {}
                          }
                        },
                        'f:securityContext': {
                          '.':                          {},
                          'f:allowPrivilegeEscalation': {},
                          'f:capabilities':             {
                            '.':      {},
                            'f:add':  {},
                            'f:drop': {}
                          },
                          'f:readOnlyRootFilesystem': {}
                        },
                        'f:terminationMessagePath':   {},
                        'f:terminationMessagePolicy': {},
                        'f:volumeMounts':             {
                          '.':                              {},
                          'k:{"mountPath":"/etc/coredns"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {},
                            'f:readOnly':  {}
                          },
                          'k:{"mountPath":"/etc/coredns/custom"}': {
                            '.':           {},
                            'f:mountPath': {},
                            'f:name':      {},
                            'f:readOnly':  {}
                          }
                        }
                      }
                    },
                    'f:dnsPolicy':                     {},
                    'f:nodeSelector':                  {},
                    'f:priorityClassName':             {},
                    'f:restartPolicy':                 {},
                    'f:schedulerName':                 {},
                    'f:securityContext':               {},
                    'f:serviceAccount':                {},
                    'f:serviceAccountName':            {},
                    'f:terminationGracePeriodSeconds': {},
                    'f:tolerations':                   {},
                    'f:topologySpreadConstraints':     {
                      '.':                                                                              {},
                      'k:{"topologyKey":"kubernetes.io/hostname","whenUnsatisfiable":"DoNotSchedule"}': {
                        '.':                   {},
                        'f:labelSelector':     {},
                        'f:maxSkew':           {},
                        'f:topologyKey':       {},
                        'f:whenUnsatisfiable': {}
                      }
                    },
                    'f:volumes': {
                      '.':                          {},
                      'k:{"name":"config-volume"}': {
                        '.':           {},
                        'f:configMap': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:items':       {},
                          'f:name':        {}
                        },
                        'f:name': {}
                      },
                      'k:{"name":"custom-config-volume"}': {
                        '.':           {},
                        'f:configMap': {
                          '.':             {},
                          'f:defaultMode': {},
                          'f:name':        {},
                          'f:optional':    {}
                        },
                        'f:name': {}
                      }
                    }
                  }
                }
              }
            },
            manager:   'deploy@local-node',
            operation: 'Update',
            time:      '2023-05-29T13:32:00Z'
          },
          {
            apiVersion: 'apps/v1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:annotations': { 'f:deployment.kubernetes.io/revision': {} } },
              'f:status':   {
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
            time:        '2023-05-29T13:32:26Z'
          }
        ],
        name:          'coredns',
        namespace:     'kube-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'kube-system',
            rel:         'creates',
            selector:    'k8s-app=kube-dns'
          },
          {
            toId:    'kube-system/coredns',
            toType:  'configmap',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:   'kube-system/coredns-custom',
            toType: 'configmap',
            rel:    'uses'
          },
          {
            toId:    'kube-system/coredns',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            fromId:   'kube-system/coredns',
            fromType: 'k3s.cattle.io.addon',
            rel:      'applies',
            state:    'active',
            message:  'Resource is current'
          },
          {
            toId:    'kube-system/coredns-59b4f5bbd5',
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
        uid: '2ac3144c-38d6-4530-937b-fc14d04c4624'
      },
      spec: {
        progressDeadlineSeconds: 600,
        replicas:                1,
        revisionHistoryLimit:    0,
        selector:                { matchLabels: { 'k8s-app': 'kube-dns' } },
        strategy:                {
          rollingUpdate: {
            maxSurge:       '25%',
            maxUnavailable: 1
          },
          type: 'RollingUpdate'
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels:            { 'k8s-app': 'kube-dns' }
          },
          spec: {
            containers: [
              {
                args: [
                  '-conf',
                  '/etc/coredns/Corefile'
                ],
                image:           'rancher/mirrored-coredns-coredns:1.10.1',
                imagePullPolicy: 'IfNotPresent',
                livenessProbe:   {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/health',
                    port:   8080,
                    scheme: 'HTTP'
                  },
                  initialDelaySeconds: 60,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      1
                },
                name:  'coredns',
                ports: [
                  {
                    containerPort: 53,
                    name:          'dns',
                    protocol:      'UDP'
                  },
                  {
                    containerPort: 53,
                    name:          'dns-tcp',
                    protocol:      'TCP'
                  },
                  {
                    containerPort: 9153,
                    name:          'metrics',
                    protocol:      'TCP'
                  }
                ],
                readinessProbe: {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/ready',
                    port:   8181,
                    scheme: 'HTTP'
                  },
                  periodSeconds:    2,
                  successThreshold: 1,
                  timeoutSeconds:   1
                },
                resources: {
                  limits:   { memory: '170Mi' },
                  requests: {
                    cpu:    '100m',
                    memory: '70Mi'
                  }
                },
                securityContext: {
                  allowPrivilegeEscalation: false,
                  capabilities:             {
                    add: [
                      'NET_BIND_SERVICE'
                    ],
                    drop: [
                      'all'
                    ]
                  },
                  readOnlyRootFilesystem: true
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/etc/coredns',
                    name:      'config-volume',
                    readOnly:  true
                  },
                  {
                    mountPath: '/etc/coredns/custom',
                    name:      'custom-config-volume',
                    readOnly:  true
                  }
                ]
              }
            ],
            dnsPolicy:                     'Default',
            nodeSelector:                  { 'kubernetes.io/os': 'linux' },
            priorityClassName:             'system-cluster-critical',
            restartPolicy:                 'Always',
            schedulerName:                 'default-scheduler',
            securityContext:               {},
            serviceAccount:                'coredns',
            serviceAccountName:            'coredns',
            terminationGracePeriodSeconds: 30,
            tolerations:                   [
              {
                key:      'CriticalAddonsOnly',
                operator: 'Exists'
              },
              {
                effect:   'NoSchedule',
                key:      'node-role.kubernetes.io/control-plane',
                operator: 'Exists'
              },
              {
                effect:   'NoSchedule',
                key:      'node-role.kubernetes.io/master',
                operator: 'Exists'
              }
            ],
            topologySpreadConstraints: [
              {
                labelSelector:     { matchLabels: { 'k8s-app': 'kube-dns' } },
                maxSkew:           1,
                topologyKey:       'kubernetes.io/hostname',
                whenUnsatisfiable: 'DoNotSchedule'
              }
            ],
            volumes: [
              {
                configMap: {
                  defaultMode: 420,
                  items:       [
                    {
                      key:  'Corefile',
                      path: 'Corefile'
                    },
                    {
                      key:  'NodeHosts',
                      path: 'NodeHosts'
                    }
                  ],
                  name: 'coredns'
                },
                name: 'config-volume'
              },
              {
                configMap: {
                  defaultMode: 420,
                  name:        'coredns-custom',
                  optional:    true
                },
                name: 'custom-config-volume'
              }
            ]
          }
        }
      },
      status: {
        availableReplicas: 1,
        conditions:        [
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:32:12Z',
            lastUpdateTime:     '2023-05-29T13:32:12Z',
            message:            'Deployment has minimum availability.',
            reason:             'MinimumReplicasAvailable',
            status:             'True',
            transitioning:      false,
            type:               'Available'
          },
          {
            error:              false,
            lastTransitionTime: '2023-05-29T13:32:12Z',
            lastUpdateTime:     '2023-05-29T13:32:26Z',
            message:            'ReplicaSet "coredns-59b4f5bbd5" has successfully progressed.',
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
    },
  ]
};
