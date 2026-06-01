import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

const namespace = 'fleet-default';

/**
 * Linked with clusterProvDigitalOceanSingleResponse
 */
export function clusterMgmtDigitalOceanSingleResponse(clusterName: string): object {
  return {
    type:         'collection',
    links:        { self: 'https://localhost:8005/v1/management.cattle.io.clusters' },
    actions:      {},
    resourceType: 'management.cattle.io.cluster',
    revision:     CYPRESS_SAFE_RESOURCE_REVISION,
    count:        1,
    data:         [{
      id:    `${ clusterName }`,
      type:  'management.cattle.io.cluster',
      links: {
        log:       `https://localhost:8005/v1/management.cattle.io.clusters/${ clusterName }?link=log`,
        patch:     'blocked',
        projects:  `https://localhost:8005/v1/management.cattle.io.clusters/${ clusterName }?link=projects`,
        remove:    'blocked',
        schemas:   `https://localhost:8005/v1/management.cattle.io.clusters/${ clusterName }?link=schemas`,
        self:      `https://localhost:8005/v1/management.cattle.io.clusters/${ clusterName }`,
        shell:     `wss://localhost/v3/clusters/${ clusterName }?shell=true`,
        subscribe: `https://localhost:8005/v1/management.cattle.io.clusters/${ clusterName }?link=subscribe`,
        update:    'blocked',
        view:      `https://localhost:8005/v1/management.cattle.io.clusters/${ clusterName }`
      },
      action:     {},
      apiVersion: 'management.cattle.io/v3',
      kind:       'Cluster',
      metadata:   {
        annotations:       {},
        creationTimestamp: '2024-01-05T14:44:50Z',
        name:              `${ clusterName }`,
        labels:            {},
        relationships:     [{
          toId:    `${ namespace }/${ clusterName }`,
          toType:  'provisioning.cattle.io.cluster',
          rel:     'applies',
          state:   'active',
          message: 'Resource is current'
        }],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'Active',
          transitioning: false
        },
        uid: '7623f2b5-1003-49c9-a21d-6cae3622a3bc',
      },
      spec:   { displayName: `${ clusterName }` },
      status: {
        driver: 'digitalocean',
        info:   {
          arch:                   'amd64',
          kubernetesVersion:      'v1.35.3+rke2r3',
          machineProvider:        'Digitalocean',
          nodeCount:              2,
          provisioningClusterRef: {
            apiVersion: 'provisioning.cattle.io/v1',
            kind:       'Cluster',
            name:       `${ clusterName }`,
            namespace:  `${ namespace }`
          }
        },
        provider: 'rke2'
      },
    }],
  };
}

/**
 * Linked with clusterMgmtDigitalOceanSingleResponse
 */
export function clusterProvDigitalOceanSingleResponse(clusterName: string, cloudCredName: string, machinePoolId: string): object {
  return {
    id:           `${ namespace }/${ clusterName }`,
    type:         'collection',
    links:        { self: 'https://localhost:8005/v1/provisioning.cattle.io.clusters' },
    createTypes:  { 'provisioning.cattle.io.cluster': 'https://localhost:8005/v1/provisioning.cattle.io.clusters' },
    actions:      {},
    resourceType: 'provisioning.cattle.io.cluster',
    revision:     CYPRESS_SAFE_RESOURCE_REVISION,
    count:        1,
    data:         [
      {
        id:    `${ namespace }/${ clusterName }`,
        type:  'provisioning.cattle.io.cluster',
        links: {
          remove: `https://localhost:8005/v1/provisioning.cattle.io.clusters/${ namespace }/${ clusterName }`,
          self:   `https://localhost:8005/v1/provisioning.cattle.io.clusters/${ namespace }/${ clusterName }`,
          update: `https://localhost:8005/v1/provisioning.cattle.io.clusters/${ namespace }/${ clusterName }`,
          view:   `https://localhost:8005/apis/provisioning.cattle.io/v1/namespaces/${ namespace }/clusters/${ clusterName }`
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
          namespace:     `${ namespace }`,
          relationships: [
            {
              toId:    `${ namespace }/r-cluster-${ clusterName }-view-p-lnjgz-creator-proje-67ac2`,
              toType:  'rbac.authorization.k8s.io.rolebinding',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `${ namespace }/crt-${ clusterName }-nodes-manage`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `${ namespace }/crt-${ clusterName }-cluster-owner`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:   `${ namespace }/${ clusterName }-managed-system-upgrad-53adc`,
              toType: 'management.cattle.io.managedchart',
              rel:    'owner',
              state:  'waitapplied'
            },
            {
              toId:    `${ namespace }/r-cluster-${ clusterName }-view`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `${ namespace }/crt-${ clusterName }-nodes-view`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `${ namespace }/crt-${ clusterName }-cluster-admin`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `${ namespace }/nc-${ clusterName }-pool1-${ machinePoolId }`,
              toType:  'rke-machine-config.cattle.io.digitaloceanconfig',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `c-m-fbr46mrq/c-m-fbr46mrq-${ namespace }-owner`,
              toType:  'management.cattle.io.clusterroletemplatebinding',
              rel:     'applies',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:   `${ namespace }/${ clusterName }`,
              toType: 'cluster.x-k8s.io.cluster',
              rel:    'owner',
              state:  'provisioned'
            },
            {
              toId:   `${ namespace }/${ clusterName }`,
              toType: 'fleet.cattle.io.cluster',
              rel:    'applies',
              state:  'waitcheckin'
            },
            {
              toId:    `${ clusterName }`,
              toType:  'management.cattle.io.cluster',
              rel:     'applies',
              state:   'active',
              message: 'Resource is Ready'
            },
            {
              toId:    `${ namespace }/crt-${ clusterName }-cluster-member`,
              toType:  'rbac.authorization.k8s.io.role',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:   `${ namespace }/${ clusterName }-managed-system-agent`,
              toType: 'fleet.cattle.io.bundle',
              rel:    'owner',
              state:  'waitapplied'
            },
            {
              toId:    `${ namespace }/r-cluster-${ clusterName }-view-p-d27qf-creator-proje-e42dc`,
              toType:  'rbac.authorization.k8s.io.rolebinding',
              rel:     'owner',
              state:   'active',
              message: 'Resource is current'
            },
            {
              toId:    `${ namespace }/${ clusterName }-kubeconfig`,
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
              'etcd-expose-metrics': false,
              'ingress-controller':  'ingress-nginx'
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
          clusterName:      `${ clusterName }`,
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
