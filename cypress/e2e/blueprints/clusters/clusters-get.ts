import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

export function generateMockClusters(count: number) {
  const clusters = [];
  const states = ['active', 'pending', 'error', 'updating', 'provisioning'];

  // Define different cluster types
  // TODO: Need to figure out how to display Provider (only distro works atm)
  const clusterDisplayConfigs = [
    {
      description:             'Amazon EKS cluster',
      providerLabel:           'eks',
      kubernetesVersion:       'v1.24.15+rke2r1',
      displayedProviderDistro: 'RKE2',
      statusMessage:           'Resource is Ready',
    },
    {
      description:             'Azure AKS cluster',
      providerLabel:           'aks',
      kubernetesVersion:       'v1.25.9+k3s1',
      displayedProviderDistro: 'K3s',
      statusMessage:           'waiting for at least one control plane, etcd, and worker node to be registered',
    },
    {
      description:             'Amazon EC2 RKE2 cluster',
      providerLabel:           'rke2',
      kubernetesVersion:       'v1.26.7+rke2r1',
      displayedProviderDistro: 'RKE2',
      statusMessage:           'Resource is Ready',
    },
    {
      description:             'Azure K3s cluster',
      providerLabel:           'k3s',
      kubernetesVersion:       'v1.24.15+rke2r1',
      displayedProviderDistro: 'RKE2',
      statusMessage:           'Resource is Ready',
    },
    {
      description:             'Local RKE2 cluster',
      providerLabel:           'rke2',
      kubernetesVersion:       'v1.25.9+k3s1',
      displayedProviderDistro: 'K3s',
      statusMessage:           'Resource is Ready',
    },
    {
      description:             'Custom RKE2 cluster',
      providerLabel:           'rke2',
      kubernetesVersion:       'v1.26.7+rke2r1',
      displayedProviderDistro: 'RKE2',
      statusMessage:           'Resource is Ready',
    },
    {
      description:             'Custom K3s cluster',
      providerLabel:           'k3s',
      kubernetesVersion:       'v1.24.15+rke2r1',
      displayedProviderDistro: 'RKE2',
      statusMessage:           'waiting for at least one control plane, etcd, and worker node to be registered',
    },
  ];

  for (let i = 0; i < count; i++) {
    const clusterUniqueId = `${ Cypress._.uniqueId(Date.now().toString()) }-cluster`;
    const stateName = states[i % states.length];
    const displayConfig = clusterDisplayConfigs[i % clusterDisplayConfigs.length];

    const cluster: any = {
      id:         `fleet-default/${ clusterUniqueId }`,
      type:       'provisioning.cattle.io.cluster',
      apiVersion: 'provisioning.cattle.io/v1',
      kind:       'Cluster',
      metadata:   {
        annotations: {
          'field.cattle.io/description':                            clusterUniqueId,
          'provisioning.cattle.io/management-cluster-display-name': clusterUniqueId,
        },
        creationTimestamp: '2025-06-12T13:08:00Z',
        name:              clusterUniqueId,
        namespace:         'fleet-default',
        labels:            { 'provider.cattle.io': displayConfig.providerLabel },
        state:             {
          error:         stateName === 'error',
          message:       stateName === 'error' ? 'Error message' : displayConfig.statusMessage,
          name:          stateName,
          transitioning: stateName === 'updating' || stateName === 'provisioning',
        },
      },
      spec: {
        kubernetesVersion:        displayConfig.kubernetesVersion,
        localClusterAuthEndpoint: {},
        rkeConfig:                {
          machinePools: [{
            name:     'pool1',
            quantity: 1
          }]
        }
      },
      status: {
        agentDeployed:      true,
        clientSecretName:   `${ clusterUniqueId }-kubeconfig`,
        clusterName:        clusterUniqueId,
        observedGeneration: 1,
        ready:              stateName === 'active',
        provider:           displayConfig.displayedProviderDistro,
      }
    };

    clusters.push(cluster);
  }

  return clusters;
}

// GET /v1/provisioning.cattle.io.clusters - return empty clusters data
const clustersGetEmptyClustersSet = {
  type:         'collection',
  links:        { self: `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters` },
  createTypes:  { 'provisioning.cattle.io.cluster': `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters` },
  actions:      {},
  resourceType: 'provisioning.cattle.io.cluster',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  data:         []
};

// GET /v1/provisioning.cattle.io.clusters - small set of clusters data (1 cluster)
const clustersGetResponseSmallSet = {
  type:         'collection',
  links:        { self: `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters` },
  createTypes:  { 'provisioning.cattle.io.cluster': `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters` },
  actions:      {},
  resourceType: 'provisioning.cattle.io.cluster',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:         'fleet-default/test',
    type:       'provisioning.cattle.io.cluster',
    apiVersion: 'provisioning.cattle.io/v1',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'field.cattle.io/creatorId':                              'user-wfsb9',
        'field.cattle.io/description':                            'Description for Custom RKE2',
        'provisioning.cattle.io/management-cluster-display-name': 'test',
      },
      creationTimestamp: '2025-06-12T13:08:00Z',
      fields:            [
        'test',
        'true',
        'test-kubeconfig'
      ],
      finalizers: [
        'wrangler.cattle.io/provisioning-cluster-remove',
        'wrangler.cattle.io/rke-cluster-remove',
        'wrangler.cattle.io/cloud-config-secret-remover'
      ],
      generation: 5,
      name:       'e2e-test',
      namespace:  'fleet-default',
      labels:     {
        'objectset.rio.cattle.io/hash': '52d6fab557e6afd731a9e5c948bc9a242185c1b1',
        'provider.cattle.io':           'rke2',
      },
      relationships:   [],
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       'Resource is Ready',
        name:          'active',
        transitioning: false,
      },
      uid: 'fcd5391c-bd17-49ee-94ca-50a5b19150f9',
    },
    spec: {
      cloudCredentialSecretName: 'cattle-global-data:cc-sdml7',
      kubernetesVersion:         'v1.33.0+rke2r1',
      localClusterAuthEndpoint:  {},
      rkeConfig:                 {
        chartValues:     { 'rke2-calico': {} },
        dataDirectories: {},
        etcd:            {
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
            etcdRole:          true,
            machineConfigRef:  {
              kind: 'Amazonec2Config',
              name: 'nc-test-pool1-gfsdj'
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
            deleteEmptyDirData: true,
            disableEviction:    false,
            enabled:            false,
            force:              false,
            gracePeriod:        -1,
            ignoreDaemonSets:   true,
            ignoreErrors:       false
          },
          workerConcurrency:  '1',
          workerDrainOptions: {
            deleteEmptyDirData: true,
            disableEviction:    false,
            enabled:            false,
            force:              false,
            gracePeriod:        -1,
            ignoreDaemonSets:   true,
            ignoreErrors:       false
          }
        }
      }
    },
    status: {
      agentDeployed:      true,
      clientSecretName:   'test-kubeconfig',
      clusterName:        'c-m-xsh7k748',
      fleetWorkspaceName: 'fleet-default',
      observedGeneration: 5,
      ready:              true,
      provider:           'RKE2',
    }
  }]
};

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function clustersNoDataset(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?*', reply(200, clustersGetEmptyClustersSet)).as('clustersNoData');
}

export function generateClustersDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?*', reply(200, clustersGetResponseSmallSet)).as('clustersDataSmall');
}
