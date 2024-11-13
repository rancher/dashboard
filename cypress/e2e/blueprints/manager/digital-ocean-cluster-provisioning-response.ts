import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

export function clusterProvDigitalOceanSingleResponse(clusterName: string, cloudCredName: string, machinePoolId: string):object {
  return {
    type:         'collection',
    links:        { self: 'https://localhost:8005/v1/provisioning.cattle.io.clusters' },
    createTypes:  { 'provisioning.cattle.io.cluster': 'https://localhost:8005/v1/provisioning.cattle.io.clusters' },
    actions:      {},
    resourceType: 'provisioning.cattle.io.cluster',
    revision:     CYPRESS_SAFE_RESOURCE_REVISION,
    count:        9,
    data:         [
      {
        id:    `fleet-default/${ clusterName }`,
        type:  'provisioning.cattle.io.cluster',
        links: {
          remove: `https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/${ clusterName }`,
          self:   `https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/${ clusterName }`,
          update: `https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/${ clusterName }`,
          view:   `https://localhost:8005/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/${ clusterName }`
        },
        apiVersion: 'provisioning.cattle.io/v1',
        kind:       'Cluster',
        metadata:   {
          annotations:       { 'field.cattle.io/creatorId': 'user-x7q4j' },
          creationTimestamp: '2024-01-05T14:44:50Z',
          fields:            [
            `${ clusterName }`,
            'true',
            `${ clusterName }-kubeconfig`
          ],
          finalizers: [
            'wrangler.cattle.io/provisioning-cluster-remove',
            'wrangler.cattle.io/rke-cluster-remove',
            'wrangler.cattle.io/cloud-config-secret-remover'
          ],
          generation:    3,
          name:          `${ clusterName }`,
          namespace:     'fleet-default',
          relationships: [
            {
              toId:    `fleet-default/r-cluster-${ clusterName }-view-p-lnjgz-creator-proje-67ac2`,
              toType:  'rbac.authorization.k8s.io.rolebinding',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `fleet-default/crt-${ clusterName }-nodes-manage`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `fleet-default/crt-${ clusterName }-cluster-owner`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:   `fleet-default/${ clusterName }-managed-system-upgrad-53adc`,
              toType: 'management.cattle.io.managedchart',
              rel:    'owner',
              state:  'waitapplied'
            },
            {
              toId:    `fleet-default/r-cluster-${ clusterName }-view`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `fleet-default/crt-${ clusterName }-nodes-view`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `fleet-default/crt-${ clusterName }-cluster-admin`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `fleet-default/nc-${ clusterName }-pool1-${ machinePoolId }`,
              toType:  'rke-machine-config.cattle.io.digitaloceanconfig',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    'c-m-fbr46mrq/c-m-fbr46mrq-fleet-default-owner',
              toType:  'management.cattle.io.clusterroletemplatebinding',
              rel:     'applies',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:   `fleet-default/${ clusterName }`,
              toType: 'cluster.x-k8s.io.cluster',
              rel:    'owner',
              state:  'provisioned'
            },
            {
              toId:   `fleet-default/${ clusterName }`,
              toType: 'fleet.cattle.io.cluster',
              rel:    'applies',
              state:  'waitcheckin'
            },
            {
              toId:    'c-m-fbr46mrq',
              toType:  'management.cattle.io.cluster',
              rel:     'applies',
              state:   'active',
              message: 'Resource is Ready'
            },
            {
              toId:    `fleet-default/crt-${ clusterName }-cluster-member`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:   `fleet-default/${ clusterName }-managed-system-agent`,
              toType: 'fleet.cattle.io.bundle',
              rel:    'owner',
              state:  'waitapplied'
            },
            {
              toId:    `fleet-default/r-cluster-${ clusterName }-view-p-d27qf-creator-proje-e42dc`,
              toType:  'rbac.authorization.k8s.io.rolebinding',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `fleet-default/${ clusterName }-kubeconfig`,
              toType:  'secret',
              rel:     'owner',
              state:   'active',
              message: 'Resource is always ready'
            }
          ],
          resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
          state:           {
            error:         false,
            message:       'Resource is Ready',
            name:          'active',
            transitioning: false
          },
          uid: '99c1559a-9c6d-498b-9c8a-6735f9dd1e28'
        },
        spec: {
          cloudCredentialSecretName: cloudCredName,
          kubernetesVersion:         'v1.26.11+rke2r1',
          localClusterAuthEndpoint:  {},
          rkeConfig:                 {
            chartValues: { 'rke2-calico': {} },
            etcd:        {
              snapshotRetention:    5,
              snapshotScheduleCron: '0 */5 * * *'
            },
            machineGlobalConfig: {
              cni:                   'calico',
              'disable-kube-proxy':  false,
              'etcd-expose-metrics': false
            },
            machinePoolDefaults: {},
            machinePools:        [
              {
                controlPlaneRole:  true,
                drainBeforeDelete: true,
                dynamicSchemaSpec: '{"resourceFields":{"accessToken":{"type":"password","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Digital Ocean access token"},"backups":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"enable backups for droplet"},"image":{"type":"string","default":{"stringValue":"ubuntu-20-04-x64","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Digital Ocean Image"},"ipv6":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"enable ipv6 for droplet"},"monitoring":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"enable monitoring for droplet"},"privateNetworking":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"enable private networking for droplet"},"region":{"type":"string","default":{"stringValue":"nyc3","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Digital Ocean region"},"size":{"type":"string","default":{"stringValue":"s-1vcpu-1gb","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Digital Ocean size"},"sshKeyContents":{"type":"password","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"File contents for sshKeyContents"},"sshKeyFingerprint":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"SSH key fingerprint"},"sshPort":{"type":"string","default":{"stringValue":"22","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"SSH port"},"sshUser":{"type":"string","default":{"stringValue":"root","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"SSH username"},"tags":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"comma-separated list of tags to apply to the Droplet"},"userdata":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"File contents for userdata"}}}',
                etcdRole:          true,
                machineConfigRef:  {
                  kind: 'DigitaloceanConfig',
                  name: `nc-${ clusterName }-pool1-${ machinePoolId }`
                },
                name:                 'pool1',
                quantity:             1,
                unhealthyNodeTimeout: '0s',
                workerRole:           true
              }
            ],
            machineSelectorConfig: [
              { config: { 'protect-kernel-defaults': false } }
            ],
            registries:      {},
            upgradeStrategy: {
              controlPlaneConcurrency:  '1',
              controlPlaneDrainOptions: {
                deleteEmptyDirData:              true,
                disableEviction:                 false,
                enabled:                         false,
                force:                           false,
                gracePeriod:                     -1,
                ignoreDaemonSets:                true,
                ignoreErrors:                    false,
                postDrainHooks:                  null,
                preDrainHooks:                   null,
                skipWaitForDeleteTimeoutSeconds: 0,
                timeout:                         120
              },
              workerConcurrency:  '1',
              workerDrainOptions: {
                deleteEmptyDirData:              true,
                disableEviction:                 false,
                enabled:                         false,
                force:                           false,
                gracePeriod:                     -1,
                ignoreDaemonSets:                true,
                ignoreErrors:                    false,
                postDrainHooks:                  null,
                preDrainHooks:                   null,
                skipWaitForDeleteTimeoutSeconds: 0,
                timeout:                         120
              }
            }
          }
        },
        status: {
          agentDeployed:    true,
          clientSecretName: `${ clusterName }-kubeconfig`,
          clusterName:      'c-m-fbr46mrq',
          conditions:       [
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:50:35Z',
              status:         'False',
              transitioning:  false,
              type:           'Reconciling'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:44:50Z',
              status:         'False',
              transitioning:  false,
              type:           'Stalled'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:52:36Z',
              status:         'True',
              transitioning:  false,
              type:           'Created'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:51:48Z',
              status:         'True',
              transitioning:  false,
              type:           'RKECluster'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:50:23Z',
              status:         'True',
              transitioning:  false,
              type:           'Connected'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:44:56Z',
              status:         'True',
              transitioning:  false,
              type:           'BackingNamespaceCreated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:44:56Z',
              status:         'True',
              transitioning:  false,
              type:           'DefaultProjectCreated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:44:56Z',
              status:         'True',
              transitioning:  false,
              type:           'SystemProjectCreated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:44:57Z',
              status:         'True',
              transitioning:  false,
              type:           'InitialRolesPopulated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:51:40Z',
              status:         'True',
              transitioning:  false,
              type:           'Updated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:51:40Z',
              status:         'True',
              transitioning:  false,
              type:           'Provisioned'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:51:40Z',
              status:         'True',
              transitioning:  false,
              type:           'Ready'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:45:05Z',
              status:         'True',
              transitioning:  false,
              type:           'CreatorMadeOwner'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:45:20Z',
              status:         'True',
              transitioning:  false,
              type:           'NoDiskPressure'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:45:20Z',
              status:         'True',
              transitioning:  false,
              type:           'NoMemoryPressure'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:45:23Z',
              status:         'True',
              transitioning:  false,
              type:           'SecretsMigrated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:45:25Z',
              status:         'True',
              transitioning:  false,
              type:           'ServiceAccountSecretsMigrated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:45:28Z',
              status:         'True',
              transitioning:  false,
              type:           'RKESecretsMigrated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:45:32Z',
              status:         'True',
              transitioning:  false,
              type:           'ACISecretsMigrated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:50:01Z',
              status:         'True',
              transitioning:  false,
              type:           'GlobalAdminsSynced'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:50:29Z',
              status:         'True',
              transitioning:  false,
              type:           'Waiting'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:52:14Z',
              status:         'True',
              transitioning:  false,
              type:           'SystemAccountCreated'
            },
            {
              error:          false,
              lastUpdateTime: '2024-01-05T14:52:31Z',
              status:         'True',
              transitioning:  false,
              type:           'AgentDeployed'
            }
          ],
          observedGeneration: 3,
          ready:              true
        }
      }
    ]
  };
}
