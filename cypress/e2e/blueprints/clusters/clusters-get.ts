import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

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
