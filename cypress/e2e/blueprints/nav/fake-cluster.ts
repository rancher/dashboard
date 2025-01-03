import {
  generateFakeNodeSchema,
  generateFakeCountSchema,
  generateFakeNamespaceSchema,
  generateFakeDaemonsetSchema,
  generateFakePodSchema
} from './k8s-schemas.ts';

import {
  generateFakeNodeDriversReply,
  generateFakeCloudCredentialsReply,
  generateFakeMachineConfigReply,
  generateFakeCloudCredIndividualReply,
  generateFakeSecretsReply
} from './edit-cluster.ts';

import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

// GENERAL DATA NOT CONFIGURABLE, for now...
const MACHINE_POOL_ID = '995mj';
const CLOUD_CRED_ID = 'srb7v';

function generateProvClusterObj(provClusterId, mgmtClusterId) {
  return {
    id:    `fleet-default/${ provClusterId }`,
    type:  'provisioning.cattle.io.cluster',
    links: {
      remove: `https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/${ provClusterId }`,
      self:   `https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/${ provClusterId }`,
      update: `https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/${ provClusterId }`,
      view:   `https://localhost:8005/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/${ provClusterId }`
    },
    apiVersion: 'provisioning.cattle.io/v1',
    kind:       'Cluster',
    metadata:   {
      annotations:       { 'field.cattle.io/creatorId': 'user-lfv6k' },
      creationTimestamp: '2024-03-07T15:45:25Z',
      fields:            [
        provClusterId,
        'true',
        `${ provClusterId }-kubeconfig`
      ],
      finalizers: [
        'wrangler.cattle.io/provisioning-cluster-remove',
        'wrangler.cattle.io/rke-cluster-remove',
        'wrangler.cattle.io/cloud-config-secret-remover'
      ],
      generation:    3,
      name:          provClusterId,
      namespace:     'fleet-default',
      relationships: [
        {
          toId:    `fleet-default/crt-${ provClusterId }-cluster-owner`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/crt-${ provClusterId }-cluster-admin`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/nc-${ provClusterId }-pool1-${ MACHINE_POOL_ID }`,
          toType:  'rke-machine-config.cattle.io.digitaloceanconfig',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:   `fleet-default/${ provClusterId }`,
          toType: 'cluster.x-k8s.io.cluster',
          rel:    'owner',
          state:  'provisioned'
        },
        {
          toId:    `fleet-default/crt-${ provClusterId }-cluster-member`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/${ provClusterId }-managed-system-agent`,
          toType:  'fleet.cattle.io.bundle',
          rel:     'owner',
          state:   'active',
          message: 'Resource is Ready'
        },
        {
          toId:    `fleet-default/${ provClusterId }-managed-system-upgrade-c-e07cc`,
          toType:  'management.cattle.io.managedchart',
          rel:     'owner',
          state:   'active',
          message: 'Resource is Ready'
        },
        {
          toId:    `fleet-default/r-cluster-${ provClusterId }-view-p-jwd4v-creator-project-7edf69`,
          toType:  'rbac.authorization.k8s.io.rolebinding',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/${ provClusterId }`,
          toType:  'fleet.cattle.io.cluster',
          rel:     'applies',
          state:   'active',
          message: 'Resource is Ready'
        },
        {
          toId:    `fleet-default/crt-${ provClusterId }-nodes-view`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/r-cluster-${ provClusterId }-view`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/r-cluster-${ provClusterId }-view-p-rs8ps-creator-project-8aae6c`,
          toType:  'rbac.authorization.k8s.io.rolebinding',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `${ mgmtClusterId }/${ mgmtClusterId }-fleet-default-owner`,
          toType:  'management.cattle.io.clusterroletemplatebinding',
          rel:     'applies',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/crt-${ provClusterId }-nodes-manage`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    mgmtClusterId,
          toType:  'management.cattle.io.cluster',
          rel:     'applies',
          state:   'active',
          message: 'Resource is Ready'
        },
        {
          toId:    `fleet-default/${ provClusterId }-kubeconfig`,
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
      uid: '326aa188-e66f-4cf0-8f54-9fc47e4c5d92'
    },
    spec: {
      cloudCredentialSecretName: `cattle-global-data:cc-${ CLOUD_CRED_ID }`,
      kubernetesVersion:         'v1.27.10+rke2r1',
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
              name: `nc-${ provClusterId }-pool1-${ MACHINE_POOL_ID }`
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
        registries:      { configs: { reg1: { authConfigSecretName: 'registryconfig-auth-reg1' }, reg2: { authConfigSecretName: 'registryconfig-auth-reg2' } } },
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
      clientSecretName: `${ provClusterId }-kubeconfig`,
      clusterName:      mgmtClusterId,
      conditions:       [
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:44Z',
          status:         'False',
          transitioning:  false,
          type:           'Reconciling'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:25Z',
          status:         'False',
          transitioning:  false,
          type:           'Stalled'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:44Z',
          status:         'True',
          transitioning:  false,
          type:           'Created'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:47Z',
          status:         'True',
          transitioning:  false,
          type:           'RKECluster'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'BackingNamespaceCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'DefaultProjectCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'SystemProjectCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'InitialRolesPopulated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:29Z',
          status:         'True',
          transitioning:  false,
          type:           'Connected'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:30Z',
          status:         'True',
          transitioning:  false,
          type:           'CreatorMadeOwner'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:47Z',
          status:         'True',
          transitioning:  false,
          type:           'Updated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:47Z',
          status:         'True',
          transitioning:  false,
          type:           'Provisioned'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:47Z',
          status:         'True',
          transitioning:  false,
          type:           'Ready'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'NoDiskPressure'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'NoMemoryPressure'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'SecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'ServiceAcnamespaceSecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'RKESecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:35Z',
          status:         'True',
          transitioning:  false,
          type:           'ACISecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:51:59Z',
          status:         'True',
          transitioning:  false,
          type:           'GlobalAdminsSynced'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:04Z',
          status:         'True',
          transitioning:  false,
          type:           'SystemAccountCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:17Z',
          status:         'True',
          transitioning:  false,
          type:           'AgentDeployed'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:44Z',
          status:         'True',
          transitioning:  false,
          type:           'Waiting'
        }
      ],
      fleetWorkspaceName: 'fleet-default',
      observedGeneration: 3,
      ready:              true
    }
  };
}

function generateMgmtClusterObj(provClusterId, mgmtClusterId) {
  return {
    id:    mgmtClusterId,
    type:  'management.cattle.io.cluster',
    links: {
      log:       `https://localhost:8005/v1/management.cattle.io.clusters/${ mgmtClusterId }?link=log`,
      projects:  `https://localhost:8005/v1/management.cattle.io.clusters/${ mgmtClusterId }?link=projects`,
      remove:    'blocked',
      schemas:   `https://localhost:8005/v1/management.cattle.io.clusters/${ mgmtClusterId }?link=schemas`,
      self:      `https://localhost:8005/v1/management.cattle.io.clusters/${ mgmtClusterId }`,
      shell:     `wss://localhost:8005/v3/clusters/${ mgmtClusterId }?shell=true`,
      subscribe: `https://localhost:8005/v1/management.cattle.io.clusters/${ mgmtClusterId }?link=subscribe`,
      update:    'blocked',
      view:      `https://localhost:8005/v1/management.cattle.io.clusters/${ mgmtClusterId }`
    },
    actions: {
      apply:              `https://localhost:8005/v1/management.cattle.io.clusters/${ mgmtClusterId }?action=apply`,
      enableMonitoring:   `https://localhost:8005/v3/clusters/${ mgmtClusterId }?action=enableMonitoring`,
      generateKubeconfig: `https://localhost:8005/v3/clusters/${ mgmtClusterId }?action=generateKubeconfig`,
      importYaml:         `https://localhost:8005/v3/clusters/${ mgmtClusterId }?action=importYaml`
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'authz.management.cattle.io/creator-role-bindings':            '{"created":["cluster-owner"],"required":["cluster-owner"]}',
        'authz.management.cattle.io/initial-sync':                     'true',
        'field.cattle.io/creatorId':                                   'user-lfv6k',
        'lifecycle.cattle.io/create.cluster-agent-controller-cleanup': 'true',
        'lifecycle.cattle.io/create.cluster-provisioner-controller':   'true',
        'lifecycle.cattle.io/create.cluster-scoped-gc':                'true',
        'lifecycle.cattle.io/create.mgmt-cluster-rbac-remove':         'true',
        'management.cattle.io/current-cluster-controllers-version':    'v1.27.10+rke2r1',
        'objectset.rio.cattle.io/applied':                             'H4sIAAAAAAAA/4xSwWrcQAz9laKzvdl1mmVr6CGEHkJpGmhpz7JH9qoea4xG9jaE/HsZrzddUhJ6GkbSk96T3iPgwD9IIweBEnoUbKknsVWNZp5WHC6mS8igY3FQwo0fo5FCBj0ZOjSE8hFQJBgaB4np2zB5d9agVkILepsajJE098207SCDUP2i2iLZSjmcAThV1sdR+YymN6rDQUjzduqghEHDxEkMS3suYZO9+8ziPv7l/3Y3wZ6gBPT0OzeKlmtHRe7CfwHjgHVCN57IckcNjt4ge40cup6FoykaJeGmI8FTBrNwDvKde4qG/QCljN5n4LEiP2/6NS57jHsoYbdZF9RsN+vNdldR3VSbXVG4y6vKbd32/Ydme1lsNlU1T1sU13mf69V0NUnRpHAcqJ5P3JLYbY8tfZ1IlV0qhgxQ4oE0kUmMj9v9RrWSLTFHsVYe7GgwmAOs5K6fG0IJilLvSS+WN5+nlVOx2q2KM8ho+5eIbqwox4FzHG1fTutVsVonBMfB48Pd62ckwcrT4odrT2osLZQN+kgvsl+CsAX9N39Hdgja3QfP9cPpOvPVfwbtZhssDF5agfshqJG7CdJwmxachJx+kDbPYqSC/nmmDzX6E+HR9p/EDYHFEvrIxy21TxkcWFw4xHulhpTcyfdL/ulPAAAA///HOsOL+AMAAA',
        'objectset.rio.cattle.io/id':                                  'cluster-create',
        'objectset.rio.cattle.io/owner-gvk':                           'provisioning.cattle.io/v1, Kind=Cluster',
        'objectset.rio.cattle.io/owner-name':                          provClusterId,
        'objectset.rio.cattle.io/owner-namespace':                     'fleet-default',
        'provisioning.cattle.io/administrated':                        'true'
      },
      creationTimestamp: '2024-03-07T15:45:25Z',
      fields:            [
        mgmtClusterId,
        '19h'
      ],
      finalizers: [
        'wrangler.cattle.io/mgmt-cluster-remove',
        'controller.cattle.io/cluster-agent-controller-cleanup',
        'controller.cattle.io/cluster-scoped-gc',
        'controller.cattle.io/cluster-provisioner-controller',
        'controller.cattle.io/mgmt-cluster-rbac-remove'
      ],
      generation: 42,
      labels:     {
        'objectset.rio.cattle.io/hash': '8102ef610168becfb1822d35bd6d649f63211bbe',
        'provider.cattle.io':           'rke2'
      },
      name:          mgmtClusterId,
      relationships: [
        {
          fromId:   `fleet-default/${ provClusterId }`,
          fromType: 'provisioning.cattle.io.cluster',
          rel:      'applies',
          state:    'active',
          message:  'Resource is Ready'
        },
        {
          toId:    `${ mgmtClusterId }-clustermember`,
          toType:  'rbac.authorization.k8s.io.clusterrole',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `${ mgmtClusterId }-clusterowner`,
          toType:  'rbac.authorization.k8s.io.clusterrole',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    'cattle-global-data/cluster-serviceaccounttoken-r5kvb',
          toType:  'secret',
          rel:     'owner',
          state:   'active',
          message: 'Resource is always ready'
        },
        {
          toId:    'cattle-global-data/cluster-serviceaccounttoken-mmcf9',
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
      uid: '5887e0fe-d20a-42cc-812e-cbc2213201fe'
    },
    spec: {
      agentImageOverride:       '',
      answers:                  {},
      clusterSecrets:           {},
      description:              '',
      desiredAgentImage:        'rancher/rancher-agent:v2.8.2',
      desiredAuthImage:         'rancher/kube-api-auth:v0.2.0',
      displayName:              provClusterId,
      enableClusterAlerting:    false,
      enableClusterMonitoring:  false,
      enableNetworkPolicy:      null,
      fleetWorkspaceName:       'fleet-default',
      importedConfig:           { kubeConfig: '' },
      internal:                 false,
      localClusterAuthEndpoint: { enabled: false },
      windowsPreferedCluster:   false
    },
    status: {
      agentFeatures: {
        'embedded-cluster-api':           false,
        fleet:                            false,
        monitoringv1:                     false,
        'multi-cluster-management':       false,
        'multi-cluster-management-agent': true,
        provisioningv2:                   false,
        rke2:                             false
      },
      agentImage: 'rancher/rancher-agent:v2.8.2',
      aksStatus:  {
        privateRequiresTunnel: null,
        rbacEnabled:           null,
        upstreamSpec:          null
      },
      allocatable: {
        cpu:    '2',
        memory: '4026036Ki',
        pods:   '110'
      },
      apiEndpoint:         'https://10.43.0.1:443',
      appliedAgentEnvVars: [
        {
          name:  'CATTLE_SERVER_VERSION',
          value: 'v2.8.2'
        },
        {
          name:  'CATTLE_INSTALL_UUID',
          value: 'ccf7f3e1-92b6-4ca3-80ff-dd632a8f818d'
        },
        {
          name:  'CATTLE_INGRESS_IP_DOMAIN',
          value: 'sslip.io'
        }
      ],
      appliedEnableNetworkPolicy:         false,
      appliedPodSecurityPolicyTemplateId: '',
      appliedSpec:                        {
        agentImageOverride:       '',
        answers:                  {},
        clusterSecrets:           {},
        description:              '',
        desiredAgentImage:        '',
        desiredAuthImage:         '',
        displayName:              '',
        enableClusterAlerting:    false,
        enableClusterMonitoring:  false,
        enableNetworkPolicy:      null,
        internal:                 false,
        localClusterAuthEndpoint: { enabled: false },
        windowsPreferedCluster:   false
      },
      authImage:    '',
      caCert:       'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJlRENDQVIrZ0F3SUJBZ0lCQURBS0JnZ3Foa2pPUFFRREFqQWtNU0l3SUFZRFZRUUREQmx5YTJVeUxYTmwKY25abGNpMWpZVUF4TnpBNU9ESTJORGd5TUI0WERUSTBNRE13TnpFMU5EZ3dNbG9YRFRNME1ETXdOVEUxTkRndwpNbG93SkRFaU1DQUdBMVVFQXd3WmNtdGxNaTF6WlhKMlpYSXRZMkZBTVRjd09UZ3lOalE0TWpCWk1CTUdCeXFHClNNNDlBZ0VHQ0NxR1NNNDlBd0VIQTBJQUJJNnVnTGpqbXJwbHJyVEsrOE5LWUFRb3FRNXdLZ1cvQ1Y1UWoraEIKUkNLQXJxaVAveEM3NStSdGpqb1haaTRBRTVuWlRkbDBkYVZwSmdPOEp1R00yY1NqUWpCQU1BNEdBMVVkRHdFQgovd1FFQXdJQ3BEQVBCZ05WSFJNQkFmOEVCVEFEQVFIL01CMEdBMVVkRGdRV0JCVFUvbG5SSklNN1hWSnFodDhICjI1ZDUyVFVtMERBS0JnZ3Foa2pPUFFRREFnTkhBREJFQWlBc0luZGRxd21Ub2JWbk9INndhVnhMTzA4bDNDQVQKdWg2bGZyd3dDTTdZRWdJZ1NMNlZtdHhFZkRCd0wweTU4TjNFdnl3VXl4U0FuZDBzMCtQRVFON0FwUm89Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
      capabilities: { loadBalancerCapabilities: {} },
      capacity:     {
        cpu:    '2',
        memory: '4026036Ki',
        pods:   '110'
      },
      conditions: [
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'BackingNamespaceCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'DefaultProjectCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'SystemProjectCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:26Z',
          status:         'True',
          transitioning:  false,
          type:           'InitialRolesPopulated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:29Z',
          status:         'True',
          transitioning:  false,
          type:           'Connected'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:30Z',
          status:         'True',
          transitioning:  false,
          type:           'CreatorMadeOwner'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:47Z',
          status:         'True',
          transitioning:  false,
          type:           'Updated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:32Z',
          status:         'True',
          transitioning:  false,
          type:           'Provisioned'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'NoDiskPressure'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'NoMemoryPressure'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'SecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'ServiceAccountSecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:34Z',
          status:         'True',
          transitioning:  false,
          type:           'RKESecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:45:35Z',
          status:         'True',
          transitioning:  false,
          type:           'ACISecretsMigrated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:44Z',
          status:         'True',
          transitioning:  false,
          type:           'Ready'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:51:59Z',
          status:         'True',
          transitioning:  false,
          type:           'GlobalAdminsSynced'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:04Z',
          status:         'True',
          transitioning:  false,
          type:           'SystemAccountCreated'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:17Z',
          status:         'True',
          transitioning:  false,
          type:           'AgentDeployed'
        },
        {
          error:          false,
          lastUpdateTime: '2024-03-07T15:52:44Z',
          status:         'True',
          transitioning:  false,
          type:           'Waiting'
        }
      ],
      driver:    'imported',
      eksStatus: {
        generatedNodeRole:             '',
        managedLaunchTemplateID:       '',
        managedLaunchTemplateVersions: null,
        privateRequiresTunnel:         null,
        securityGroups:                null,
        subnets:                       null,
        upstreamSpec:                  null,
        virtualNetwork:                ''
      },
      gkeStatus: {
        privateRequiresTunnel: null,
        upstreamSpec:          null
      },
      limits: {
        cpu:    '200m',
        memory: '192Mi',
        pods:   '0'
      },
      linuxWorkerCount: 1,
      nodeCount:        1,
      provider:         'rke2',
      requested:        {
        cpu:    '1325m',
        memory: '2410Mi',
        pods:   '20'
      },
      serviceAccountTokenSecret: 'cluster-serviceaccounttoken-r5kvb',
      version:                   {
        buildDate:    '2024-01-17T21:34:35Z',
        compiler:     'gc',
        gitCommit:    '0fa26aea1d5c21516b0d96fea95a77d8d429912e',
        gitTreeState: 'clean',
        gitVersion:   'v1.27.10+rke2r1',
        goVersion:    'go1.20.13 X:boringcrypto',
        major:        '1',
        minor:        '27',
        platform:     'linux/amd64'
      }
    }
  };
}

function generateFakeCountsReply(mgmtClusterId) {
  return [
    {
      id:     'count',
      type:   'count',
      links:  { self: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/counts/count` },
      counts: {
        'admissionregistration.k8s.io.mutatingwebhookconfiguration':   { summary: { count: 1 } },
        'admissionregistration.k8s.io.validatingwebhookconfiguration': { summary: { count: 3 } },
        'apiextensions.k8s.io.customresourcedefinition':               { summary: { count: 47 } },
        apigroup:                                                      { summary: {} },
        'apiregistration.k8s.io.apiservice':                           { summary: { count: 32 } },
        'apps.controllerrevision':                                     {
          summary:    { count: 2 },
          namespaces: {
            'calico-system': { count: 1 },
            'kube-system':   { count: 1 }
          }
        },
        'apps.daemonset': {
          summary:    { count: 2 },
          namespaces: {
            'calico-system': { count: 1 },
            'kube-system':   { count: 1 }
          }
        },
        'apps.deployment': {
          summary:    { count: 12 },
          namespaces: {
            'calico-system':       { count: 2 },
            'cattle-fleet-system': { count: 1 },
            'cattle-system':       { count: 3 },
            'kube-system':         { count: 5 },
            'tigera-operator':     { count: 1 }
          }
        },
        'apps.replicaset': {
          summary:    { count: 13 },
          namespaces: {
            'calico-system':       { count: 2 },
            'cattle-fleet-system': { count: 1 },
            'cattle-system':       { count: 4 },
            'kube-system':         { count: 5 },
            'tigera-operator':     { count: 1 }
          }
        },
        'apps.statefulset':                              { summary: {} },
        'authentication.k8s.io.tokenreview':             { summary: {} },
        'authorization.k8s.io.localsubjectaccessreview': { summary: {} },
        'authorization.k8s.io.selfsubjectaccessreview':  { summary: {} },
        'authorization.k8s.io.selfsubjectrulesreview':   { summary: {} },
        'authorization.k8s.io.subjectaccessreview':      { summary: {} },
        'autoscaling.horizontalpodautoscaler':           { summary: {} },
        'batch.cronjob':                                 { summary: {} },
        'batch.job':                                     {
          summary:    { count: 8 },
          namespaces: { 'kube-system': { count: 8 } }
        },
        binding:                 { summary: {} },
        'catalog.cattle.io.app': {
          summary:    { count: 12 },
          namespaces: {
            'cattle-fleet-system': { count: 1 },
            'cattle-system':       { count: 3 },
            'kube-system':         { count: 8 }
          }
        },
        'catalog.cattle.io.clusterrepo':                 { summary: { count: 2 } },
        'catalog.cattle.io.operation':                   { summary: {} },
        'certificates.k8s.io.certificatesigningrequest': { summary: {} },
        componentstatus:                                 { summary: {} },
        configmap:                                       {
          summary:    { count: 39 },
          namespaces: {
            'calico-system':               { count: 4 },
            'cattle-fleet-system':         { count: 3 },
            'cattle-impersonation-system': { count: 1 },
            'cattle-system':               { count: 6 },
            default:                       { count: 1 },
            'kube-node-lease':             { count: 1 },
            'kube-public':                 { count: 1 },
            'kube-system':                 { count: 20 },
            local:                         { count: 1 },
            'tigera-operator':             { count: 1 }
          }
        },
        'coordination.k8s.io.lease': {
          summary:    { count: 12 },
          namespaces: {
            'cattle-fleet-system': { count: 1 },
            'kube-node-lease':     { count: 1 },
            'kube-system':         { count: 9 },
            'tigera-operator':     { count: 1 }
          }
        },
        'crd.projectcalico.org.bgpconfiguration':             { summary: {} },
        'crd.projectcalico.org.bgpfilter':                    { summary: {} },
        'crd.projectcalico.org.bgppeer':                      { summary: {} },
        'crd.projectcalico.org.blockaffinity':                { summary: { count: 1 } },
        'crd.projectcalico.org.caliconodestatus':             { summary: {} },
        'crd.projectcalico.org.clusterinformation':           { summary: { count: 1 } },
        'crd.projectcalico.org.felixconfiguration':           { summary: { count: 1 } },
        'crd.projectcalico.org.globalnetworkpolicy':          { summary: {} },
        'crd.projectcalico.org.globalnetworkset':             { summary: {} },
        'crd.projectcalico.org.hostendpoint':                 { summary: {} },
        'crd.projectcalico.org.ipamblock':                    { summary: { count: 1 } },
        'crd.projectcalico.org.ipamconfig':                   { summary: { count: 1 } },
        'crd.projectcalico.org.ipamhandle':                   { summary: { count: 12 } },
        'crd.projectcalico.org.ippool':                       { summary: { count: 1 } },
        'crd.projectcalico.org.ipreservation':                { summary: {} },
        'crd.projectcalico.org.kubecontrollersconfiguration': { summary: { count: 1 } },
        'crd.projectcalico.org.networkpolicy':                { summary: {} },
        'crd.projectcalico.org.networkset':                   { summary: {} },
        'discovery.k8s.io.endpointslice':                     {
          summary:    { count: 9 },
          namespaces: {
            'calico-system': { count: 2 },
            'cattle-system': { count: 2 },
            default:         { count: 1 },
            'kube-system':   { count: 4 }
          }
        },
        endpoints: {
          summary:    { count: 9 },
          namespaces: {
            'calico-system': { count: 2 },
            'cattle-system': { count: 2 },
            default:         { count: 1 },
            'kube-system':   { count: 4 }
          }
        },
        event: {
          summary:    { count: 8 },
          namespaces: { 'kube-system': { count: 8 } }
        },
        'events.k8s.io.event': {
          summary:    { count: 8 },
          namespaces: { 'kube-system': { count: 8 } }
        },
        'flowcontrol.apiserver.k8s.io.flowschema':                 { summary: { count: 13 } },
        'flowcontrol.apiserver.k8s.io.prioritylevelconfiguration': { summary: { count: 8 } },
        'helm.cattle.io.helmchart':                                {
          summary:    { count: 8 },
          namespaces: { 'kube-system': { count: 8 } }
        },
        'helm.cattle.io.helmchartconfig': {
          summary:    { count: 1 },
          namespaces: { 'kube-system': { count: 1 } }
        },
        'k3s.cattle.io.addon': {
          summary:    { count: 12 },
          namespaces: { 'kube-system': { count: 12 } }
        },
        'k3s.cattle.io.etcdsnapshotfile':                                 { summary: { count: 4 } },
        limitrange:                                                       { summary: {} },
        'management.cattle.io.apiservice':                                { summary: {} },
        'management.cattle.io.authconfig':                                { summary: { count: 14 } },
        'management.cattle.io.cluster':                                   { summary: { count: 1 } },
        'management.cattle.io.clusterregistrationtoken':                  { summary: {} },
        'management.cattle.io.feature':                                   { summary: { count: 12 } },
        'management.cattle.io.group':                                     { summary: {} },
        'management.cattle.io.groupmember':                               { summary: {} },
        'management.cattle.io.podsecurityadmissionconfigurationtemplate': { summary: {} },
        'management.cattle.io.setting':                                   { summary: { count: 116 } },
        'management.cattle.io.user':                                      { summary: {} },
        'management.cattle.io.userattribute':                             { summary: {} },
        'metrics.k8s.io.nodemetrics':                                     { summary: {} },
        'metrics.k8s.io.podmetrics':                                      { summary: {} },
        namespace:                                                        { summary: { count: 10 } },
        'networking.k8s.io.ingress':                                      { summary: {} },
        'networking.k8s.io.ingressclass':                                 { summary: { count: 1 } },
        'networking.k8s.io.networkpolicy':                                {
          summary:    { count: 1 },
          namespaces: { 'cattle-fleet-system': { count: 1 } }
        },
        node:                              { summary: { count: 1 } },
        'node.k8s.io.runtimeclass':        { summary: {} },
        'operator.tigera.io.apiserver':    { summary: {} },
        'operator.tigera.io.imageset':     { summary: {} },
        'operator.tigera.io.installation': { summary: { count: 1 } },
        'operator.tigera.io.tigerastatus': { summary: { count: 1 } },
        persistentvolume:                  { summary: {} },
        persistentvolumeclaim:             { summary: {} },
        pod:                               {
          summary:    { count: 28 },
          namespaces: {
            'calico-system':       { count: 3 },
            'cattle-fleet-system': { count: 1 },
            'cattle-system':       { count: 3 },
            'kube-system':         { count: 20 },
            'tigera-operator':     { count: 1 }
          }
        },
        podtemplate:                  { summary: {} },
        'policy.poddisruptionbudget': {
          summary:    { count: 1 },
          namespaces: { 'calico-system': { count: 1 } }
        },
        'rbac.authorization.k8s.io.clusterrole':        { summary: { count: 93 } },
        'rbac.authorization.k8s.io.clusterrolebinding': { summary: { count: 86 } },
        'rbac.authorization.k8s.io.role':               {
          summary:    { count: 9 },
          namespaces: {
            'kube-public': { count: 1 },
            'kube-system': { count: 8 }
          }
        },
        'rbac.authorization.k8s.io.rolebinding': {
          summary:    { count: 29 },
          namespaces: {
            'calico-system':               { count: 2 },
            'cattle-fleet-system':         { count: 2 },
            'cattle-impersonation-system': { count: 2 },
            'cattle-system':               { count: 2 },
            default:                       { count: 2 },
            'kube-node-lease':             { count: 2 },
            'kube-public':                 { count: 3 },
            'kube-system':                 { count: 12 },
            'tigera-operator':             { count: 2 }
          }
        },
        replicationcontroller:             { summary: {} },
        resourcequota:                     { summary: {} },
        'scheduling.k8s.io.priorityclass': { summary: { count: 2 } },
        secret:                            {
          summary:    { count: 42 },
          namespaces: {
            'calico-system':               { count: 2 },
            'cattle-fleet-system':         { count: 2 },
            'cattle-impersonation-system': { count: 3 },
            'cattle-system':               { count: 12 },
            'kube-system':                 { count: 20 },
            'tigera-operator':             { count: 3 }
          }
        },
        service: {
          summary:    { count: 9 },
          namespaces: {
            'calico-system': { count: 2 },
            'cattle-system': { count: 2 },
            default:         { count: 1 },
            'kube-system':   { count: 4 }
          }
        },
        serviceaccount: {
          summary:    { count: 68 },
          namespaces: {
            'calico-system':               { count: 5 },
            'cattle-fleet-system':         { count: 2 },
            'cattle-impersonation-system': { count: 4 },
            'cattle-system':               { count: 6 },
            default:                       { count: 1 },
            'kube-node-lease':             { count: 1 },
            'kube-public':                 { count: 1 },
            'kube-system':                 { count: 45 },
            local:                         { count: 1 },
            'tigera-operator':             { count: 2 }
          }
        },
        'snapshot.storage.k8s.io.volumesnapshot':        { summary: {} },
        'snapshot.storage.k8s.io.volumesnapshotclass':   { summary: {} },
        'snapshot.storage.k8s.io.volumesnapshotcontent': { summary: {} },
        'storage.k8s.io.csidriver':                      { summary: {} },
        'storage.k8s.io.csinode':                        { summary: { count: 1 } },
        'storage.k8s.io.csistoragecapacity':             { summary: {} },
        'storage.k8s.io.storageclass':                   { summary: {} },
        'storage.k8s.io.volumeattachment':               { summary: {} },
        'ui.cattle.io.navlink':                          { summary: {} },
        'upgrade.cattle.io.plan':                        {
          summary:    { count: 2 },
          namespaces: { 'cattle-system': { count: 2 } }
        },
        userpreference: { summary: {} }
      }
    }
  ];
}

function generateFakeNamespacesReply(mgmtClusterId) {
  return [
    {
      id:    'calico-system',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/calico-system`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/calico-system`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/calico-system`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/calico-system`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:00Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:05Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-jwd4v`,
          'lifecycle.cattle.io/create.namespace-auth': 'true',
          'management.cattle.io/no-default-sa-token':  'true'
        },
        creationTimestamp: '2024-03-07T15:49:51Z',
        fields:            [
          'calico-system',
          'Active',
          '20h'
        ],
        labels: {
          'field.cattle.io/projectId':                  'p-jwd4v',
          'kubernetes.io/metadata.name':                'calico-system',
          name:                                         'calico-system',
          'pod-security.kubernetes.io/enforce':         'privileged',
          'pod-security.kubernetes.io/enforce-version': 'latest'
        },
        name:            'calico-system',
        ownerReferences: [
          {
            apiVersion:         'operator.tigera.io/v1',
            blockOwnerDeletion: true,
            controller:         true,
            kind:               'Installation',
            name:               'default',
            uid:                'e41422fb-2155-4cb9-868d-71e1b1919dc5'
          }
        ],
        relationships: [
          {
            fromId:   'default',
            fromType: 'operator.tigera.io.installation',
            rel:      'owner',
            state:    'active',
            message:  'Resource is Ready'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: '2ddce193-4ac7-48aa-85b1-757b246f4172'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'cattle-fleet-system',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-fleet-system`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-fleet-system`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-fleet-system`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/cattle-fleet-system`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:49Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:54Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-jwd4v`,
          'lifecycle.cattle.io/create.namespace-auth': 'true',
          'management.cattle.io/no-default-sa-token':  'true',
          'objectset.rio.cattle.io/applied':           'H4sIAAAAAAAA/3zOzW3DMAyG4V14jt3EahNbc3QBSqIaFfoxzC+HwvDuhep7byQIPC93KgIODCa7E9fawEital+b+xYPFYxbaqNnIMuY2lsKZClmEQz8JRWDaw2KjVc6LuQ3+SM+UxEFl5VsfeV8ocxO8r/wk/XZabMs4erM7RpddNMsy/3+MLcpBv9gY5aPd5nc7Odeq1yELJ3GcD6lPwop/aqreLJ7n8B49fhx/AYAAP//76piwPQAAAA',
          'objectset.rio.cattle.io/id':                'fleet-agent-bootstrap'
        },
        creationTimestamp: '2024-03-07T15:52:47Z',
        fields:            [
          'cattle-fleet-system',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'field.cattle.io/projectId':    'p-jwd4v',
          'kubernetes.io/metadata.name':  'cattle-fleet-system',
          'objectset.rio.cattle.io/hash': 'f399d0b310fbfb28e9667312fdc7a33954e2b8c8'
        },
        name:            'cattle-fleet-system',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: 'e69b9887-634b-4e69-a9cb-ba8ff593ded7'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'cattle-impersonation-system',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-impersonation-system`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-impersonation-system`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-impersonation-system`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/cattle-impersonation-system`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:01Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:06Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-jwd4v`,
          'lifecycle.cattle.io/create.namespace-auth': 'true',
          'management.cattle.io/no-default-sa-token':  'true'
        },
        creationTimestamp: '2024-03-07T15:51:59Z',
        fields:            [
          'cattle-impersonation-system',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'authz.cluster.cattle.io/impersonator': 'true',
          'cattle.io/creator':                    'norman',
          'field.cattle.io/projectId':            'p-jwd4v',
          'kubernetes.io/metadata.name':          'cattle-impersonation-system'
        },
        name:            'cattle-impersonation-system',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: '76034e6f-6394-4f37-ba24-62cfbadaefe5'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'cattle-system',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-system`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-system`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/cattle-system`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/cattle-system`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                                 '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:00Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:05Z"}]}',
          'field.cattle.io/projectId':                        `${ mgmtClusterId }:p-jwd4v`,
          'kubectl.kubernetes.io/last-applied-configuration': '{"apiVersion":"v1","kind":"Namespace","metadata":{"annotations":{},"name":"cattle-system"}}\n',
          'lifecycle.cattle.io/create.namespace-auth':        'true',
          'management.cattle.io/no-default-sa-token':         'true',
          'objectset.rio.cattle.io/applied':                  'H4sIAAAAAAAA/4yPy07rQBBEf+Wq1mPf+BECI7FgjcSSfXumnQy2eyJ3xwhF+XdkEIgNj2Wr1KfqnEHH9MizpizwWCo4DEkiPB5oYj1SYDhMbBTJCP4MEslGlrLoeubuiYMpWzmnXAYyG7lM+X9aGXDf5vlZeC72ywCPodEvyVK5f/dJ4u1djFl+RQhNDI8wntR4LmjPYn96epfzGE4dF/qixhMuDiN1PP6odiA9rI3b0BBvtkRXod9xW8W629Q13xCFtg+hb3ZNvO7bFfox8o3xWXZ5DQAA//8OWV+LfwEAAA',
          'objectset.rio.cattle.io/id':                       '',
          'objectset.rio.cattle.io/owner-gvk':                'k3s.cattle.io/v1, Kind=Addon',
          'objectset.rio.cattle.io/owner-name':               'cluster-agent',
          'objectset.rio.cattle.io/owner-namespace':          'kube-system'
        },
        creationTimestamp: '2024-03-07T15:48:59Z',
        fields:            [
          'cattle-system',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'field.cattle.io/projectId':    'p-jwd4v',
          'kubernetes.io/metadata.name':  'cattle-system',
          'objectset.rio.cattle.io/hash': 'c5c3ae05aa6cf7e41d2b022e9aac4fccf373d8f4'
        },
        name:          'cattle-system',
        relationships: [
          {
            fromId:   'kube-system/cluster-agent',
            fromType: 'k3s.cattle.io.addon',
            rel:      'applies',
            state:    'active',
            message:  'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: 'af92d460-6142-4d85-b7d6-7d12682f5e6c'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'default',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/default`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/default`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/default`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/default`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:00Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:06Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-rs8ps`,
          'lifecycle.cattle.io/create.namespace-auth': 'true'
        },
        creationTimestamp: '2024-03-07T15:48:53Z',
        fields:            [
          'default',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'field.cattle.io/projectId':   'p-rs8ps',
          'kubernetes.io/metadata.name': 'default'
        },
        name:            'default',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: '1865090a-28f5-4fbf-8a9f-494e76ec6898'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'kube-node-lease',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-node-lease`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-node-lease`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-node-lease`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/kube-node-lease`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:00Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:05Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-jwd4v`,
          'lifecycle.cattle.io/create.namespace-auth': 'true',
          'management.cattle.io/no-default-sa-token':  'true'
        },
        creationTimestamp: '2024-03-07T15:48:53Z',
        fields:            [
          'kube-node-lease',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'field.cattle.io/projectId':   'p-jwd4v',
          'kubernetes.io/metadata.name': 'kube-node-lease'
        },
        name:            'kube-node-lease',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: 'c74f285d-6001-4c59-8f5f-200beec08099'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'kube-public',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-public`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-public`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-public`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/kube-public`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:00Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:05Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-jwd4v`,
          'lifecycle.cattle.io/create.namespace-auth': 'true',
          'management.cattle.io/no-default-sa-token':  'true'
        },
        creationTimestamp: '2024-03-07T15:48:53Z',
        fields:            [
          'kube-public',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'field.cattle.io/projectId':   'p-jwd4v',
          'kubernetes.io/metadata.name': 'kube-public'
        },
        name:            'kube-public',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: '91ce13c0-39c1-4350-9ba1-60fe45512b35'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'kube-system',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-system`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-system`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/kube-system`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/kube-system`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:00Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:06Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-jwd4v`,
          'lifecycle.cattle.io/create.namespace-auth': 'true'
        },
        creationTimestamp: '2024-03-07T15:48:53Z',
        fields:            [
          'kube-system',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'field.cattle.io/projectId':   'p-jwd4v',
          'kubernetes.io/metadata.name': 'kube-system'
        },
        name:            'kube-system',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: '12244c34-a7b0-4e90-ad15-539db14a2c63'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'local',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/local`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/local`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/local`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/local`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:17Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:17Z"}]}',
          'lifecycle.cattle.io/create.namespace-auth': 'true'
        },
        creationTimestamp: '2024-03-07T15:52:16Z',
        fields:            [
          'local',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels:          { 'kubernetes.io/metadata.name': 'local' },
        name:            'local',
        ownerReferences: [
          {
            apiVersion: 'management.cattle.io/v3',
            kind:       'Cluster',
            name:       'local',
            uid:        'b671edf0-f8b7-420e-bc2f-ebae1f370e31'
          }
        ],
        relationships: [
          {
            fromId:   'local',
            fromType: 'management.cattle.io.cluster',
            rel:      'owner',
            state:    'active',
            message:  'Resource is Ready'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: '41fdb981-2053-4760-82d6-efa606fe0fd7'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    },
    {
      id:    'tigera-operator',
      type:  'namespace',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/tigera-operator`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/tigera-operator`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces/tigera-operator`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/api/v1/namespaces/tigera-operator`
      },
      apiVersion: 'v1',
      kind:       'Namespace',
      metadata:   {
        annotations: {
          'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:00Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2024-03-07T15:52:06Z"}]}',
          'field.cattle.io/projectId':                 `${ mgmtClusterId }:p-jwd4v`,
          'lifecycle.cattle.io/create.namespace-auth': 'true',
          'management.cattle.io/no-default-sa-token':  'true',
          'meta.helm.sh/release-name':                 'rke2-calico',
          'meta.helm.sh/release-namespace':            'kube-system'
        },
        creationTimestamp: '2024-03-07T15:49:44Z',
        fields:            [
          'tigera-operator',
          'Active',
          '20h'
        ],
        finalizers: [
          'controller.cattle.io/namespace-auth'
        ],
        labels: {
          'app.kubernetes.io/managed-by': 'Helm',
          'field.cattle.io/projectId':    'p-jwd4v',
          'kubernetes.io/metadata.name':  'tigera-operator',
          name:                           'tigera-operator'
        },
        name:          'tigera-operator',
        relationships: [
          {
            fromId:   'kube-system/rke2-calico',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       '',
          name:          'active',
          transitioning: false
        },
        uid: 'a36f00c9-780b-41c7-a0bf-3aad8da2c0a3'
      },
      spec: {
        finalizers: [
          'kubernetes'
        ]
      },
      status: { phase: 'Active' }
    }
  ];
}

function generateFakeDaemonsetsReply(mgmtClusterId) {
  return [
    {
      id:    'calico-system/calico-node',
      type:  'apps.daemonset',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/apps.daemonsets/calico-system/calico-node`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/apps.daemonsets/calico-system/calico-node`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/apps.daemonsets/calico-system/calico-node`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/apis/apps/v1/namespaces/calico-system/daemonsets/calico-node`
      },
      apiVersion: 'apps/v1',
      kind:       'DaemonSet',
      metadata:   {
        annotations:       { 'deprecated.daemonset.template.generation': '1' },
        creationTimestamp: '2024-04-23T12:01:36Z',
        fields:            [
          'calico-node',
          1,
          1,
          1,
          1,
          1,
          'kubernetes.io/os=linux',
          '4h56m',
          'calico-node',
          'docker.io/rancher/mirrored-calico-node:v3.27.2',
          'k8s-app=calico-node'
        ],
        generation:      1,
        name:            'calico-node',
        namespace:       'calico-system',
        ownerReferences: [
          {
            apiVersion:         'operator.tigera.io/v1',
            blockOwnerDeletion: true,
            controller:         true,
            kind:               'Installation',
            name:               'default',
            uid:                'ed1f8537-9942-42ec-a4d2-ee8bab625ab4'
          }
        ],
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'calico-system',
            rel:         'creates',
            selector:    'k8s-app=calico-node'
          },
          {
            toId:    'calico-system/tigera-ca-bundle',
            toType:  'configmap',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'calico-system/node-certs',
            toType:  'secret',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'calico-system/calico-node',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            fromId:   'default',
            fromType: 'operator.tigera.io.installation',
            rel:      'owner',
            state:    'active',
            message:  'Resource is Ready'
          },
          {
            toId:   'calico-system/calico-node-fg7sx',
            toType: 'pod',
            rel:    'owner',
            state:  'running'
          },
          {
            toId:    'calico-system/calico-node-77955f95c9',
            toType:  'apps.controllerrevision',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'All replicas scheduled as expected. Replicas: 1',
          name:          'active',
          transitioning: false
        },
        uid: 'c5dadf5d-1e15-4e64-9094-4a6d6de0ab11'
      },
      spec: {
        revisionHistoryLimit: 10,
        selector:             { matchLabels: { 'k8s-app': 'calico-node' } },
        template:             {
          metadata: {
            annotations: {
              'hash.operator.tigera.io/cni-config':                        '401f1f4b6fdb737003bb7df66d0e201745e76fa4',
              'hash.operator.tigera.io/system':                            'fdde45054a8ae4f629960ce37570929502e59449',
              'tigera-operator.hash.operator.tigera.io/tigera-ca-private': '0d0dd730285875b200bbbbe68cd2211d2a90608e'
            },
            creationTimestamp: null,
            labels:            {
              'app.kubernetes.io/name': 'calico-node',
              'k8s-app':                'calico-node'
            }
          },
          spec: {
            containers: [
              {
                env: [
                  {
                    name:  'DATASTORE_TYPE',
                    value: 'kubernetes'
                  },
                  {
                    name:  'WAIT_FOR_DATASTORE',
                    value: 'true'
                  },
                  {
                    name:  'CLUSTER_TYPE',
                    value: 'k8s,operator'
                  },
                  {
                    name:  'CALICO_DISABLE_FILE_LOGGING',
                    value: 'false'
                  },
                  {
                    name:  'FELIX_DEFAULTENDPOINTTOHOSTACTION',
                    value: 'ACCEPT'
                  },
                  {
                    name:  'FELIX_HEALTHENABLED',
                    value: 'true'
                  },
                  {
                    name:  'FELIX_HEALTHPORT',
                    value: '9099'
                  },
                  {
                    name:      'NODENAME',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'spec.nodeName'
                      }
                    }
                  },
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
                    name:  'FELIX_TYPHAK8SNAMESPACE',
                    value: 'calico-system'
                  },
                  {
                    name:  'FELIX_TYPHAK8SSERVICENAME',
                    value: 'calico-typha'
                  },
                  {
                    name:  'FELIX_TYPHACAFILE',
                    value: '/etc/pki/tls/certs/tigera-ca-bundle.crt'
                  },
                  {
                    name:  'FELIX_TYPHACERTFILE',
                    value: '/node-certs/tls.crt'
                  },
                  {
                    name:  'FELIX_TYPHAKEYFILE',
                    value: '/node-certs/tls.key'
                  },
                  {
                    name:  'FIPS_MODE_ENABLED',
                    value: 'false'
                  },
                  {
                    name:  'FELIX_TYPHACN',
                    value: 'typha-server'
                  },
                  {
                    name:  'CALICO_MANAGE_CNI',
                    value: 'true'
                  },
                  {
                    name:  'CALICO_IPV4POOL_CIDR',
                    value: '10.42.0.0/16'
                  },
                  {
                    name:  'CALICO_IPV4POOL_VXLAN',
                    value: 'Always'
                  },
                  {
                    name:  'CALICO_IPV4POOL_BLOCK_SIZE',
                    value: '26'
                  },
                  {
                    name:  'CALICO_IPV4POOL_NODE_SELECTOR',
                    value: 'all()'
                  },
                  {
                    name:  'CALICO_IPV4POOL_DISABLE_BGP_EXPORT',
                    value: 'false'
                  },
                  {
                    name:  'CALICO_NETWORKING_BACKEND',
                    value: 'vxlan'
                  },
                  {
                    name:  'IP',
                    value: 'autodetect'
                  },
                  {
                    name:  'IP_AUTODETECTION_METHOD',
                    value: 'first-found'
                  },
                  {
                    name:  'IP6',
                    value: 'none'
                  },
                  {
                    name:  'FELIX_IPV6SUPPORT',
                    value: 'false'
                  },
                  {
                    name:  'KUBERNETES_SERVICE_HOST',
                    value: '10.43.0.1'
                  },
                  {
                    name:  'KUBERNETES_SERVICE_PORT',
                    value: '443'
                  }
                ],
                image:           'docker.io/rancher/mirrored-calico-node:v3.27.2',
                imagePullPolicy: 'IfNotPresent',
                lifecycle:       {
                  preStop: {
                    exec: {
                      command: [
                        '/bin/calico-node',
                        '-shutdown'
                      ]
                    }
                  }
                },
                livenessProbe: {
                  failureThreshold: 3,
                  httpGet:          {
                    host:   'localhost',
                    path:   '/liveness',
                    port:   9099,
                    scheme: 'HTTP'
                  },
                  periodSeconds:    60,
                  successThreshold: 1,
                  timeoutSeconds:   10
                },
                name:           'calico-node',
                readinessProbe: {
                  exec: {
                    command: [
                      '/bin/calico-node',
                      '-felix-ready'
                    ]
                  },
                  failureThreshold: 3,
                  periodSeconds:    30,
                  successThreshold: 1,
                  timeoutSeconds:   10
                },
                resources:       {},
                securityContext: {
                  allowPrivilegeEscalation: true,
                  capabilities:             {
                    drop: [
                      'ALL'
                    ]
                  },
                  privileged:     true,
                  runAsGroup:     0,
                  runAsNonRoot:   false,
                  runAsUser:      0,
                  seccompProfile: { type: 'RuntimeDefault' }
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/etc/pki/tls/certs',
                    name:      'tigera-ca-bundle',
                    readOnly:  true
                  },
                  {
                    mountPath: '/etc/pki/tls/cert.pem',
                    name:      'tigera-ca-bundle',
                    readOnly:  true,
                    subPath:   'ca-bundle.crt'
                  },
                  {
                    mountPath: '/lib/modules',
                    name:      'lib-modules',
                    readOnly:  true
                  },
                  {
                    mountPath: '/run/xtables.lock',
                    name:      'xtables-lock'
                  },
                  {
                    mountPath: '/var/run/nodeagent',
                    name:      'policysync'
                  },
                  {
                    mountPath: '/node-certs',
                    name:      'node-certs',
                    readOnly:  true
                  },
                  {
                    mountPath: '/var/run/calico',
                    name:      'var-run-calico'
                  },
                  {
                    mountPath: '/var/lib/calico',
                    name:      'var-lib-calico'
                  },
                  {
                    mountPath: '/var/log/calico/cni',
                    name:      'cni-log-dir'
                  },
                  {
                    mountPath: '/host/etc/cni/net.d',
                    name:      'cni-net-dir'
                  }
                ]
              }
            ],
            dnsPolicy:      'ClusterFirst',
            hostNetwork:    true,
            initContainers: [
              {
                image:           'docker.io/rancher/mirrored-calico-pod2daemon-flexvol:v3.27.2',
                imagePullPolicy: 'IfNotPresent',
                name:            'flexvol-driver',
                resources:       {},
                securityContext: {
                  allowPrivilegeEscalation: true,
                  capabilities:             {
                    drop: [
                      'ALL'
                    ]
                  },
                  privileged:     true,
                  runAsGroup:     0,
                  runAsNonRoot:   false,
                  runAsUser:      0,
                  seccompProfile: { type: 'RuntimeDefault' }
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/host/driver',
                    name:      'flexvol-driver-host'
                  }
                ]
              },
              {
                command: [
                  '/opt/cni/bin/install'
                ],
                env: [
                  {
                    name:  'CNI_CONF_NAME',
                    value: '10-calico.conflist'
                  },
                  {
                    name:  'SLEEP',
                    value: 'false'
                  },
                  {
                    name:  'CNI_NET_DIR',
                    value: '/etc/cni/net.d'
                  },
                  {
                    name:      'CNI_NETWORK_CONFIG',
                    valueFrom: {
                      configMapKeyRef: {
                        key:  'config',
                        name: 'cni-config'
                      }
                    }
                  },
                  {
                    name:  'KUBERNETES_SERVICE_HOST',
                    value: '10.43.0.1'
                  },
                  {
                    name:  'KUBERNETES_SERVICE_PORT',
                    value: '443'
                  }
                ],
                image:           'docker.io/rancher/mirrored-calico-cni:v3.27.2',
                imagePullPolicy: 'IfNotPresent',
                name:            'install-cni',
                resources:       {},
                securityContext: {
                  allowPrivilegeEscalation: true,
                  capabilities:             {
                    drop: [
                      'ALL'
                    ]
                  },
                  privileged:     true,
                  runAsGroup:     0,
                  runAsNonRoot:   false,
                  runAsUser:      0,
                  seccompProfile: { type: 'RuntimeDefault' }
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/host/opt/cni/bin',
                    name:      'cni-bin-dir'
                  },
                  {
                    mountPath: '/host/etc/cni/net.d',
                    name:      'cni-net-dir'
                  }
                ]
              }
            ],
            nodeSelector:                  { 'kubernetes.io/os': 'linux' },
            priorityClassName:             'system-node-critical',
            restartPolicy:                 'Always',
            schedulerName:                 'default-scheduler',
            securityContext:               {},
            serviceAccount:                'calico-node',
            serviceAccountName:            'calico-node',
            terminationGracePeriodSeconds: 5,
            tolerations:                   [
              {
                key:      'CriticalAddonsOnly',
                operator: 'Exists'
              },
              {
                effect:   'NoSchedule',
                operator: 'Exists'
              },
              {
                effect:   'NoExecute',
                operator: 'Exists'
              }
            ],
            volumes: [
              {
                hostPath: {
                  path: '/lib/modules',
                  type: ''
                },
                name: 'lib-modules'
              },
              {
                hostPath: {
                  path: '/run/xtables.lock',
                  type: 'FileOrCreate'
                },
                name: 'xtables-lock'
              },
              {
                hostPath: {
                  path: '/var/run/nodeagent',
                  type: 'DirectoryOrCreate'
                },
                name: 'policysync'
              },
              {
                configMap: {
                  defaultMode: 420,
                  name:        'tigera-ca-bundle'
                },
                name: 'tigera-ca-bundle'
              },
              {
                name:   'node-certs',
                secret: {
                  defaultMode: 420,
                  secretName:  'node-certs'
                }
              },
              {
                hostPath: {
                  path: '/var/run/calico',
                  type: ''
                },
                name: 'var-run-calico'
              },
              {
                hostPath: {
                  path: '/var/lib/calico',
                  type: ''
                },
                name: 'var-lib-calico'
              },
              {
                hostPath: {
                  path: '/opt/cni/bin',
                  type: ''
                },
                name: 'cni-bin-dir'
              },
              {
                hostPath: {
                  path: '/etc/cni/net.d',
                  type: ''
                },
                name: 'cni-net-dir'
              },
              {
                hostPath: {
                  path: '/var/log/calico/cni',
                  type: ''
                },
                name: 'cni-log-dir'
              },
              {
                hostPath: {
                  path: '/var/lib/kubelet/volumeplugins/nodeagent~uds',
                  type: 'DirectoryOrCreate'
                },
                name: 'flexvol-driver-host'
              }
            ]
          }
        },
        updateStrategy: {
          rollingUpdate: {
            maxSurge:       0,
            maxUnavailable: 1
          },
          type: 'RollingUpdate'
        }
      },
      status: {
        currentNumberScheduled: 1,
        desiredNumberScheduled: 1,
        numberAvailable:        1,
        numberMisscheduled:     0,
        numberReady:            1,
        observedGeneration:     1,
        updatedNumberScheduled: 1
      }
    },
    {
      id:    'kube-system/rke2-ingress-nginx-controller',
      type:  'apps.daemonset',
      links: {
        remove: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/apps.daemonsets/kube-system/rke2-ingress-nginx-controller`,
        self:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/apps.daemonsets/kube-system/rke2-ingress-nginx-controller`,
        update: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/apps.daemonsets/kube-system/rke2-ingress-nginx-controller`,
        view:   `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/apis/apps/v1/namespaces/kube-system/daemonsets/rke2-ingress-nginx-controller`
      },
      apiVersion: 'apps/v1',
      kind:       'DaemonSet',
      metadata:   {
        annotations: {
          'deprecated.daemonset.template.generation': '1',
          'field.cattle.io/publicEndpoints':          '[{"nodeName":":alex-test-rke2-cluster-pool1-523c624e-77kwl","addresses":["157.245.39.192"],"port":80,"protocol":"TCP","podName":"kube-system:rke2-ingress-nginx-controller-cxndl","allNodes":false},{"nodeName":":alex-test-rke2-cluster-pool1-523c624e-77kwl","addresses":["157.245.39.192"],"port":443,"protocol":"TCP","podName":"kube-system:rke2-ingress-nginx-controller-cxndl","allNodes":false}]',
          'meta.helm.sh/release-name':                'rke2-ingress-nginx',
          'meta.helm.sh/release-namespace':           'kube-system'
        },
        creationTimestamp: '2024-04-23T12:02:22Z',
        fields:            [
          'rke2-ingress-nginx-controller',
          1,
          1,
          1,
          1,
          1,
          'kubernetes.io/os=linux',
          '4h56m',
          'rke2-ingress-nginx-controller',
          'rancher/nginx-ingress-controller:nginx-1.9.3-hardened1',
          'app.kubernetes.io/component=controller,app.kubernetes.io/instance=rke2-ingress-nginx,app.kubernetes.io/name=rke2-ingress-nginx'
        ],
        generation: 1,
        labels:     {
          'app.kubernetes.io/component':  'controller',
          'app.kubernetes.io/instance':   'rke2-ingress-nginx',
          'app.kubernetes.io/managed-by': 'Helm',
          'app.kubernetes.io/name':       'rke2-ingress-nginx',
          'app.kubernetes.io/part-of':    'rke2-ingress-nginx',
          'app.kubernetes.io/version':    '1.9.3',
          'helm.sh/chart':                'rke2-ingress-nginx-4.8.200'
        },
        name:          'rke2-ingress-nginx-controller',
        namespace:     'kube-system',
        relationships: [
          {
            toType:      'pod',
            toNamespace: 'kube-system',
            rel:         'creates',
            selector:    'app.kubernetes.io/component=controller,app.kubernetes.io/instance=rke2-ingress-nginx,app.kubernetes.io/name=rke2-ingress-nginx'
          },
          {
            toId:    'kube-system/rke2-ingress-nginx-admission',
            toType:  'secret',
            rel:     'uses',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'kube-system/rke2-ingress-nginx',
            toType:  'serviceaccount',
            rel:     'uses',
            state:   'active',
            message: 'Resource is current'
          },
          {
            fromId:   'kube-system/rke2-ingress-nginx',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          },
          {
            toId:   'kube-system/rke2-ingress-nginx-controller-cxndl',
            toType: 'pod',
            rel:    'owner',
            state:  'running'
          },
          {
            toId:    'kube-system/rke2-ingress-nginx-controller-775748958d',
            toType:  'apps.controllerrevision',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'All replicas scheduled as expected. Replicas: 1',
          name:          'active',
          transitioning: false
        },
        uid: 'd4bfedf5-23ae-4817-a6cf-dd68cbb8ccd2'
      },
      spec: {
        revisionHistoryLimit: 10,
        selector:             {
          matchLabels: {
            'app.kubernetes.io/component': 'controller',
            'app.kubernetes.io/instance':  'rke2-ingress-nginx',
            'app.kubernetes.io/name':      'rke2-ingress-nginx'
          }
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels:            {
              'app.kubernetes.io/component':  'controller',
              'app.kubernetes.io/instance':   'rke2-ingress-nginx',
              'app.kubernetes.io/managed-by': 'Helm',
              'app.kubernetes.io/name':       'rke2-ingress-nginx',
              'app.kubernetes.io/part-of':    'rke2-ingress-nginx',
              'app.kubernetes.io/version':    '1.9.3',
              'helm.sh/chart':                'rke2-ingress-nginx-4.8.200'
            }
          },
          spec: {
            containers: [
              {
                args: [
                  '/nginx-ingress-controller',
                  '--election-id=rke2-ingress-nginx-leader',
                  '--controller-class=k8s.io/ingress-nginx',
                  '--ingress-class=nginx',
                  '--configmap=$(POD_NAMESPACE)/rke2-ingress-nginx-controller',
                  '--validating-webhook=:8443',
                  '--validating-webhook-certificate=/usr/local/certificates/cert',
                  '--validating-webhook-key=/usr/local/certificates/key',
                  '--watch-ingress-without-class=true'
                ],
                env: [
                  {
                    name:      'POD_NAME',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.name'
                      }
                    }
                  },
                  {
                    name:      'POD_NAMESPACE',
                    valueFrom: {
                      fieldRef: {
                        apiVersion: 'v1',
                        fieldPath:  'metadata.namespace'
                      }
                    }
                  },
                  {
                    name:  'LD_PRELOAD',
                    value: '/usr/local/lib/libmimalloc.so'
                  }
                ],
                image:           'rancher/nginx-ingress-controller:nginx-1.9.3-hardened1',
                imagePullPolicy: 'IfNotPresent',
                lifecycle:       {
                  preStop: {
                    exec: {
                      command: [
                        '/wait-shutdown'
                      ]
                    }
                  }
                },
                livenessProbe: {
                  failureThreshold: 5,
                  httpGet:          {
                    path:   '/healthz',
                    port:   10254,
                    scheme: 'HTTP'
                  },
                  initialDelaySeconds: 10,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      1
                },
                name:  'rke2-ingress-nginx-controller',
                ports: [
                  {
                    containerPort: 80,
                    hostPort:      80,
                    name:          'http',
                    protocol:      'TCP'
                  },
                  {
                    containerPort: 443,
                    hostPort:      443,
                    name:          'https',
                    protocol:      'TCP'
                  },
                  {
                    containerPort: 8443,
                    name:          'webhook',
                    protocol:      'TCP'
                  }
                ],
                readinessProbe: {
                  failureThreshold: 3,
                  httpGet:          {
                    path:   '/healthz',
                    port:   10254,
                    scheme: 'HTTP'
                  },
                  initialDelaySeconds: 10,
                  periodSeconds:       10,
                  successThreshold:    1,
                  timeoutSeconds:      1
                },
                resources: {
                  requests: {
                    cpu:    '100m',
                    memory: '90Mi'
                  }
                },
                securityContext: {
                  allowPrivilegeEscalation: true,
                  capabilities:             {
                    add: [
                      'NET_BIND_SERVICE'
                    ],
                    drop: [
                      'ALL'
                    ]
                  },
                  runAsUser: 101
                },
                terminationMessagePath:   '/dev/termination-log',
                terminationMessagePolicy: 'File',
                volumeMounts:             [
                  {
                    mountPath: '/usr/local/certificates/',
                    name:      'webhook-cert',
                    readOnly:  true
                  }
                ]
              }
            ],
            dnsPolicy:                     'ClusterFirstWithHostNet',
            nodeSelector:                  { 'kubernetes.io/os': 'linux' },
            restartPolicy:                 'Always',
            schedulerName:                 'default-scheduler',
            securityContext:               {},
            serviceAccount:                'rke2-ingress-nginx',
            serviceAccountName:            'rke2-ingress-nginx',
            terminationGracePeriodSeconds: 300,
            volumes:                       [
              {
                name:   'webhook-cert',
                secret: {
                  defaultMode: 420,
                  secretName:  'rke2-ingress-nginx-admission'
                }
              }
            ]
          }
        },
        updateStrategy: {
          rollingUpdate: {
            maxSurge:       0,
            maxUnavailable: 1
          },
          type: 'RollingUpdate'
        }
      },
      status: {
        currentNumberScheduled: 1,
        desiredNumberScheduled: 1,
        numberAvailable:        1,
        numberMisscheduled:     0,
        numberReady:            1,
        observedGeneration:     1,
        updatedNumberScheduled: 1
      }
    }
  ];
}

function generateFakeNavClusterData(provClusterId = 'some-prov-cluster-id', mgmtClusterId = 'some-mgmt-cluster-id', addEditClusterCapabilities = false): any {
  const fakeData = {
    provClusterObj:      generateProvClusterObj(provClusterId, mgmtClusterId),
    mgmtClusterObj:      generateMgmtClusterObj(provClusterId, mgmtClusterId),
    fakeNodeSchema:      generateFakeNodeSchema(mgmtClusterId),
    fakeCountSchema:     generateFakeCountSchema(mgmtClusterId),
    fakeNamespaceSchema: generateFakeNamespaceSchema(mgmtClusterId),
    fakeDaemonsetSchema: generateFakeDaemonsetSchema(mgmtClusterId),
    fakePodSchema:       generateFakePodSchema(mgmtClusterId),
    fakeCountsReply:     generateFakeCountsReply(mgmtClusterId),
    fakeNamespacesReply: generateFakeNamespacesReply(mgmtClusterId),
    fakeDaemonsetsReply: generateFakeDaemonsetsReply(mgmtClusterId),
  };

  if (addEditClusterCapabilities) {
    fakeData.fakeNodeDriversReply = generateFakeNodeDriversReply();
    fakeData.fakeCloudCredentialsReply = generateFakeCloudCredentialsReply(CLOUD_CRED_ID);
    fakeData.fakeMachineConfigReply = generateFakeMachineConfigReply(provClusterId, MACHINE_POOL_ID);
    fakeData.fakeCloudCredIndividualReply = generateFakeCloudCredIndividualReply(CLOUD_CRED_ID);
    fakeData.fakeSecretsReply = generateFakeSecretsReply();
  }

  return fakeData;
}

export function generateFakeClusterDataAndIntercepts(fakeProvClusterId = 'some-prov-cluster-id', fakeMgmtClusterId = 'some-mgmt-cluster-id', addEditClusterCapabilities = false): {} {
  const longClusterDescription = 'this-is-some-really-really-really-really-really-really-long-description';
  const fakeNavClusterData = generateFakeNavClusterData(fakeProvClusterId, fakeMgmtClusterId, addEditClusterCapabilities);

  // add cluster to fleet clusters for testing https://github.com/rancher/dashboard/issues/9984
  cy.intercept('GET', `/v1/fleet.cattle.io.clusters?*`, (req) => {
    req.continue((res) => {
      const localIndex = res.body.data.findIndex((item) => item.id.includes('/local'));

      if (localIndex >= 0) {
        const localCluster = res.body.data[localIndex];

        localCluster.metadata.annotations['field.cattle.io/description'] = longClusterDescription;
      }

      res.body.data.unshift(fakeNavClusterData.provClusterObj);

      res.send(res.body);
    });
  }).as('fleetClusters');

  // add description to local cluster for testing https://github.com/rancher/dashboard/issues/10441
  // add extra cluster to the nav list to test https://github.com/rancher/dashboard/issues/10452
  cy.intercept('GET', `/v1/provisioning.cattle.io.clusters?*`, (req) => {
    req.continue((res) => {
      const localIndex = res.body.data.findIndex((item) => item.id.includes('/local'));

      if (localIndex >= 0) {
        const localCluster = res.body.data[localIndex];

        localCluster.metadata.annotations['field.cattle.io/description'] = longClusterDescription;
      }

      res.body.data.unshift(fakeNavClusterData.provClusterObj);

      res.send(res.body);
    });
  }).as('provClusters');

  // add extra cluster to the nav list to test https://github.com/rancher/dashboard/issues/10452
  cy.intercept('GET', `/v1/management.cattle.io.clusters?*`, (req) => {
    req.continue((res) => {
      res.body.data.unshift(fakeNavClusterData.mgmtClusterObj);
      res.send(res.body);
    });
  }).as('mgmtClusters');

  // intercept counts for fake cluster https://github.com/rancher/dashboard/issues/10452
  cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/counts?*`, (req) => {
    req.reply({
      statusCode: 200,
      body:       { data: fakeNavClusterData.fakeCountsReply },
    });
  }).as('clusterCounts');

  // intercept namespaces for fake cluster https://github.com/rancher/dashboard/issues/10452
  cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/namespaces?*`, (req) => {
    req.reply({
      statusCode: 200,
      body:       { data: fakeNavClusterData.fakeNamespacesReply },
    });
  }).as('clusterNamespaces');

  // For missing "browsable"/"editable" resources in cluster explorer, add schema HERE! first
  // so that menu entry appears on the side-nav
  //
  // intercept schemas k8s API check for enabling cluster explorer for fake cluster https://github.com/rancher/dashboard/issues/10452
  cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/schemas?*`, (req) => {
    req.reply({
      statusCode: 200,
      body:       {
        data: [
          fakeNavClusterData.fakeNodeSchema,
          fakeNavClusterData.fakeCountSchema,
          fakeNavClusterData.fakeNamespaceSchema,
          fakeNavClusterData.fakeDaemonsetSchema,
          fakeNavClusterData.fakePodSchema
        ]
      },
    });
  }).as('clusterSchemas');

  // intercept pods for fake cluster https://github.com/rancher/dashboard/issues/9874
  cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/pods?*`, (req) => {
    req.reply({
      statusCode: 200,
      body:       { data: [] },
    });
  }).as('clusterPods');

  // intercept nodes for fake cluster https://github.com/rancher/dashboard/issues/9874
  cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/nodes?*`, (req) => {
    req.reply({
      statusCode: 200,
      body:       { data: [] },
    });
  }).as('clusterPods');

  // intercept apps.daemonsets for fake cluster https://github.com/rancher/dashboard/issues/9874
  cy.intercept('GET', `/k8s/clusters/${ fakeMgmtClusterId }/v1/apps.daemonsets?*`, (req) => {
    req.reply({
      statusCode: 200,
      body:       { data: fakeNavClusterData.fakeDaemonsetsReply },
    });
  }).as('clusterPods');

  if (addEditClusterCapabilities) {
    // intercept node drivers for fake cluster edit scenario
    cy.intercept('GET', `/v1/management.cattle.io.nodedrivers?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       { data: [fakeNavClusterData.fakeNodeDriversReply] },
      });
    }).as('nodeDrivers');

    // intercept cloud credentials for fake cluster edit scenario
    cy.intercept('GET', `/v3/cloudcredentials`, (req) => {
      req.reply({
        statusCode: 200,
        body:       { data: [fakeNavClusterData.fakeCloudCredentialsReply] },
      });
    }).as('cloudCreds');

    // intercept machine config for fake cluster edit scenario
    cy.intercept('GET', `/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ fakeProvClusterId }-pool1-${ MACHINE_POOL_ID }?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       fakeNavClusterData.fakeMachineConfigReply,
      });
    }).as('machineConfigDo');

    // intercept individual cloud credential request
    cy.intercept('GET', `/v3/cloudcredentials/cattle-global-data:cc-${ CLOUD_CRED_ID }`, (req) => {
      req.reply({
        statusCode: 200,
        body:       fakeNavClusterData.fakeCloudCredIndividualReply,
      });
    }).as('individualCloudCred');

    // DIGITAL OCEAN REGIONS
    cy.intercept('GET', `/meta/proxy/api.digitalocean.com/v2/regions?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       {
          meta:    { total: 1 },
          regions: [
            {
              name:     'London 1',
              slug:     'lon1',
              features: [
                'backups',
                'ipv6',
                'metadata',
                'install_agent',
                'storage',
                'image_transfer'
              ],
              available: true,
              sizes:     [
                's-1vcpu-1gb',
              ]
            }
          ]
        },
      });
    }).as('doRegions');

    // DIGITAL OCEAN SIZES
    cy.intercept('GET', `/meta/proxy/api.digitalocean.com/v2/sizes?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       {
          meta:  { total: 1 },
          sizes: [
            {
              slug:          's-1vcpu-1gb',
              memory:        1024,
              vcpus:         1,
              disk:          25,
              transfer:      1,
              price_monthly: 6,
              price_hourly:  0.00893,
              regions:       [
                'ams3',
                'blr1',
                'fra1',
                'lon1',
                'nyc1',
                'nyc3',
                'sfo2',
                'sfo3',
                'sgp1',
                'syd1',
                'tor1'
              ],
              available:            true,
              description:          'Basic',
              networking_througput: 2000
            }
          ]
        },
      });
    }).as('doSizes');

    // DIGITAL OCEAN IMAGES
    cy.intercept('GET', `/meta/proxy/api.digitalocean.com/v2/images?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       {
          meta:   { total: 1 },
          images: [
            {
              id:           129211873,
              name:         '20.04 (LTS) x64',
              distribution: 'Ubuntu',
              slug:         'ubuntu-20-04-x64',
              public:       true,
              regions:      [
                'tor1',
                'syd1',
                'sgp1',
                'sfo3',
                'sfo2',
                'sfo1',
                'nyc3',
                'nyc2',
                'nyc1',
                'lon1',
                'fra1',
                'blr1',
                'ams3',
                'ams2'
              ],
              created_at:     '2023-03-20T19:17:23Z',
              min_disk_size:  7,
              type:           'base',
              size_gigabytes: 0.72,
              description:    'Ubuntu 20.04 (LTS) x64',
              tags:           [],
              status:         'available',
              error_message:  ''
            }
          ]
        },
      });
    }).as('doImages');

    // intercept secrets req (for registries in cluster)
    cy.intercept('GET', `/v1/secrets?*`, (req) => {
      req.reply({
        statusCode: 200,
        body:       { data: fakeNavClusterData.fakeSecretsReply },
      });
    }).as('secretsReply');
  }

  return fakeNavClusterData;
}
