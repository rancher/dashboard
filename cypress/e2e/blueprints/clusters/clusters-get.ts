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
  data:         [
    {
      id:    'fleet-default/e2e-test',
      type:  'provisioning.cattle.io.cluster',
      links: {
        patch:  `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters/fleet-default/e2e-test`,
        remove: `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters/fleet-default/e2e-test`,
        self:   `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters/fleet-default/e2e-test`,
        update: `${ Cypress.env('api') }/v1/provisioning.cattle.io.clusters/fleet-default/e2e-test`,
        view:   `${ Cypress.env('api') }/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/e2e-test`
      },
      apiVersion: 'provisioning.cattle.io/v1',
      kind:       'Cluster',
      metadata:   {
        annotations: {
          'field.cattle.io/creatorId':                              'user-n5jv2',
          'provisioning.cattle.io/management-cluster-display-name': 'e2e-test'
        },
        creationTimestamp: '2025-06-17T20:17:42Z',
        fields:            [
          'e2e-test',
          null,
          null
        ],
        finalizers: [
          'wrangler.cattle.io/provisioning-cluster-remove',
          'wrangler.cattle.io/rke-cluster-remove',
          'wrangler.cattle.io/cloud-config-secret-remover'
        ],
        generation:    3,
        name:          'e2e-test',
        namespace:     'fleet-default',
        relationships: [
          {
            toId:    'fleet-default/crt-e2e-test-cluster-member',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/crt-e2e-test-cluster-admin',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/r-cluster-e2e-test-view-c-m-zprnxphj-p-n5td7-cr-980d9',
            toType:  'rbac.authorization.k8s.io.rolebinding',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/crt-e2e-test-nodes-manage',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/e2e-test-kubeconfig',
            toType:  'secret',
            rel:     'owner',
            state:   'active',
            message: 'Resource is always ready'
          },
          {
            toId:    'fleet-default/crt-e2e-test-cluster-owner',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:          'c-m-zprnxphj',
            toType:        'management.cattle.io.cluster',
            rel:           'applies',
            state:         'updating',
            message:       'configuring bootstrap node(s) e2e-test-pool1-4zjwv-j7whk: waiting for agent to check in and apply initial plan',
            transitioning: true
          },
          {
            toId:    'fleet-default/nc-e2e-test-pool1-g66hz',
            toType:  'rke-machine-config.cattle.io.amazonec2config',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/e2e-test-managed-system-upgrade-2f38a9',
            toType:  'management.cattle.io.managedchart',
            rel:     'owner',
            state:   'active',
            message: 'Resource is Ready'
          },
          {
            toId:   'fleet-default/e2e-test',
            toType: 'cluster.x-k8s.io.cluster',
            rel:    'owner',
            state:  'provisioned'
          },
          {
            toId:    'fleet-default/r-cluster-e2e-test-view-c-m-zprnxphj-p-p7mrt-cr-846fd',
            toType:  'rbac.authorization.k8s.io.rolebinding',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/crt-e2e-test-nodes-view',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/r-cluster-e2e-test-view',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          }
        ],
        resourceVersion: '35805',
        state:           {
          error:         false,
          message:       'configuring bootstrap node(s) e2e-test-pool1-4zjwv-j7whk: waiting for agent to check in and apply initial plan',
          name:          'updating',
          transitioning: true
        },
        uid: '4ae484c2-745f-45f5-be6e-4fc6af4e206e'
      },
      spec: {
        cloudCredentialSecretName: 'cattle-global-data:cc-skmmb',
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
              dynamicSchemaSpec: '{"resourceFields":{"accessKey":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS Access Key"},"ami":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS machine image"},"blockDurationMinutes":{"type":"string","default":{"stringValue":"0","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS spot instance duration in minutes (60, 120, 180, 240, 300, or 360)"},"deviceName":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS root device name"},"encryptEbsVolume":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Encrypt the EBS volume using the AWS Managed CMK"},"endpoint":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Optional endpoint URL (hostname only or fully qualified URI)"},"httpEndpoint":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Enables or disables the HTTP metadata endpoint on your instances"},"httpTokens":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"The state of token usage for your instance metadata requests."},"iamInstanceProfile":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS IAM Instance Profile"},"insecureTransport":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Disable SSL when sending requests"},"instanceType":{"type":"string","default":{"stringValue":"t2.micro","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS instance type"},"keypairName":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS keypair to use; requires --amazonec2-ssh-keypath"},"kmsKey":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Custom KMS key using the AWS Managed CMK"},"monitoring":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Set this flag to enable CloudWatch monitoring"},"openPort":{"type":"array[string]","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"nullable":true,"create":true,"update":true,"description":"Make the specified port number accessible from the Internet"},"privateAddressOnly":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Only use a private IP address"},"region":{"type":"string","default":{"stringValue":"us-east-1","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS region"},"requestSpotInstance":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Set this flag to request spot instance"},"retries":{"type":"string","default":{"stringValue":"5","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Set retry count for recoverable failures (use -1 to disable)"},"rootSize":{"type":"string","default":{"stringValue":"16","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS root disk size (in GB)"},"secretKey":{"type":"password","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS Secret Key"},"securityGroup":{"type":"array[string]","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":["rancher-nodes"]},"nullable":true,"create":true,"update":true,"description":"AWS VPC security group"},"securityGroupReadonly":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Skip adding default rules to security groups"},"sessionToken":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS Session Token"},"spotPrice":{"type":"string","default":{"stringValue":"0.50","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS spot instance bid price (in dollar)"},"sshKeyContents":{"type":"password","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"File contents for sshKeyContents"},"sshUser":{"type":"string","default":{"stringValue":"ubuntu","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Set the name of the ssh user"},"subnetId":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS VPC subnet id"},"tags":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS Tags (e.g. key1,value1,key2,value2)"},"useEbsOptimizedInstance":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Create an EBS optimized instance"},"usePrivateAddress":{"type":"boolean","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Force the usage of private IP address"},"userdata":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"File contents for userdata"},"volumeType":{"type":"string","default":{"stringValue":"gp2","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"Amazon EBS volume type"},"vpcId":{"type":"string","default":{"stringValue":"","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS VPC id"},"zone":{"type":"string","default":{"stringValue":"a","intValue":0,"boolValue":false,"stringSliceValue":null},"create":true,"update":true,"description":"AWS zone for instance (i.e. a,b,c,d,e)"}}}',
              etcdRole:          true,
              machineConfigRef:  {
                kind: 'Amazonec2Config',
                name: 'nc-e2e-test-pool1-g66hz'
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
        clusterName: 'c-m-zprnxphj',
        conditions:  [
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:42Z',
            reason:         'Reconciling',
            status:         'True',
            transitioning:  true,
            type:           'Reconciling'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:42Z',
            status:         'False',
            transitioning:  false,
            type:           'Stalled'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:51Z',
            status:         'True',
            transitioning:  false,
            type:           'Created'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:18:07Z',
            status:         'True',
            transitioning:  false,
            type:           'RKECluster'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:42Z',
            status:         'True',
            transitioning:  false,
            type:           'BackingNamespaceCreated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:42Z',
            status:         'True',
            transitioning:  false,
            type:           'DefaultProjectCreated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:42Z',
            status:         'True',
            transitioning:  false,
            type:           'SystemProjectCreated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:43Z',
            status:         'True',
            transitioning:  false,
            type:           'InitialRolesPopulated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:43Z',
            status:         'True',
            transitioning:  false,
            type:           'CreatorMadeOwner'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:18:07Z',
            message:        'configuring bootstrap node(s) e2e-test-pool1-4zjwv-j7whk: waiting for agent to check in and apply initial plan',
            reason:         'Waiting',
            status:         'Unknown',
            transitioning:  true,
            type:           'Updated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:18:07Z',
            message:        'configuring bootstrap node(s) e2e-test-pool1-4zjwv-j7whk: waiting for agent to check in and apply initial plan',
            reason:         'Waiting',
            status:         'Unknown',
            transitioning:  true,
            type:           'Provisioned'
          },
          {
            error:          true,
            lastUpdateTime: '2025-06-17T20:18:07Z',
            message:        'configuring bootstrap node(s) e2e-test-pool1-4zjwv-j7whk: waiting for agent to check in and apply initial plan',
            reason:         'Waiting',
            status:         'Unknown',
            transitioning:  false,
            type:           'Ready'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:43Z',
            status:         'True',
            transitioning:  false,
            type:           'NoDiskPressure'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:43Z',
            status:         'True',
            transitioning:  false,
            type:           'NoMemoryPressure'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:44Z',
            status:         'True',
            transitioning:  false,
            type:           'SecretsMigrated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:44Z',
            status:         'True',
            transitioning:  false,
            type:           'ServiceAccountSecretsMigrated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:44Z',
            status:         'True',
            transitioning:  false,
            type:           'RKESecretsMigrated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:44Z',
            status:         'True',
            transitioning:  false,
            type:           'ACISecretsMigrated'
          },
          {
            error:          false,
            lastUpdateTime: '2025-06-17T20:17:50Z',
            status:         'False',
            transitioning:  false,
            type:           'Connected'
          }
        ],
        fleetWorkspaceName: 'fleet-default',
        observedGeneration: 3
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

export function clustersNoDataset(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?*', reply(200, clustersGetEmptyClustersSet)).as('clustersNoData');
}

export function generateClustersDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/provisioning.cattle.io.clusters?*', reply(200, clustersGetResponseSmallSet)).as('clustersDataSmall');
}
