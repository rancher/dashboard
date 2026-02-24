export const mockCapiProvCluster =
     {
       id:    'fleet-default/mocked-capi',
       type:  'provisioning.cattle.io.cluster',
       links: {
         patch: 'https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/mocked-capi', remove: 'https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/mocked-capi', self: 'https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/mocked-capi', update: 'https://localhost:8005/v1/provisioning.cattle.io.clusters/fleet-default/mocked-capi', view: 'https://localhost:8005/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/mocked-capi'
       },
       apiVersion: 'provisioning.cattle.io/v1',
       kind:       'Cluster',
       metadata:   {
         annotations: {
           'field.cattle.io/creatorId': 'user-br7cj', 'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/8yUy2/jNhDG/xV1rhXlyI7lWLciQB+HAItNH4d1DiNytGJFkSo5ytow9L8XlOIXuui2QIHuTSSHH7/5faSOgL3+lXzQzkIJvXevOn5r+zGTyGwo027xmkMKrbYKSng0Q2DykEJHjAoZoTwCWusYWTsb4tBVv5PkQJx57a6EdFRY13W9KRSKYk2FuFdqJfBO5mJ9d7ekWq63xWYNYwoGKzJ/K9dgaKCEPO6iYnMnV6rY0sN2s61Usd6uclpRXm+Ke6oe8oc8ilrsCEqwaOVBSOw1zHOhRxkXakPEQlGNg+G4IfQko4d2qMhbYgoXXK95trrPVt/6lpY+MvItPTpb648TE6V0JILmCa2uKTCUV7jLpCHT3VDe2Qi5TH4k0z026HlnT5DLnU2SaLRMIAVta4+B/SB58PSe6um86yRvKzI5p5btRfsQ5sMqYlxecv3ut+dLtP+aUoey0ZZ+MK5Cc0EgjRuUmG6VIi/eZGnP5C0aSEFaDSVINFo6SEHpgJUhKD9ElEvREXstgwjkX8nDy7lCxDii8P4AZY0mUArEUgna9y7QaeN5rfeOSbJoY4bm5Py0fmngnXPxyn04TmrvXfTCfqBzwdzbf0X8aRb9mbreINPnyIto5Ev4T2Dn0j8GtKz5AOVqTI8gnWXvzDuDlr6Kjt4MiT46+oetSfbmprVlbO1/a+GT8+35pXzJ+yff3qaSwhDIn/6d2hpt6ZfzDPjByk5NL14kOyDZuOSnBLuEG0p69Jy4evqeXYRvdrCz8bx5fMl4fDmn/EyGJDv/vTY0X/BaG3p2g5dvYzlBfMJ+8sTUzdMtHeYn61HMJdkBu5hFjxz/vgtiufBoZUN+EV/t4qosU4u/bo22PnPPr+pgHF/Gl3Ec/wwAAP//oAEfO6AGAAA', 'objectset.rio.cattle.io/id': '5fff76da-65e6-4dd3-a0c1-5002efc59675', 'provisioning.cattle.io/management-cluster-display-name': 'mocked-capi'
         },
         creationTimestamp: '2026-02-19T19:12:57Z',
         fields:            ['mocked-capi', 'v1.34.3+rke2r1', 'c-m-h7mt5x6v', '2026-02-19T19:12:57Z', null, null],
         finalizers:        ['wrangler.cattle.io/cloud-config-secret-remover', 'wrangler.cattle.io/provisioning-cluster-remove', 'wrangler.cattle.io/rke-cluster-remove'],
         generation:        2,
         labels:            { 'objectset.rio.cattle.io/hash': '1efc5e670c3d69e8979bd65931e3e1f764eb8181' },
         name:              'mocked-capi',
         namespace:         'fleet-default',
         relationships:     [{
           toId: 'fleet-default/r-cluster-mocked-capi-view-c-m-h7mt5x6v-p-b2bct-creator-pr-3ba2c', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
         }, {
           toId: 'fleet-default/crt-mocked-capi-nodes-manage', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
         }, {
           toId: 'c-m-h7mt5x6v', toType: 'management.cattle.io.cluster', rel: 'applies', state: 'updating', message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', transitioning: true
         }, {
           toId: 'fleet-default/mocked-capi', toType: 'cluster.x-k8s.io.cluster', rel: 'owner', state: 'provisioned'
         }, {
           toId: 'fleet-default/r-cluster-mocked-capi-view-c-m-h7mt5x6v-p-qkjlg-creator-pr-26063', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
         }, {
           toId: 'fleet-default/r-cluster-mocked-capi-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
         }],
         resourceVersion: '46559',
         state:           {
           error: false, message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', name: 'updating', transitioning: true
         },
         uid: '8bdfb8c5-c8c1-4245-a8ff-251b87b8fc68'
       },
       spec: {
         kubernetesVersion:        'v1.34.3+rke2r1',
         localClusterAuthEndpoint: {},
         rkeConfig:                {
           additionalManifest: 'apiVersion: helm.cattle.io/v1\nkind: HelmChart\nmetadata:\n  name: aws-cloud-controller-manager\n  namespace: kube-system\nspec:\n  chart: aws-cloud-controller-manager\n  repo: https://kubernetes.github.io/cloud-provider-aws\n  targetNamespace: kube-system\n  bootstrap: true\n  valuesContent: |-\n    hostNetworking: true\n    nodeSelector:\n      node-role.kubernetes.io/control-plane: "true"\n    args:\n      - --configure-cloud-routes=false\n      - --v=5\n      - --cloud-provider=aws',
           chartValues:        null,
           dataDirectories:    {},
           infrastructureRef:  {
             apiVersion: 'infrastructure.cluster.x-k8s.io/v1beta2', kind: 'AWSCluster', name: 'mocked-capi', namespace: 'fleet-default'
           },
           machineGlobalConfig: {
             'cloud-provider-name': 'external', cni: 'calico', disable: ['rke2-metrics-server'], 'disable-kube-proxy': false, 'etcd-expose-metrics': false, 'protect-kernel-defaults': false
           },
           machinePoolDefaults: {},
           machinePools:        [{
             etcdRole:         true,
             machineConfigRef: {
               apiVersion: 'infrastructure.cluster.x-k8s.io/v1beta2', kind: 'AWSMachineTemplate', name: 'mocked-capi-etcd', namespace: 'fleet-default'
             },
             name:     'etcd',
             quantity: 3
           }, {
             controlPlaneRole: true,
             machineConfigRef: {
               apiVersion: 'infrastructure.cluster.x-k8s.io/v1beta2', kind: 'AWSMachineTemplate', name: 'mocked-capi-control-plane', namespace: 'fleet-default'
             },
             name:     'ctrl',
             quantity: 2
           }, {
             machineConfigRef: {
               apiVersion: 'infrastructure.cluster.x-k8s.io/v1beta2', kind: 'AWSMachineTemplate', name: 'mocked-capi-worker', namespace: 'fleet-default'
             },
             name:       'wrk',
             quantity:   3,
             userdata:   { inlineUserdata: 'runcmd:\n  - "echo I am the part of the workers!"\n' },
             workerRole: true
           }],
           machineSelectorFiles: [{ fileSources: [{ configMap: { items: [{ key: 'extra-config.yaml', path: '/etc/rancher/rke2/config.yaml.d/extra-config.yaml' }], name: 'mocked-capi-extra-config' }, secret: { name: '' } }] }],
           upgradeStrategy:      {
             controlPlaneDrainOptions: {
               deleteEmptyDirData: false, disableEviction: false, enabled: false, force: false, gracePeriod: 0, skipWaitForDeleteTimeoutSeconds: 0, timeout: 0
             },
             workerDrainOptions: {
               deleteEmptyDirData: false, disableEviction: false, enabled: false, force: false, gracePeriod: 0, skipWaitForDeleteTimeoutSeconds: 0, timeout: 0
             }
           }
         }
       },
       status: {
         clusterName: 'c-m-h7mt5x6v',
         conditions:  [{
           error: false, lastUpdateTime: '2026-02-19T19:12:57Z', reason: 'Reconciling', status: 'True', transitioning: true, type: 'Reconciling'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:12:57Z', status: 'False', transitioning: false, type: 'Stalled'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:13:05Z', status: 'True', transitioning: false, type: 'Created'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:17:25Z', status: 'True', transitioning: false, type: 'RKECluster'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:12:57Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:12:57Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:12:57Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:12:58Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:17:25Z', message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', reason: 'Waiting', status: 'Unknown', transitioning: true, type: 'Updated'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:17:25Z', message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', reason: 'Waiting', status: 'Unknown', transitioning: true, type: 'Provisioned'
         }, {
           error: true, lastUpdateTime: '2026-02-19T19:17:25Z', message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', reason: 'Waiting', status: 'Unknown', transitioning: false, type: 'Ready'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:12:59Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:13:02Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:13:02Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:13:02Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
         }, {
           error: false, lastUpdateTime: '2026-02-19T19:13:04Z', status: 'False', transitioning: false, type: 'Connected'
         }],
         fleetWorkspaceName: 'fleet-default',
         observedGeneration: 2
       }
     };

export const mockCapiMgmtCluster = {
  type:  'management.cattle.io.cluster',
  links: {
    log: 'https://localhost:8005/v1/management.cattle.io.clusters/c-m-h7mt5x6v?link=log', patch: 'blocked', projects: 'https://localhost:8005/v1/management.cattle.io.clusters/c-m-h7mt5x6v?link=projects', remove: 'blocked', schemas: 'https://localhost:8005/v1/management.cattle.io.clusters/c-m-h7mt5x6v?link=schemas', self: 'https://localhost:8005/v1/management.cattle.io.clusters/c-m-h7mt5x6v', shell: 'wss://localhost:8005/v3/clusters/c-m-h7mt5x6v?shell=true', subscribe: 'https://localhost:8005/v1/management.cattle.io.clusters/c-m-h7mt5x6v?link=subscribe', update: 'blocked', view: 'https://localhost:8005/v1/management.cattle.io.clusters/c-m-h7mt5x6v'
  },
  actions: {
    apply: 'https://localhost:8005/v1/management.cattle.io.clusters/c-m-h7mt5x6v?action=apply', generateKubeconfig: 'https://localhost:8005/v3/clusters/c-m-h7mt5x6v?action=generateKubeconfig', importYaml: 'https://localhost:8005/v3/clusters/c-m-h7mt5x6v?action=importYaml'
  },
  apiVersion: 'management.cattle.io/v3',
  id:         'c-m-h7mt5x6v',
  kind:       'Cluster',
  metadata:   {
    annotations: {
      'authz.management.cattle.io/creator-role-bindings': '{"created":["cluster-owner"],"required":["cluster-owner"]}', 'authz.management.cattle.io/initial-sync': 'true', 'field.cattle.io/creatorId': 'user-br7cj', 'lifecycle.cattle.io/create.cluster-agent-controller-cleanup': 'true', 'lifecycle.cattle.io/create.cluster-provisioner-controller': 'true', 'lifecycle.cattle.io/create.cluster-scoped-gc': 'true', 'lifecycle.cattle.io/create.mgmt-cluster-rbac-remove': 'true', 'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/4xSXWvjSgz9Kxc922mcj7ox3IdLuQ/lQm9hYfdZntEk04w1RiM7W0r++zKJsw2lLftkRj7n6Eg6r4C9/06SfGRooEPGLXXEOjOoGmjm4824hAL2ni00cB+GpCRQQEeKFhWheQVkjorqI6f8dJ6CvRIwQqhRHrLAkEjKVmrzDAXE9pmMJtKZ+HhF8Blpzq3KE5u+QMcDk5TbcQ8N9BJHn4fxvL0eoSr++s+z/fvN/9dqjB1BA4xsXkqDvf8jRurRZJoLRFpacjgEheIzV2g7zz6poFKeWGWgz9Fvtykvq7E+9QFfPnB7LCBgS+F0j8+M7zDtoAF0y7ZeIy2rqrbtxtn8WdLCOrtym/l8WaGZ04Ky6NTJlF25qztd/7wdczn1ZE5B2BLrQ4db+n8kEW8zGApATgeSbOZYXA77jYyQTjVLyYjv9RxDOBW8kP3ntyA0IMhmR3IzfctTt2ZczKpVWc2r1lWLxXJd1/NNS5bu3ObW3rnNytTr23ZlVu2V7KC796r7oaUSe1/ioLtmnM8Ws3VmnHf8+EEgiLEN9Eh6iLJ/isGbF2h4CKE4J+BHlP0pEhP5fSx810dRsveRnd/m/WUPlxfkxXpWEsYAjcOQqIAQDYYpxXmKf9n20bNm9tmPnbDHAg6ebTykJyFHQvYS/un/8VcAAAD///VsWSX9AwAA', 'objectset.rio.cattle.io/id': 'cluster-create', 'objectset.rio.cattle.io/owner-gvk': 'provisioning.cattle.io/v1, Kind=Cluster', 'objectset.rio.cattle.io/owner-name': 'mocked-capi', 'objectset.rio.cattle.io/owner-namespace': 'fleet-default', 'provisioning.cattle.io/administrated': 'true', 'provisioning.cattle.io/management-cluster-display-name': 'mocked-capi'
    },
    creationTimestamp: '2026-02-19T19:12:57Z',
    fields:            ['c-m-h7mt5x6v', '2026-02-19T19:12:57Z'],
    finalizers:        ['controller.cattle.io/cluster-agent-controller-cleanup', 'controller.cattle.io/cluster-scoped-gc', 'controller.cattle.io/cluster-provisioner-controller', 'controller.cattle.io/mgmt-cluster-rbac-remove', 'wrangler.cattle.io/mgmt-cluster-remove'],
    generation:        19,
    labels:            { 'objectset.rio.cattle.io/hash': 'af3b75ae3117db9fd17db3e2dfd4f90031ac0e2e' },
    name:              'c-m-h7mt5x6v',
    relationships:     [{
      fromId: 'fleet-default/mocked-capi', fromType: 'provisioning.cattle.io.cluster', rel: 'applies', state: 'updating', message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', transitioning: true
    }, {
      toId: 'c-m-h7mt5x6v-clusterowner', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
    }, {
      toId: 'c-m-h7mt5x6v-clustermember', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
    }],
    resourceVersion: '46557',
    state:           {
      error: false, message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', name: 'updating', transitioning: true
    },
    uid: '988d02a6-8f4f-4e42-9423-101520f1f9d7'
  },
  spec: {
    agentImageOverride: '', answers: {}, clusterSecrets: {}, description: '', desiredAgentImage: 'rancher/rancher-agent:v2.14-101bf122357709bede8f96d8f94c756b4c4b69bb-head', desiredAuthImage: 'rancher/kube-api-auth:v0.2.5', displayName: 'mocked-capi', enableNetworkPolicy: null, fleetWorkspaceName: 'fleet-default', importedConfig: { kubeConfig: '' }, internal: false, localClusterAuthEndpoint: { enabled: false }, windowsPreferedCluster: false
  },
  status: {
    agentImage: '',
    aksStatus:  {
      privateRequiresTunnel: null, rbacEnabled: null, upstreamSpec: null
    },
    aliStatus:   { privateRequiresTunnel: null, upstreamSpec: null },
    allocatable: {
      cpu: '0', cpuRaw: 0, memory: '0', memoryRaw: 0, pods: '0'
    },
    appliedEnableNetworkPolicy: false,
    appliedSpec:                {
      agentImageOverride: '', answers: {}, clusterSecrets: {}, description: '', desiredAgentImage: '', desiredAuthImage: '', displayName: '', enableNetworkPolicy: null, internal: false, localClusterAuthEndpoint: { enabled: false }, windowsPreferedCluster: false
    },
    authImage:    '',
    capabilities: { loadBalancerCapabilities: {} },
    capacity:     {
      cpu: '0', memory: '0', pods: '0'
    },
    conditions: [{
      error: false, lastUpdateTime: '2026-02-19T19:12:57Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:12:57Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:12:57Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:12:58Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:17:25Z', message: 'configuring control plane node(s) mocked-capi-ctrl-7ppvs-7cqst,mocked-capi-ctrl-7ppvs-rbj9n', reason: 'Waiting', status: 'Unknown', transitioning: true, type: 'Updated'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:12:59Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:13:02Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:13:02Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:13:02Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:13:04Z', status: 'False', transitioning: false, type: 'Connected'
    }, {
      error: false, lastUpdateTime: '2026-02-19T19:15:41Z', status: 'True', transitioning: false, type: 'Provisioned'
    }, {
      error: true, lastUpdateTime: '2026-02-19T19:15:49Z', message: 'Cluster agent is not connected', reason: 'Disconnected', status: 'False', transitioning: true, type: 'Ready'
    }],
    connected: false,
    driver:    '',
    eksStatus: {
      generatedNodeRole: '', managedLaunchTemplateID: '', managedLaunchTemplateVersions: null, privateRequiresTunnel: null, securityGroups: null, subnets: null, upstreamSpec: null, virtualNetwork: ''
    },
    gkeStatus: { privateRequiresTunnel: null, upstreamSpec: null },
    limits:    {
      cpu: '0', memory: '0', pods: '0'
    },
    provider:  '',
    requested: {
      cpu: '0', cpuRaw: 0, memory: '0', memoryRaw: 0, pods: '0'
    }
  }
};
