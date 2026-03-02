// mock local cluster and provisioned/healthy aks, eks, gke, imported(k3s) clusters

export const provisioningClusters = [
  {
    id:    'fleet-default/c-4sjtl',
    type:  'provisioning.cattle.io.cluster',
    links: {
      patch: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-4sjtl', remove: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-4sjtl', self: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-4sjtl', update: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-4sjtl', view: 'https://mock-url/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/c-4sjtl'
    },
    apiVersion: 'provisioning.cattle.io/v1',
    id:         'fleet-default/c-4sjtl',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'field.cattle.io/creatorId': 'system:serviceaccount:cattle-system:rancher', 'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/7SST4/TMBDFvwqac1K23VTQSByqBXHgtt9gYr+k3jrjYE+CQpXvjpLNbosQfy4cbb95b34zvlALZcvKVF6IRYKyuiBpPobqCUYTdBNd2BhW9di48NZZKqmLYXDJBXHS5Mb3SRFzE8EKyn5bGr4JYt4MZyqpZeEGLURvBMN99uaLE/vh4dnyr17CLagkkxfpSf0/yVPHZq6h7CeKG+21tVc061LneXzJExYz5jinvPOJpow8V/B/HNuJ04lKQrUreLvd7fbvLFcoLFtr94d7HEzN+7v3221dFQdjXrqziFeTuf685P3CfUtWe0Bzi5p7r7M6dTBzbyvNsYHoR3Q+jDPkQ580tO77svoFYUCMzuJY106cjlRepuz19hEp9NHgEV97F5cxzeDTlD0H/zd3Hwz79WMcez19EtsFJ7o+J2Xt1xUkxAH2MwRxzb2bph8BAAD//0pR4bzuAgAA', 'objectset.rio.cattle.io/id': 'provisioning-cluster-create', 'objectset.rio.cattle.io/owner-gvk': 'management.cattle.io/v3, Kind=Cluster', 'objectset.rio.cattle.io/owner-name': 'c-4sjtl', 'objectset.rio.cattle.io/owner-namespace': '', 'provisioning.cattle.io/management-cluster-display-name': 'eks-mock-cluster'
      },
      creationTimestamp: '2026-02-27T14:26:48Z',
      fields:            ['c-4sjtl', null, 'c-4sjtl', '2026-02-27T14:26:48Z', 'c-4sjtl-kubeconfig', 'true'],
      finalizers:        ['wrangler.cattle.io/cloud-config-secret-remover', 'wrangler.cattle.io/provisioning-cluster-remove', 'wrangler.cattle.io/rke-cluster-remove'],
      generation:        1,
      labels:            { 'objectset.rio.cattle.io/hash': 'eb24a112257dabe4daddd593e9cfa50811fb49cc', 'provider.cattle.io': 'eks' },
      name:              'c-4sjtl',
      namespace:         'fleet-default',
      relationships:     [{
        fromId: 'c-4sjtl', fromType: 'management.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/crt-c-4sjtl-nodes-manage', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-4sjtl-cluster-member', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-4sjtl-nodes-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-4sjtl-cluster-owner', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-4sjtl-cluster-admin', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-4sjtl-view-c-4sjtl-p-5qxsh-creator-project-ow-0ff82', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/c-4sjtl-kubeconfig', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }, {
        toId: 'fleet-default/c-4sjtl', toType: 'fleet.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/r-cluster-c-4sjtl-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-4sjtl-view-c-4sjtl-p-wwzsv-creator-project-ow-c2460', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-4sjtl/c-4sjtl-fleet-default-owner', toType: 'management.cattle.io.clusterroletemplatebinding', rel: 'applies', state: 'active', message: 'Resource is current'
      }],
      resourceVersion: '185037',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: 'b5b9775a-6052-47df-8574-f43213222463'
    },
    spec: {
      clusterAgentDeploymentCustomization: { overrideAffinity: {}, overrideResourceRequirements: {} }, fleetAgentDeploymentCustomization: { overrideAffinity: {}, overrideResourceRequirements: {} }, localClusterAuthEndpoint: {}
    },
    status: {
      agentDeployed:    true,
      clientSecretName: 'c-4sjtl-kubeconfig',
      clusterName:      'c-4sjtl',
      conditions:       [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:36Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:36Z', status: 'False', transitioning: false, type: 'Reconciling'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'False', transitioning: false, type: 'Stalled'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:36Z', status: 'True', transitioning: false, type: 'Created'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'RKECluster'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:26Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:36Z', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:34:21Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:35:43Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:35:44Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:14Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }],
      observedGeneration: 1,
      ready:              true
    }
  }, {
    id:    'fleet-default/c-5hrg8',
    type:  'provisioning.cattle.io.cluster',
    links: {
      patch: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-5hrg8', remove: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-5hrg8', self: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-5hrg8', update: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-5hrg8', view: 'https://mock-url/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/c-5hrg8'
    },
    apiVersion: 'provisioning.cattle.io/v1',
    id:         'fleet-default/c-5hrg8',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'field.cattle.io/creatorId': 'system:serviceaccount:cattle-system:rancher', 'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/4yS3YrbMBCFX6XMtZ3GjuPEgl6UUnrRpxhJE1uNPDLS2CUEv/vibLLJsuzPpeDMme8bdIaeBC0KgjoDMgdBcYHT8gz6HxlJJKvowsqgiKeVC9+dBQVDDJNLLrDjNjd+TEIxN5FQCLJ3R8N/ppi30xEU9MjYUk8sD4Fpk33769j++PVc+WkXY0+gwOTbLrb7L8XTgGaZgeyVxUP2jvaiZl0aPJ5u+xjZnPL2SLlHoSQwZ+BRk//wch2mDhTsy9o2TVViSWW9q6r9Ru+oqAutdVHrYqsbWlcN0g3QUryXgIL2SMu+N+qPcgdPJLmlA47+QpcGMgubDwb99bo/R+l+sx2CYwF1npeYoIxXiURxIvuHmOLlV4Baz/NTAAAA//+w6T2jMwIAAA', 'objectset.rio.cattle.io/id': 'provisioning-cluster-create', 'objectset.rio.cattle.io/owner-gvk': 'management.cattle.io/v3, Kind=Cluster', 'objectset.rio.cattle.io/owner-name': 'c-5hrg8', 'objectset.rio.cattle.io/owner-namespace': '', 'provisioning.cattle.io/management-cluster-display-name': 'gke-mock-cluster'
      },
      creationTimestamp: '2026-02-27T14:58:35Z',
      fields:            ['c-5hrg8', null, 'c-5hrg8', '2026-02-27T14:58:35Z', 'c-5hrg8-kubeconfig', 'true'],
      finalizers:        ['wrangler.cattle.io/cloud-config-secret-remover', 'wrangler.cattle.io/provisioning-cluster-remove', 'wrangler.cattle.io/rke-cluster-remove'],
      generation:        1,
      labels:            { 'objectset.rio.cattle.io/hash': '826d9942a2e2674483b7e161bbb16b15b9e049ae', 'provider.cattle.io': 'gke' },
      name:              'c-5hrg8',
      namespace:         'fleet-default',
      relationships:     [{
        fromId: 'c-5hrg8', fromType: 'management.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/crt-c-5hrg8-cluster-admin', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-5hrg8-view-c-5hrg8-p-8428f-creator-project-ow-8cd4b', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/c-5hrg8-kubeconfig', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }, {
        toId: 'fleet-default/c-5hrg8', toType: 'fleet.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/crt-c-5hrg8-nodes-manage', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-5hrg8-cluster-member', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-5hrg8-cluster-owner', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-5hrg8-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-5hrg8-view-c-5hrg8-p-hdj68-creator-project-ow-4421f', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-5hrg8/c-5hrg8-fleet-default-owner', toType: 'management.cattle.io.clusterroletemplatebinding', rel: 'applies', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-5hrg8-nodes-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }],
      resourceVersion: '193541',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '3dce500b-7bfb-4dcf-a8ed-69dfdc03750a'
    },
    spec:   { localClusterAuthEndpoint: {} },
    status: {
      agentDeployed:    true,
      clientSecretName: 'c-5hrg8-kubeconfig',
      clusterName:      'c-5hrg8',
      conditions:       [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:14Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:15Z', status: 'False', transitioning: false, type: 'Reconciling'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:35Z', status: 'False', transitioning: false, type: 'Stalled'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:15Z', status: 'True', transitioning: false, type: 'Created'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:35Z', status: 'True', transitioning: false, type: 'RKECluster'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:35Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:35Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:11Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:14Z', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '', status: 'Unknown', transitioning: false, type: 'PreBootstrapped'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:00Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:00Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:06Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:30Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }],
      observedGeneration: 1,
      ready:              true
    }
  }, {
    id:    'fleet-default/c-9zj2b',
    type:  'provisioning.cattle.io.cluster',
    links: {
      patch: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-9zj2b', remove: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-9zj2b', self: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-9zj2b', update: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-9zj2b', view: 'https://mock-url/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/c-9zj2b'
    },
    apiVersion: 'provisioning.cattle.io/v1',
    id:         'fleet-default/c-9zj2b',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'field.cattle.io/creatorId': 'system:serviceaccount:cattle-system:rancher', 'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/4yS3WrzMAyGb+VDx3G/NP0BG3YwxtjBrkKxldatIwdbyehK7n2ka9eOsZ9Dw6tXzyN8hJYEHQqCOQIyR0HxkfP0jPWOrGSSWfJxZlEk0MzH/96BgS7FwWcf2fNG2dBnoaRsIhSC4tvR+MKU1GbYg4EWGTfUEstNYFgU/549u7uH98pfuxhbAgNW6dddVf8pnju00wwUnyxusle0DzXncxfwcNnHyPagcJ9VQKEsMBYQsKbw4+W2mLdgYKUtzrUrq4VdanJuNa8rvZ5TqddV46pl43RTlrq8ADpK1xIwgPs87fuifivXBCJRjhrsw4kud2QnthAthvN173vZPrLromcBcxynmKD0Z4lMaSD3REzp9CvAlOP4FgAA//88ZVi+MwIAAA', 'objectset.rio.cattle.io/id': 'provisioning-cluster-create', 'objectset.rio.cattle.io/owner-gvk': 'management.cattle.io/v3, Kind=Cluster', 'objectset.rio.cattle.io/owner-name': 'c-9zj2b', 'objectset.rio.cattle.io/owner-namespace': '', 'provisioning.cattle.io/management-cluster-display-name': 'aks-mock-cluster'
      },
      creationTimestamp: '2026-02-27T14:57:07Z',
      fields:            ['c-9zj2b', null, 'c-9zj2b', '2026-02-27T14:57:07Z', 'c-9zj2b-kubeconfig', 'true'],
      finalizers:        ['wrangler.cattle.io/cloud-config-secret-remover', 'wrangler.cattle.io/provisioning-cluster-remove', 'wrangler.cattle.io/rke-cluster-remove'],
      generation:        1,
      labels:            { 'objectset.rio.cattle.io/hash': '59ca19d023c49edd51b2961e0962fd24fd9f0090', 'provider.cattle.io': 'aks' },
      name:              'c-9zj2b',
      namespace:         'fleet-default',
      relationships:     [{
        fromId: 'c-9zj2b', fromType: 'management.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/r-cluster-c-9zj2b-view-c-9zj2b-p-n7v6t-creator-project-ow-1535a', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/c-9zj2b-kubeconfig', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }, {
        toId: 'fleet-default/c-9zj2b', toType: 'fleet.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/crt-c-9zj2b-cluster-owner', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-9zj2b-nodes-manage', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-9zj2b-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-9zj2b/c-9zj2b-fleet-default-owner', toType: 'management.cattle.io.clusterroletemplatebinding', rel: 'applies', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-9zj2b-cluster-admin', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-9zj2b-cluster-member', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-9zj2b-nodes-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-9zj2b-view-c-9zj2b-p-sxn2r-creator-project-ow-9da80', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }],
      resourceVersion: '192312',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: 'f54382d6-6f1e-41ac-aefd-f3d360bc44bf'
    },
    spec:   { localClusterAuthEndpoint: {} },
    status: {
      agentDeployed:    true,
      clientSecretName: 'c-9zj2b-kubeconfig',
      clusterName:      'c-9zj2b',
      conditions:       [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:23Z', status: 'False', transitioning: false, type: 'Reconciling'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:07Z', status: 'False', transitioning: false, type: 'Stalled'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:23Z', status: 'True', transitioning: false, type: 'Created'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:07Z', status: 'True', transitioning: false, type: 'RKECluster'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:07Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:07Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:11Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:09Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:17Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:21Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:44Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }],
      observedGeneration: 1,
      ready:              true
    }
  }, {
    id:    'fleet-default/c-kkwv2',
    type:  'provisioning.cattle.io.cluster',
    links: {
      patch: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-kkwv2', remove: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-kkwv2', self: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-kkwv2', update: 'https://mock-url/v1/provisioning.cattle.io.clusters/fleet-default/c-kkwv2', view: 'https://mock-url/apis/provisioning.cattle.io/v1/namespaces/fleet-default/clusters/c-kkwv2'
    },
    apiVersion: 'provisioning.cattle.io/v1',
    id:         'fleet-default/c-kkwv2',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'field.cattle.io/creatorId': 'system:serviceaccount:cattle-system:rancher', 'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/4ySzWrrMBCFX+Uyays3RAk319BFKaWLPsVYGseq5ZGRxg4h+N2L0rhxKf1ZCp05c74jnaEjQYuCUJ4BmYOguMApH0P1QkYSySq6sDIo4mnlwl9noYQ+htElF9jxQRk/JKGoTCQUguLL0XBkiuowtlBCh4wH6ohlIRh18efZsb17eLP80YuxIyjBqLY9jptfyVOPJs9A8YFiob1Fe0ezLvUeT/M+RjYn5bo+RCGrWp2ggIhsGoqXjuabeX6kmPeomzWUkE5JqFOWahy8wFSAx4r8t+03mJoMbOpK72xl9rZemz3pf1td7QzVda2tqXS13fy3eq1nSEvxZgIl5MRTAZ/qWxZUeyJZpks9mZzNB4P++kL3gzSPbPvgMtJ5yjJBGa4QieJI9omY4uVnQbmeptcAAAD///mUb+93AgAA', 'objectset.rio.cattle.io/id': 'provisioning-cluster-create', 'objectset.rio.cattle.io/owner-gvk': 'management.cattle.io/v3, Kind=Cluster', 'objectset.rio.cattle.io/owner-name': 'c-kkwv2', 'objectset.rio.cattle.io/owner-namespace': '', 'provisioning.cattle.io/management-cluster-display-name': 'imported-mock-cluster', 'rancher.io/imported-cluster-version-management': 'system-default'
      },
      creationTimestamp: '2026-02-27T15:01:27Z',
      fields:            ['c-kkwv2', null, 'c-kkwv2', '2026-02-27T15:01:27Z', 'c-kkwv2-kubeconfig', 'true'],
      finalizers:        ['wrangler.cattle.io/cloud-config-secret-remover', 'wrangler.cattle.io/provisioning-cluster-remove', 'wrangler.cattle.io/rke-cluster-remove'],
      generation:        1,
      labels:            { 'objectset.rio.cattle.io/hash': 'ccfb35dbc8df0c8e3743b5cefff3dcb3b429d303', 'provider.cattle.io': 'k3s' },
      name:              'c-kkwv2',
      namespace:         'fleet-default',
      relationships:     [{
        fromId: 'c-kkwv2', fromType: 'management.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/crt-c-kkwv2-cluster-admin', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-kkwv2-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-kkwv2-cluster-member', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-kkwv2-nodes-view', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/crt-c-kkwv2-cluster-owner', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-kkwv2-view-c-kkwv2-p-d7hrf-creator-project-ow-af745', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-kkwv2/c-kkwv2-fleet-default-owner', toType: 'management.cattle.io.clusterroletemplatebinding', rel: 'applies', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/c-kkwv2', toType: 'fleet.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'fleet-default/crt-c-kkwv2-nodes-manage', toType: 'rbac.authorization.k8s.io.role', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/r-cluster-c-kkwv2-view-c-kkwv2-p-974bb-creator-project-ow-70b79', toType: 'rbac.authorization.k8s.io.rolebinding', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'fleet-default/c-kkwv2-kubeconfig', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }],
      resourceVersion: '192614',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: 'd33449dc-c35f-41fc-9ed3-1d20329df741'
    },
    spec:   { localClusterAuthEndpoint: {} },
    status: {
      agentDeployed:    true,
      clientSecretName: 'c-kkwv2-kubeconfig',
      clusterName:      'c-kkwv2',
      conditions:       [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:49Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:49Z', status: 'False', transitioning: false, type: 'Reconciling'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'False', transitioning: false, type: 'Stalled'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:49Z', status: 'True', transitioning: false, type: 'Created'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'RKECluster'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:28Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:28Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:28Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:41Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '', status: 'Unknown', transitioning: false, type: 'PreBootstrapped'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:19Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:20Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:49Z', status: 'True', transitioning: false, type: 'Ready'
      }],
      observedGeneration: 1,
      ready:              true
    }
  },
];

export const managementClusters = [
  {
    id:    'c-9zj2b',
    type:  'management.cattle.io.cluster',
    links: {
      log: 'https://mock-url/v1/management.cattle.io.clusters/c-9zj2b?link=log', patch: 'blocked', projects: 'https://mock-url/v1/management.cattle.io.clusters/c-9zj2b?link=projects', remove: 'blocked', schemas: 'https://mock-url/v1/management.cattle.io.clusters/c-9zj2b?link=schemas', self: 'https://mock-url/v1/management.cattle.io.clusters/c-9zj2b', shell: 'wss://mock-url/v3/clusters/c-9zj2b?shell=true', subscribe: 'https://mock-url/v1/management.cattle.io.clusters/c-9zj2b?link=subscribe', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.clusters/c-9zj2b'
    },
    actions: {
      apply: 'https://mock-url/v1/management.cattle.io.clusters/c-9zj2b?action=apply', generateKubeconfig: 'https://mock-url/v3/clusters/c-9zj2b?action=generateKubeconfig', importYaml: 'https://mock-url/v3/clusters/c-9zj2b?action=importYaml'
    },
    apiVersion: 'management.cattle.io/v3',
    id:         'c-9zj2b',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'authz.management.cattle.io/creator-role-bindings': '{"created":["cluster-owner"],"required":["cluster-owner"]}', 'authz.management.cattle.io/initial-sync': 'true', 'clusters.management.cattle.io/ke-last-refresh': '1772231116', 'field.cattle.io/creatorId': 'user-wpds2', 'lifecycle.cattle.io/create.cluster-agent-controller-cleanup': 'true', 'lifecycle.cattle.io/create.cluster-provisioner-controller': 'true', 'lifecycle.cattle.io/create.cluster-scoped-gc': 'true', 'lifecycle.cattle.io/create.mgmt-cluster-rbac-remove': 'true', 'management.cattle.io/current-cluster-controllers-version': '1.35.0'
      },
      creationTimestamp: '2026-02-27T14:57:07Z',
      fields:            ['c-9zj2b', '2026-02-27T14:57:07Z'],
      finalizers:        ['controller.cattle.io/cluster-agent-controller-cleanup', 'controller.cattle.io/cluster-scoped-gc', 'controller.cattle.io/cluster-provisioner-controller', 'controller.cattle.io/mgmt-cluster-rbac-remove', 'wrangler.cattle.io/mgmt-cluster-remove'],
      generateName:      'c-',
      generation:        62,
      labels:            { 'cattle.io/creator': 'norman', 'provider.cattle.io': 'aks' },
      name:              'c-9zj2b',
      relationships:     [{
        toId: 'fleet-default/c-9zj2b', toType: 'provisioning.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'c-9zj2b-clustermember', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-9zj2b-clusterowner', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'cattle-global-data/c-9zj2b', toType: 'aks.cattle.io.aksclusterconfig', rel: 'owner', state: 'active'
      }, {
        toId: 'cattle-global-data/cluster-serviceaccounttoken-fxs8x', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }],
      resourceVersion: '289327',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '094dfd2d-ecc5-49a3-aea5-c6ef03377179'
    },
    spec: {
      agentImageOverride: '',
      aksConfig:          {
        authBaseUrl:                null,
        authorizedIpRanges:         null,
        azureCredentialSecret:      'cattle-global-data:cc-kw9fq',
        baseUrl:                    null,
        clusterName:                'aks-mock-cluster',
        dnsPrefix:                  'mock-dns',
        dnsServiceIp:               '10.0.0.10',
        dockerBridgeCidr:           null,
        httpApplicationRouting:     null,
        imported:                   false,
        kubernetesVersion:          '1.35.0',
        linuxAdminUsername:         'azureuser',
        loadBalancerSku:            'standard',
        logAnalyticsWorkspaceGroup: null,
        logAnalyticsWorkspaceName:  null,
        managedIdentity:            null,
        monitoring:                 null,
        networkPlugin:              'kubenet',
        networkPolicy:              null,
        nodePools:                  [{
          availabilityZones: ['1', '2', '3'], count: 1, maxPods: 110, maxSurge: '1', mode: 'System', name: 'agentpool', orchestratorVersion: '1.35.0', osDiskSizeGB: 128, osDiskType: 'Managed', osType: 'Linux', vmSize: 'Standard_D2d_v4'
        }, {
          availabilityZones: ['1', '2', '3'], count: 2, enableAutoScaling: true, maxCount: 3, maxPods: 110, maxSurge: '1', minCount: 1, mode: 'User', name: 'pool1', orchestratorVersion: '1.35.0', osDiskSizeGB: 128, osDiskType: 'Managed', osType: 'Linux', vmSize: 'Standard_D2d_v4'
        }],
        outboundType:     'loadBalancer',
        podCidr:          null,
        privateCluster:   false,
        privateDnsZone:   null,
        resourceGroup:    'imported-mock-cluster',
        resourceLocation: 'eastus',
        serviceCidr:      '10.0.0.0/16',
        subnet:           null,
        tags:             {
          'Account Owner': 'mockAccount@mockemail', 'Account Type': 'group', 'Cost Center': '123456789', Department: 'dep', Environment: 'test', 'Finance Business Partner': 'mockAccount@mockEmail', 'General Ledger Code': '123345656', Stakeholder: 'mockAccount@mockEmail', Team: 'mock-team'
        },
        userAssignedIdentity:        null,
        virtualNetwork:              null,
        virtualNetworkResourceGroup: null
      },
      answers:                  {},
      clusterSecrets:           {},
      description:              '',
      desiredAgentImage:        '',
      desiredAuthImage:         '',
      displayName:              'aks-mock-cluster',
      dockerRootDir:            '/var/lib/docker',
      enableNetworkPolicy:      false,
      fleetWorkspaceName:       'fleet-default',
      internal:                 false,
      localClusterAuthEndpoint: { enabled: false },
      windowsPreferedCluster:   false
    },
    status: {
      agentFeatures: {
        fleet: false, 'managed-system-upgrade-controller': false, 'multi-cluster-management': false, 'multi-cluster-management-agent': true, provisioningprebootstrap: false, provisioningv2: false, rke2: false, turtles: false, 'ui-sql-cache': true
      },
      agentImage: 'rancher/rancher-agent:v2.14-b186acea1a528215f3c08569584157f83b4041a9-head',
      aksStatus:  {
        privateRequiresTunnel: null,
        rbacEnabled:           true,
        upstreamSpec:          {
          authBaseUrl:                'https://login.microsoftonline.com/',
          authorizedIpRanges:         [],
          azureCredentialSecret:      'cattle-global-data:cc-kw9fq',
          baseUrl:                    'https://management.azure.com/',
          clusterName:                'aks-mock-cluster',
          dnsPrefix:                  'mock-dns',
          dnsServiceIp:               '10.0.0.10',
          dockerBridgeCidr:           null,
          httpApplicationRouting:     false,
          imported:                   false,
          kubernetesVersion:          '1.35.0',
          loadBalancerSku:            'standard',
          logAnalyticsWorkspaceGroup: null,
          logAnalyticsWorkspaceName:  null,
          managedIdentity:            true,
          monitoring:                 null,
          networkPlugin:              'kubenet',
          networkPolicy:              null,
          nodePools:                  [{
            availabilityZones: ['1', '2', '3'], count: 1, maxPods: 110, maxSurge: '1', mode: 'System', name: 'agentpool', orchestratorVersion: '1.35.0', osDiskSizeGB: 128, osDiskType: 'Managed', osType: 'Linux', vmSize: 'Standard_D2d_v4'
          }, {
            availabilityZones: ['1', '2', '3'], count: 2, enableAutoScaling: true, maxCount: 3, maxPods: 110, maxSurge: '1', minCount: 1, mode: 'User', name: 'pool1', orchestratorVersion: '1.35.0', osDiskSizeGB: 128, osDiskType: 'Managed', osType: 'Linux', vmSize: 'Standard_D2d_v4'
          }],
          outboundType:     'loadBalancer',
          podCidr:          '10.244.0.0/16',
          privateCluster:   false,
          privateDnsZone:   null,
          resourceGroup:    'imported-mock-cluster',
          resourceLocation: 'eastus',
          serviceCidr:      '10.0.0.0/16',
          subnet:           null,
          tags:             {
            'Account Owner': 'mockAccount@mockemail', 'Account Type': 'group', 'Cost Center': '123456789', Department: 'dep', Environment: 'test', 'Finance Business Partner': 'mockAccount@mockEmail', 'General Ledger Code': '123345656', Stakeholder: 'mockAccount@mockEmail', Team: 'mock-team'
          },
          userAssignedIdentity:        null,
          virtualNetwork:              null,
          virtualNetworkResourceGroup: null
        }
      },
      aliStatus:   { privateRequiresTunnel: null, upstreamSpec: null },
      allocatable: {
        cpu: '3800m', cpuRaw: 3.8000000000000003, memory: '11865740Ki', memoryRaw: 12150517760, pods: '220'
      },
      apiEndpoint:                'https://mock-dns-e05ikx6n.hcp.eastus.azmk8s.io:443',
      appliedAgentEnvVars:        [{ name: 'CATTLE_SERVER_VERSION', value: 'v2.14-b186acea1a528215f3c08569584157f83b4041a9-head' }, { name: 'CATTLE_INSTALL_UUID', value: '1a95b9c9-2b90-4ba5-bbe2-ccd98648e3b1' }, { name: 'CATTLE_INGRESS_IP_DOMAIN', value: 'sslip.io' }],
      appliedEnableNetworkPolicy: false,
      appliedSpec:                {
        agentImageOverride: '',
        aksConfig:          {
          authBaseUrl:                null,
          authorizedIpRanges:         null,
          azureCredentialSecret:      'cattle-global-data:cc-kw9fq',
          baseUrl:                    null,
          clusterName:                'aks-mock-cluster',
          dnsPrefix:                  'mock-dns',
          dnsServiceIp:               '10.0.0.10',
          dockerBridgeCidr:           null,
          httpApplicationRouting:     null,
          imported:                   false,
          kubernetesVersion:          '1.35.0',
          linuxAdminUsername:         'azureuser',
          loadBalancerSku:            'standard',
          logAnalyticsWorkspaceGroup: null,
          logAnalyticsWorkspaceName:  null,
          managedIdentity:            null,
          monitoring:                 null,
          networkPlugin:              'kubenet',
          networkPolicy:              null,
          nodePools:                  [{
            availabilityZones: ['1', '2', '3'], count: 1, maxPods: 110, maxSurge: '1', mode: 'System', name: 'agentpool', orchestratorVersion: '1.35.0', osDiskSizeGB: 128, osDiskType: 'Managed', osType: 'Linux', vmSize: 'Standard_D2d_v4'
          }, {
            availabilityZones: ['1', '2', '3'], count: 2, enableAutoScaling: true, maxCount: 3, maxPods: 110, maxSurge: '1', minCount: 1, mode: 'User', name: 'pool1', orchestratorVersion: '1.35.0', osDiskSizeGB: 128, osDiskType: 'Managed', osType: 'Linux', vmSize: 'Standard_D2d_v4'
          }],
          outboundType:     'loadBalancer',
          podCidr:          null,
          privateCluster:   false,
          privateDnsZone:   null,
          resourceGroup:    'imported-mock-cluster',
          resourceLocation: 'eastus',
          serviceCidr:      '10.0.0.0/16',
          subnet:           null,
          tags:             {
            'Account Owner': 'mockAccount@mockemail', 'Account Type': 'group', 'Cost Center': '123456789', Department: 'dep', Environment: 'test', 'Finance Business Partner': 'mockAccount@mockEmail', 'General Ledger Code': '123345656', Stakeholder: 'mockAccount@mockEmail', Team: 'mock-team'
          },
          userAssignedIdentity:        null,
          virtualNetwork:              null,
          virtualNetworkResourceGroup: null
        },
        answers:                  {},
        clusterSecrets:           {},
        description:              '',
        desiredAgentImage:        '',
        desiredAuthImage:         '',
        displayName:              '',
        enableNetworkPolicy:      null,
        internal:                 false,
        localClusterAuthEndpoint: { enabled: false },
        windowsPreferedCluster:   false
      },
      authImage:    '',
      caCert:       'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUU2RENDQXRDZ0F3SUJBZ0lRRlhIdUJiS3duK25jWFR4UGxTQk42akFOQmdrcWhraUc5dzBCQVFzRkFEQU4KTVFzd0NRWURWUVFERXdKallUQWdGdzB5TmpBeU1qY3hORFE0TVRkYUdBOHlNRFUyTURJeU56RTBOVGd4TjFvdwpEVEVMTUFrR0ExVUVBeE1DWTJFd2dnSWlNQTBHQ1NxR1NJYjNEUUVCQVFVQUE0SUNEd0F3Z2dJS0FvSUNBUURFCkQ4REV3TnFmcnlmZitXVXlqN0FWNUlCVFdYbTV6dTFvWlF2T1grQjFvUUZpcUFSSWpVcXByeWxRUnc3R2tOaGIKVFFtMGo2TTRjU2FOZmdXVXM4TXBhZHhKUHNYNXhlK3IzMk41VlFkZENIZitUTDJ6TGpqY2Z2c08vQUJVSk1wLwpkaTYrWXJSRTFmODZKN3dwcDBwSnRaS2lSTUx3RFVveXdPbm43RGFUYU5qVStxMTVtMi9xQ0JBNUx1aXNYbzAzCjFlRXBLVnhCLzFKeHNoUi9ZN05XbklDK3NsejNBbkZwa2ozK2dhMFZ3Y2JPSjFxakhCNFl5ZjZMNnRSNVU3YU8KTy9pNThBN3RFeFBpcEdmRkluYk9SSEJvWFdQN3Q1V2ppYW0xQ2JTM1p1cENtdlVIK1BRSHBQbGVUaTU2cjNCZQp5U3kvcGVFNmlibllVS1cvbkdBTzcwRjJTRVRzQWFaeGF4ZWhTOGdhd1BLTWZLWHhYUTMxUDRNMnlSN3JMMWFmCmh0WTFNY3ljd2RiMXpncTRmMDVVUmowYW9VbGZUQytackNrTU84SWpKRkc4MW9YR2crV3Z2ZC8wZFovTHFtaTYKTzFQMUw4ODBvTTgwYjRSdGplZ0RITE9Bd2JHbk5FTXRXNDM0aGpMUTFwa2RhalRLSTN2TXVJcWxZY01LdnV5egpkNDRkMldaV3diMU9oM0lNS2JOaWRZWnFJQ3JXMUhLTVJ4b3pGd0IxSk9aSHBWMGxSVG5mSG14WVIzbytKOXN5CndKa3hJc3E2THlmRnc0c3dmOXlaRWhyK2ZvOEtMMVZUb1ZDcDg0bVcrVUovemg4L2RGSXF1WWU3YjNSMDdwS2MKVU5ZbXBRMk1vNGZjaTN6a0JPSU4vZnpZVDVsbWN2YWxtbHU3dGg1aGFRSURBUUFCbzBJd1FEQU9CZ05WSFE4QgpBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVV4T3hFekd5TXYrdlErQkxEClBmbzNXWEtOMXZvd0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dJQkFGWlIxS2JTckxVWEFHWHU5SVZBWXhNSjJtYmUKNFE4bGhRMVdZVXJ2RllsMUFrdWNvVVIyZzB3V0o5MkpXekhKR0tEdlVwV2hPbWZQUVpqRUtBcFhnMmw2Nm5pWApxU0tHYUNQSlloNUpSM3huNStCYy85YjZQUTlvYTU4S3BZRGdteVlYcjJnZUlUZFdtT1M1ZFJoTFBUNTBlWlVsClZXZlhOMVBPWnh1REpZRGlXVmNZRWlFZFVwWVNYQUNwSXZvVXI3Y09ONjY5dVJLY3YwZGxmUlNLaHlja2F4RXQKc0FHZHEySVdaRVU5SHVGQ1hydDZMcFBCWVJ5cXEvM0w4d2NHVTVwVlowckI3VndkdUNjRDE3L3orSVp0aDQyUApBVFBRdXRWUkREK0NTNkpHMStkSlhLSkk4Y2UzWnAzT1FoYVVHQUM1T2xpZkUzWU1NYzNEZURuditHekNCQ3BlCjcyZlUwYkptZzlHNUZuTFJ6Q3hoQWU4YXR1dzlDN05ITkIxbFRxYXpLTENZa0g4UUtBdTQyZk1VYjd6WmRhbWwKWkxub28xUXYxbnBub29WZUpaTWQveVRrK3dLZlpUZHJqRmVHWWx0QVdmK2lkQ2hQUEpFR2tDMU9tOG91b0FlbQpuNnNic2VHVktUOUZBNFo3dTJzUUVZVnV0OEE0VHM4THU3UmhJL2hBdHA4WWxOMWtsS3dVcjkyd0RsSUIwQUxZCmR5eTRkd1YxRTNOMTdMaGNQODAyOTRGUTUwcVYwY3lnRktkanZ4RFhCUmtYZU9ub2xVYmcxUWR1NlVGZ1BlekcKc0VLd2xidHRhbmtkWjlYZGZYUGFVRHQ1MHlhK2M4d3o1c1QvWVhYSE1tRDIxRVBjNDZOd1dxRmJxSjlrQUZjVgpPS0tDZXAyZFltZlZhVXBVCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
      capabilities: { loadBalancerCapabilities: {} },
      capacity:     {
        cpu: '4', memory: '16264844Ki', pods: '220'
      },
      conditions: [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:04Z', status: 'True', transitioning: false, type: 'Provisioned'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:07Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:07Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:57:08Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:11Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:55Z', status: 'True', transitioning: false, type: 'Updated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:09Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:17Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:21Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:44Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }],
      connected: true,
      driver:    'AKS',
      eksStatus: {
        generatedNodeRole: '', managedLaunchTemplateID: '', managedLaunchTemplateVersions: null, privateRequiresTunnel: null, securityGroups: null, subnets: null, upstreamSpec: null, virtualNetwork: ''
      },
      gkeStatus: { privateRequiresTunnel: null, upstreamSpec: null },
      limits:    {
        cpu: '10054m', memory: '19849504Ki', pods: '0'
      },
      linuxWorkerCount: 2,
      nodeCount:        2,
      provider:         'aks',
      requested:        {
        cpu: '1134m', cpuRaw: 1.1340000000000001, memory: '936Mi', memoryRaw: 981467136, pods: '22'
      },
      serviceAccountTokenSecret: 'cluster-serviceaccounttoken-fxs8x',
      version:                   {
        buildDate: '2026-02-20T18:26:27Z', compiler: 'gc', emulationMajor: '1', emulationMinor: '35', gitCommit: '66452049f3d692768c39c797b21b793dce80314e', gitTreeState: 'clean', gitVersion: 'v1.35.0', goVersion: 'go1.25.7', major: '1', minCompatibilityMajor: '1', minCompatibilityMinor: '34', minor: '35', platform: 'linux/amd64'
      }
    }
  }, {
    id:    'c-4sjtl',
    type:  'management.cattle.io.cluster',
    links: {
      log: 'https://mock-url/v1/management.cattle.io.clusters/c-4sjtl?link=log', patch: 'blocked', projects: 'https://mock-url/v1/management.cattle.io.clusters/c-4sjtl?link=projects', remove: 'blocked', schemas: 'https://mock-url/v1/management.cattle.io.clusters/c-4sjtl?link=schemas', self: 'https://mock-url/v1/management.cattle.io.clusters/c-4sjtl', shell: 'wss://mock-url/v3/clusters/c-4sjtl?shell=true', subscribe: 'https://mock-url/v1/management.cattle.io.clusters/c-4sjtl?link=subscribe', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.clusters/c-4sjtl'
    },
    actions: {
      apply: 'https://mock-url/v1/management.cattle.io.clusters/c-4sjtl?action=apply', generateKubeconfig: 'https://mock-url/v3/clusters/c-4sjtl?action=generateKubeconfig', importYaml: 'https://mock-url/v3/clusters/c-4sjtl?action=importYaml'
    },
    apiVersion: 'management.cattle.io/v3',
    id:         'c-4sjtl',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'authz.management.cattle.io/creator-role-bindings': '{"created":["cluster-owner"],"required":["cluster-owner"]}', 'authz.management.cattle.io/initial-sync': 'true', 'clusters.management.cattle.io/ke-last-refresh': '1772231243', 'field.cattle.io/creatorId': 'user-wpds2', 'lifecycle.cattle.io/create.cluster-agent-controller-cleanup': 'true', 'lifecycle.cattle.io/create.cluster-provisioner-controller': 'true', 'lifecycle.cattle.io/create.cluster-scoped-gc': 'true', 'lifecycle.cattle.io/create.mgmt-cluster-rbac-remove': 'true', 'management.cattle.io/current-cluster-controllers-version': '1.35.0-eks-3a10415'
      },
      creationTimestamp: '2026-02-27T14:26:48Z',
      fields:            ['c-4sjtl', '2026-02-27T14:26:48Z'],
      finalizers:        ['controller.cattle.io/cluster-agent-controller-cleanup', 'controller.cattle.io/cluster-scoped-gc', 'controller.cattle.io/cluster-provisioner-controller', 'controller.cattle.io/mgmt-cluster-rbac-remove', 'wrangler.cattle.io/mgmt-cluster-remove'],
      generateName:      'c-',
      generation:        46,
      labels:            { 'cattle.io/creator': 'norman', 'provider.cattle.io': 'eks' },
      name:              'c-4sjtl',
      relationships:     [{
        toId: 'c-4sjtl-clustermember', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-4sjtl-clusterowner', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'cattle-global-data/c-4sjtl', toType: 'eks.cattle.io.eksclusterconfig', rel: 'owner', state: 'active'
      }, {
        toId: 'cattle-global-data/cluster-serviceaccounttoken-hsddp', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }, {
        toId: 'cattle-global-data/cluster-serviceaccounttoken-j22lf', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }, {
        toId: 'fleet-default/c-4sjtl', toType: 'provisioning.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }],
      resourceVersion: '289787',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: 'f3deb6d4-ee32-45d9-9b15-742a824c3959'
    },
    spec: {
      agentImageOverride:                  '',
      answers:                             {},
      clusterAgentDeploymentCustomization: { overrideAffinity: {}, overrideResourceRequirements: {} },
      clusterSecrets:                      {},
      description:                         '',
      desiredAgentImage:                   '',
      desiredAuthImage:                    '',
      displayName:                         'eks-mock-cluster',
      dockerRootDir:                       '/var/lib/docker',
      eksConfig:                           {
        amazonCredentialSecret: 'cattle-global-data:cc-m26m4',
        displayName:            'eks-mock-cluster',
        ebsCSIDriver:           false,
        imported:               false,
        ipFamily:               'ipv4',
        kmsKey:                 null,
        kubernetesVersion:      '1.35',
        loggingTypes:           [],
        nodeGroups:             [{
          arm: null, desiredSize: 2, diskSize: 20, ec2SshKey: null, gpu: false, imageId: null, instanceType: 't3.medium', labels: {}, launchTemplate: null, maxSize: 2, minSize: 2, nodeRole: 'arn:aws:iam::821532311898:role/eks-mock-cluster-node-instance-role-NodeInstanceRole-NJO4Z6o2gX1i', nodegroupName: 'group1', requestSpotInstances: false, resourceTags: {}, spotInstanceTypes: null, subnets: ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'], tags: {}, userData: null, version: '1.35'
        }, {
          arm: null, desiredSize: 1, diskSize: 20, ec2SshKey: null, gpu: false, imageId: null, instanceType: 't3.medium', labels: {}, launchTemplate: null, maxSize: 3, minSize: 1, nodeRole: 'arn:aws:iam::821532311898:role/eks-mock-cluster-node-instance-role-NodeInstanceRole-NJO4Z6o2gX1i', nodegroupName: 'group2', requestSpotInstances: false, resourceTags: {}, spotInstanceTypes: null, subnets: ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'], tags: {}, userData: null, version: '1.35'
        }],
        privateAccess:       false,
        publicAccess:        true,
        publicAccessSources: ['0.0.0.0/0'],
        region:              'us-west-2',
        secretsEncryption:   false,
        securityGroups:      [],
        serviceRole:         null,
        subnets:             ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'],
        tags:                {}
      },
      enableNetworkPolicy:               false,
      fleetAgentDeploymentCustomization: { overrideAffinity: {}, overrideResourceRequirements: {} },
      fleetWorkspaceName:                'fleet-default',
      internal:                          false,
      localClusterAuthEndpoint:          { enabled: false },
      windowsPreferedCluster:            false
    },
    status: {
      agentFeatures: {
        fleet: false, 'managed-system-upgrade-controller': false, 'multi-cluster-management': false, 'multi-cluster-management-agent': true, provisioningprebootstrap: false, provisioningv2: false, rke2: false, turtles: false, 'ui-sql-cache': true
      },
      agentImage: 'rancher/rancher-agent:v2.14-b186acea1a528215f3c08569584157f83b4041a9-head',
      aksStatus:  {
        privateRequiresTunnel: null, rbacEnabled: null, upstreamSpec: null
      },
      aliStatus:   { privateRequiresTunnel: null, upstreamSpec: null },
      allocatable: {
        cpu: '5790m', cpuRaw: 5.79, memory: '10114316Ki', memoryRaw: 10357059584, pods: '51'
      },
      apiEndpoint:                                'https://09D4DE14301C5A6BD5A4585B5AD125C5.gr7.us-west-2.eks.amazonaws.com',
      appliedAgentEnvVars:                        [{ name: 'CATTLE_SERVER_VERSION', value: 'v2.14-b186acea1a528215f3c08569584157f83b4041a9-head' }, { name: 'CATTLE_INSTALL_UUID', value: '1a95b9c9-2b90-4ba5-bbe2-ccd98648e3b1' }, { name: 'CATTLE_INGRESS_IP_DOMAIN', value: 'sslip.io' }],
      appliedClusterAgentDeploymentCustomization: { overrideAffinity: {}, overrideResourceRequirements: {} },
      appliedEnableNetworkPolicy:                 false,
      appliedSpec:                                {
        agentImageOverride: '',
        answers:            {},
        clusterSecrets:     {},
        description:        '',
        desiredAgentImage:  '',
        desiredAuthImage:   '',
        displayName:        '',
        eksConfig:          {
          amazonCredentialSecret: 'cattle-global-data:cc-m26m4',
          displayName:            'eks-mock-cluster',
          ebsCSIDriver:           false,
          imported:               false,
          ipFamily:               'ipv4',
          kmsKey:                 null,
          kubernetesVersion:      '1.35',
          loggingTypes:           [],
          nodeGroups:             [{
            arm: null, desiredSize: 2, diskSize: 20, ec2SshKey: null, gpu: false, imageId: null, instanceType: 't3.medium', labels: {}, launchTemplate: null, maxSize: 2, minSize: 2, nodeRole: 'arn:aws:iam::821532311898:role/eks-mock-cluster-node-instance-role-NodeInstanceRole-NJO4Z6o2gX1i', nodegroupName: 'group1', requestSpotInstances: false, resourceTags: {}, spotInstanceTypes: null, subnets: ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'], tags: {}, userData: null, version: '1.35'
          }, {
            arm: null, desiredSize: 1, diskSize: 20, ec2SshKey: null, gpu: false, imageId: null, instanceType: 't3.medium', labels: {}, launchTemplate: null, maxSize: 3, minSize: 1, nodeRole: 'arn:aws:iam::821532311898:role/eks-mock-cluster-node-instance-role-NodeInstanceRole-NJO4Z6o2gX1i', nodegroupName: 'group2', requestSpotInstances: false, resourceTags: {}, spotInstanceTypes: null, subnets: ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'], tags: {}, userData: null, version: '1.35'
          }],
          privateAccess:       false,
          publicAccess:        true,
          publicAccessSources: ['0.0.0.0/0'],
          region:              'us-west-2',
          secretsEncryption:   false,
          securityGroups:      [],
          serviceRole:         null,
          subnets:             ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'],
          tags:                {}
        },
        enableNetworkPolicy:      null,
        internal:                 false,
        localClusterAuthEndpoint: { enabled: false },
        windowsPreferedCluster:   false
      },
      authImage:    '',
      caCert:       'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lJZjhIUE53N0hqMk13RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TmpBeU1qY3hOREkzTWpSYUZ3MHpOakF5TWpVeE5ETXlNalJhTUJVeApFekFSQmdOVkJBTVRDbXQxWW1WeWJtVjBaWE13Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUURSM0VjS1FzZVV4T1ZOMS9XQ0tEam9qT2dXODl1SFFpdGxOYTljS0c2ejZFdFg4VDJLWkYrK3RLNnAKekN2MnF0Mm52cm9YM3g1ZGdNYmZqcVFlQldWRFA4U0tJdERKUjZEbFJxV3NyaVpVNHZhRkR2WjNNcytJcHhWcgpaT3dycDB0bmQ2ZGhzS1RheW1Wd2prbkgvWTlLOGFwMjdIZGNtcUJUTUkrL1o2Q3Z5SVQ3NUZPQmZNSDAxdm1jCkFDWTNHdzd5Qk9rREZlb0JFeWRUMmMrMVJBZ243eDI0VUVYNkREZENRZytYSzZlRzFDa3lGamQxaThNazlVVWsKR21wcnRuamRrTzZpNHkvamU0TTlVZm8reGtaeTBXS3pNOWZzVC9xY0tRL1RHd29QVGRvK3lPbHh1ZnQ2RWY2cgpZNHNMMWpxUnJERzFobkFYYmFaUXlLTkFoVExyQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJSN3cxcllENFFwSVBncHpDcW1Cc3hWTDZTRjhEQVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ2pqcWwySk1scApweXEzdFpYRG9xczNTM3kxcU92bGJ3di9EbnVER3ZvNWY1NnFlT3lrWTAzUTF3c1lPRTdndzRNY2tneTByMEJ0ClliSHIwRENQZUMxVUlGZmVSb3QzT0R3aGxGbjBFNDEvWlJ3amF5a3ZpMThJNlZIUUdEenczL1prdUE4cFhNbWIKSGJ3c3duWWtzQ2lvN0ViTDkwTjk3Vy9yMXE2VHlGVS9mU3VpY24yZ1FhRHN3TksxQ2tDcndaL2xLYUdIbllZVgpVKy9YSEsvdVZTKytRek5JLzlRcE1aNm1OMG9JdWxFNlBOa0UwbVBaNHNnTE4rbS9aUFZQZ3lKV29hNWptUjFECkZDOC9TbzRYNjR5ZGZBTUQyaUlTZjBaUmNiVjJpeE9SdWVCNGMzYWJOMUFBUDhFeVp5cmxHZ09PaEt4ZlJRYWsKUi9oUG5zOWYyZFo4Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
      capabilities: { loadBalancerCapabilities: {} },
      capacity:     {
        cpu: '6', memory: '11779340Ki', pods: '51'
      },
      conditions: [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:34:20Z', status: 'True', transitioning: false, type: 'Provisioned'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:36Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:48Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:26:49Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:26Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:36Z', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:59:45Z', status: 'True', transitioning: false, type: 'Updated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:34:21Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:35:43Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:35:44Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:36:14Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }],
      connected: true,
      driver:    'EKS',
      eksStatus: {
        generatedNodeRole:             'arn:aws:iam::821532311898:role/eks-mock-cluster-node-instance-role-NodeInstanceRole-NJO4Z6o2gX1i',
        managedLaunchTemplateID:       'lt-05bf8e992d2af15c5',
        managedLaunchTemplateVersions: { group1: '2', group2: '3' },
        privateRequiresTunnel:         null,
        securityGroups:                null,
        subnets:                       ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'],
        upstreamSpec:                  {
          amazonCredentialSecret: 'cattle-global-data:cc-m26m4',
          displayName:            'eks-mock-cluster',
          ebsCSIDriver:           false,
          imported:               false,
          ipFamily:               'ipv4',
          kmsKey:                 '',
          kubernetesVersion:      '1.35',
          loggingTypes:           [],
          nodeGroups:             [{
            arm: null, desiredSize: 2, diskSize: 20, ec2SshKey: null, gpu: false, imageId: null, instanceType: 't3.medium', labels: {}, launchTemplate: null, maxSize: 2, minSize: 2, nodeRole: 'arn:aws:iam::821532311898:role/eks-mock-cluster-node-instance-role-NodeInstanceRole-NJO4Z6o2gX1i', nodegroupName: 'group1', requestSpotInstances: false, resourceTags: {}, spotInstanceTypes: null, subnets: ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'], tags: {}, userData: null, version: '1.35'
          }, {
            arm: null, desiredSize: 1, diskSize: 20, ec2SshKey: null, gpu: false, imageId: null, instanceType: 't3.medium', labels: {}, launchTemplate: null, maxSize: 3, minSize: 1, nodeRole: 'arn:aws:iam::821532311898:role/eks-mock-cluster-node-instance-role-NodeInstanceRole-NJO4Z6o2gX1i', nodegroupName: 'group2', requestSpotInstances: false, resourceTags: {}, spotInstanceTypes: null, subnets: ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'], tags: {}, userData: null, version: '1.35'
          }],
          privateAccess:       false,
          publicAccess:        true,
          publicAccessSources: ['0.0.0.0/0'],
          region:              'us-west-2',
          secretsEncryption:   false,
          securityGroups:      [],
          serviceRole:         null,
          subnets:             ['subnet-02e4caf6f4ee75111', 'subnet-0e537e585e74be9a0'],
          tags:                {}
        },
        virtualNetwork: ''
      },
      gkeStatus: { privateRequiresTunnel: null, upstreamSpec: null },
      limits:    {
        cpu: '0', memory: '340Mi', pods: '0'
      },
      linuxWorkerCount: 3,
      nodeCount:        3,
      provider:         'eks',
      requested:        {
        cpu: '650m', cpuRaw: 0.65, memory: '140Mi', memoryRaw: 146800640, pods: '12'
      },
      serviceAccountTokenSecret: 'cluster-serviceaccounttoken-j22lf',
      version:                   {
        buildDate: '2026-02-15T06:31:55Z', compiler: 'gc', emulationMajor: '1', emulationMinor: '35', gitCommit: '99fc4a6d03122c35c20fe1a658a03b6bfefc681e', gitTreeState: 'clean', gitVersion: 'v1.35.0-eks-3a10415', goVersion: 'go1.25.7', major: '1', minCompatibilityMajor: '1', minCompatibilityMinor: '34', minor: '35', platform: 'linux/amd64'
      }
    }
  }, {
    id:    'c-5hrg8',
    type:  'management.cattle.io.cluster',
    links: {
      log: 'https://mock-url/v1/management.cattle.io.clusters/c-5hrg8?link=log', patch: 'blocked', projects: 'https://mock-url/v1/management.cattle.io.clusters/c-5hrg8?link=projects', remove: 'blocked', schemas: 'https://mock-url/v1/management.cattle.io.clusters/c-5hrg8?link=schemas', self: 'https://mock-url/v1/management.cattle.io.clusters/c-5hrg8', shell: 'wss://mock-url/v3/clusters/c-5hrg8?shell=true', subscribe: 'https://mock-url/v1/management.cattle.io.clusters/c-5hrg8?link=subscribe', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.clusters/c-5hrg8'
    },
    actions: {
      apply: 'https://mock-url/v1/management.cattle.io.clusters/c-5hrg8?action=apply', generateKubeconfig: 'https://mock-url/v3/clusters/c-5hrg8?action=generateKubeconfig', importYaml: 'https://mock-url/v3/clusters/c-5hrg8?action=importYaml'
    },
    apiVersion: 'management.cattle.io/v3',
    id:         'c-5hrg8',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'authz.management.cattle.io/creator-role-bindings': '{"created":["cluster-owner"],"required":["cluster-owner"]}', 'authz.management.cattle.io/initial-sync': 'true', 'clusters.management.cattle.io/ke-last-refresh': '1772231037', 'field.cattle.io/creatorId': 'user-wpds2', 'lifecycle.cattle.io/create.cluster-agent-controller-cleanup': 'true', 'lifecycle.cattle.io/create.cluster-provisioner-controller': 'true', 'lifecycle.cattle.io/create.cluster-scoped-gc': 'true', 'lifecycle.cattle.io/create.mgmt-cluster-rbac-remove': 'true', 'management.cattle.io/current-cluster-controllers-version': '1.35.1-gke.1396000'
      },
      creationTimestamp: '2026-02-27T14:58:35Z',
      fields:            ['c-5hrg8', '2026-02-27T14:58:35Z'],
      finalizers:        ['controller.cattle.io/cluster-agent-controller-cleanup', 'controller.cattle.io/cluster-scoped-gc', 'controller.cattle.io/cluster-provisioner-controller', 'controller.cattle.io/mgmt-cluster-rbac-remove', 'wrangler.cattle.io/mgmt-cluster-remove'],
      generateName:      'c-',
      generation:        41,
      labels:            { 'cattle.io/creator': 'norman', 'provider.cattle.io': 'gke' },
      name:              'c-5hrg8',
      relationships:     [{
        toId: 'fleet-default/c-5hrg8', toType: 'provisioning.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'c-5hrg8-clustermember', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-5hrg8-clusterowner', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'cattle-global-data/c-5hrg8', toType: 'gke.cattle.io.gkeclusterconfig', rel: 'owner', state: 'active'
      }, {
        toId: 'cattle-global-data/cluster-serviceaccounttoken-5x8hx', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }],
      resourceVersion: '289042',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '0d963488-c8ea-4005-8ff1-8a4b640e8fbb'
    },
    spec: {
      agentImageOverride:  '',
      answers:             {},
      clusterSecrets:      {},
      description:         '',
      desiredAgentImage:   '',
      desiredAuthImage:    '',
      displayName:         'gke-mock-cluster',
      dockerRootDir:       '/var/lib/docker',
      enableNetworkPolicy: false,
      fleetWorkspaceName:  'fleet-default',
      gkeConfig:           {
        clusterAddons:          { horizontalPodAutoscaling: true, httpLoadBalancing: true },
        clusterIpv4Cidr:        '10.72.0.0/14',
        clusterName:            'gke-mock-cluster',
        description:            '',
        enableKubernetesAlpha:  false,
        googleCredentialSecret: 'cattle-global-data:cc-x6jzj',
        imported:               false,
        ipAllocationPolicy:     {
          clusterIpv4CidrBlock: '10.72.0.0/14', clusterSecondaryRangeName: 'gke-gke-mock-cluster-pods-2717fec6', servicesIpv4CidrBlock: '34.118.224.0/20', useIpAliases: true
        },
        kubernetesVersion:        '1.35.1-gke.1396000',
        labels:                   {},
        locations:                ['us-central1-c'],
        loggingService:           'logging.googleapis.com/kubernetes',
        maintenanceWindow:        '',
        masterAuthorizedNetworks: {},
        monitoringService:        'monitoring.googleapis.com/kubernetes',
        network:                  'catherine-network',
        networkPolicyEnabled:     false,
        nodePools:                [{
          autoscaling: {
            enabled: true, maxNodeCount: 3, minNodeCount: 1
          },
          config: {
            diskSizeGb: 100, diskType: 'pd-standard', imageType: 'COS_CONTAINERD', machineType: 'n1-standard-2', serviceAccount: 'default'
          },
          initialNodeCount:  3,
          management:        { autoRepair: true, autoUpgrade: true },
          maxPodsConstraint: 110,
          name:              'group-1',
          version:           '1.35.1-gke.1396000'
        }, {
          autoscaling: {
            enabled: true, maxNodeCount: 3, minNodeCount: 1
          },
          config: {
            diskSizeGb: 100, diskType: 'pd-standard', imageType: 'COS_CONTAINERD', machineType: 'n1-standard-2', serviceAccount: 'default'
          },
          initialNodeCount:  1,
          management:        { autoRepair: true, autoUpgrade: true },
          maxPodsConstraint: 110,
          name:              'group-2',
          version:           '1.35.1-gke.1396000'
        }],
        privateClusterConfig: {},
        projectID:            'ei-mock-team',
        region:               '',
        subnetwork:           'catherine-network',
        zone:                 'us-central1-c'
      },
      internal:                 false,
      localClusterAuthEndpoint: { enabled: false },
      windowsPreferedCluster:   false
    },
    status: {
      agentFeatures: {
        fleet: false, 'managed-system-upgrade-controller': false, 'multi-cluster-management': false, 'multi-cluster-management-agent': true, provisioningprebootstrap: false, provisioningv2: false, rke2: false, turtles: false, 'ui-sql-cache': true
      },
      agentImage: 'rancher/rancher-agent:v2.14-b186acea1a528215f3c08569584157f83b4041a9-head',
      aksStatus:  {
        privateRequiresTunnel: null, rbacEnabled: null, upstreamSpec: null
      },
      aliStatus:   { privateRequiresTunnel: null, upstreamSpec: null },
      allocatable: {
        cpu: '3860m', cpuRaw: 3.86, memory: '11478432Ki', memoryRaw: 11753914368, pods: '220'
      },
      apiEndpoint:                'https://34.30.60.24',
      appliedAgentEnvVars:        [{ name: 'CATTLE_SERVER_VERSION', value: 'v2.14-b186acea1a528215f3c08569584157f83b4041a9-head' }, { name: 'CATTLE_INSTALL_UUID', value: '1a95b9c9-2b90-4ba5-bbe2-ccd98648e3b1' }, { name: 'CATTLE_INGRESS_IP_DOMAIN', value: 'sslip.io' }],
      appliedEnableNetworkPolicy: false,
      appliedSpec:                {
        agentImageOverride:  '',
        answers:             {},
        clusterSecrets:      {},
        description:         '',
        desiredAgentImage:   '',
        desiredAuthImage:    '',
        displayName:         '',
        enableNetworkPolicy: null,
        gkeConfig:           {
          clusterAddons:          { horizontalPodAutoscaling: true, httpLoadBalancing: true },
          clusterIpv4Cidr:        '10.72.0.0/14',
          clusterName:            'gke-mock-cluster',
          description:            '',
          enableKubernetesAlpha:  false,
          googleCredentialSecret: 'cattle-global-data:cc-x6jzj',
          imported:               false,
          ipAllocationPolicy:     {
            clusterIpv4CidrBlock: '10.72.0.0/14', clusterSecondaryRangeName: 'gke-gke-mock-cluster-pods-2717fec6', servicesIpv4CidrBlock: '34.118.224.0/20', useIpAliases: true
          },
          kubernetesVersion:        '1.35.1-gke.1396000',
          labels:                   {},
          locations:                ['us-central1-c'],
          loggingService:           'logging.googleapis.com/kubernetes',
          maintenanceWindow:        '',
          masterAuthorizedNetworks: {},
          monitoringService:        'monitoring.googleapis.com/kubernetes',
          network:                  'catherine-network',
          networkPolicyEnabled:     false,
          nodePools:                [{
            autoscaling: {
              enabled: true, maxNodeCount: 3, minNodeCount: 1
            },
            config: {
              diskSizeGb: 100, diskType: 'pd-standard', imageType: 'COS_CONTAINERD', machineType: 'n1-standard-2', serviceAccount: 'default'
            },
            initialNodeCount:  3,
            management:        { autoRepair: true, autoUpgrade: true },
            maxPodsConstraint: 110,
            name:              'group-1',
            version:           '1.35.1-gke.1396000'
          }, {
            autoscaling: {
              enabled: true, maxNodeCount: 3, minNodeCount: 1
            },
            config: {
              diskSizeGb: 100, diskType: 'pd-standard', imageType: 'COS_CONTAINERD', machineType: 'n1-standard-2', serviceAccount: 'default'
            },
            initialNodeCount:  1,
            management:        { autoRepair: true, autoUpgrade: true },
            maxPodsConstraint: 110,
            name:              'group-2',
            version:           '1.35.1-gke.1396000'
          }],
          privateClusterConfig: {},
          projectID:            'ei-mock-team',
          region:               '',
          subnetwork:           'catherine-network',
          zone:                 'us-central1-c'
        },
        internal:                 false,
        localClusterAuthEndpoint: { enabled: false },
        windowsPreferedCluster:   false
      },
      authImage:    '',
      caCert:       'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUVMVENDQXBXZ0F3SUJBZ0lSQUxMS1FOQy9FbzFlbUJNKzJCaFRJaDR3RFFZSktvWklodmNOQVFFTEJRQXcKTHpFdE1Dc0dBMVVFQXhNa1pUYzFaVE5rWkRJdE16RTBaQzAwT0RCakxUazVZV1l0WWpBeE5tWTJaamd4TVdNMQpNQ0FYRFRJMk1ESXlOekV6TlRnMU1Wb1lEekl3TlRZd01qSXdNVFExT0RVeFdqQXZNUzB3S3dZRFZRUURFeVJsCk56VmxNMlJrTWkwek1UUmtMVFE0TUdNdE9UbGhaaTFpTURFMlpqWm1PREV4WXpVd2dnR2lNQTBHQ1NxR1NJYjMKRFFFQkFRVUFBNElCandBd2dnR0tBb0lCZ1FESEVPekVGS1RKb0J3M1FSM0RxVGg2Qkl3QjRFRDlxYytRZFNYWApPTi9ucm51d2F0S0hOS0RUdTFkSlVRdHVVZGswdkhHekZOaVArZ28wNk1PY2RIQXAvMU9CcUFleTdHN3BVdjFPCklFdWl0N2VlTURBbm1zV0NFNFVPb3E1aUYvbmplR2V5a1ZXdGFSNGRkQzdCeXoxMFBlU3NrNjQxeU5zT0RyUEsKeUc5dnpHTkFoY0NodlpjVkNRcnp0R2g5czNNb1RUYUlPdEhqOE9oNUw3RmhkWWdIby9VUndlbExuR2hRYXBGTApQREluU0xVaUF5VVJKTHRybDgrcEtPUlM2TTZnYlNWYm1YM1Z0UG9vNU94TWJteGpIMjByRjU2YmdZWklMbTlSCnVWT2VmWnFCZngwdWJYQWhTRnNlYVc2bUFIbGRlSCtMSmRSNlQzcEhhMzBYVlZPdVZTUjlnSlFxNlJyWXNnTUEKR3FYeEZlREJGTFZJWjZPOXAvT01nb3I1QzVheHo1V0dnUTF0U2F6ZW5JWUpXUDdDeHdUUFBwa2x2L0l5WTFReApFd0l3eVZLVTArK3hSTlZOQTlpTnBlbC9zRVpNZHB0QUphQjBqcTMwRkVUSDBrNHFROGVSckVjOW9ic2tZaStRCkJpM1B4Zzl2NjJTMG1aUXlIK2VtelY0M1Fpc0NBd0VBQWFOQ01FQXdEZ1lEVlIwUEFRSC9CQVFEQWdJRU1BOEcKQTFVZEV3RUIvd1FGTUFNQkFmOHdIUVlEVlIwT0JCWUVGSEZwWlIzZWt3WDdhc1U3YWd5QXAvU1VjdTM0TUEwRwpDU3FHU0liM0RRRUJDd1VBQTRJQmdRQW14MnpPZlpxYWZ4NzJvMllUS1gxVmFwV2JUbHB1YjkrQjJoODJvN0EwCk80ZmlzeXRWRXlGQjNqVU1SWW04VTlVVEN6Z2k5S09rNkxRM1BEUzkxcGdNc0lRRFhwSE1Ta2FObUdRWXE4akMKdTlvYUs0VHR4WlJIMURPM2xoTE5mZzhqdmFrOU1FYkxKODBGdnFxWWUwMmpFa21NbUZUbkxWSTd5U3dRK2ZjLwpCUGhLeFN3QWo2WGNsZ0lPdFVOYlNZUS8wWnk2RjFXRlMvTURGdzNodlF0SVg1WVJUcVJwYll0QnFZdWNTQzJvCitHQmRKT05uV2Zma3REUEVoM3M4VzJwWk10ZnRXNTk2ZzA0OUNETTFZZ21hZy9IZXNEclpEZGwwcVhqaFE4bjYKRkwvbXlub3Q4aDFxNVJkRy8zdU5SRkdrTWZ0bm9SQnZFRWV6ZVZkTzVUeEpiNUx2ZzZTUjFyc0ZRYlhERUVtRQo2UFFhb0JSdHA4MFllMjBBcDhxcCtITnhWeitIbVVqVWxzM2dVRmxHMmpJWWFiaTBCWTdvOVN5ZCtBWlRoc1EwCm40ckRZRVQ4ZERtZVdYSTgrTFpFMEVza1pGc3F0aFNZeWMzc3N1UTNQMk1FSVZMd1VyZEtCV3AzeHl4eHNqb1IKWWluU3U4OG1GVEU0WUh0bjV0VzVmc3M9Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
      capabilities: { loadBalancerCapabilities: {} },
      capacity:     {
        cpu: '4', memory: '15238560Ki', pods: '220'
      },
      conditions: [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:05:57Z', status: 'True', transitioning: false, type: 'Provisioned'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:14Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:35Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:35Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:11Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:07:14Z', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:05:58Z', status: 'True', transitioning: false, type: 'Updated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:00Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:00Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:06Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:30Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }],
      connected: true,
      driver:    'GKE',
      eksStatus: {
        generatedNodeRole: '', managedLaunchTemplateID: '', managedLaunchTemplateVersions: null, privateRequiresTunnel: null, securityGroups: null, subnets: null, upstreamSpec: null, virtualNetwork: ''
      },
      gkeStatus: {
        privateRequiresTunnel: null,
        upstreamSpec:          {
          clusterAddons:          { horizontalPodAutoscaling: true, httpLoadBalancing: true },
          clusterIpv4Cidr:        '10.72.0.0/14',
          clusterName:            'gke-mock-cluster',
          description:            '',
          enableKubernetesAlpha:  false,
          googleCredentialSecret: 'cattle-global-data:cc-x6jzj',
          imported:               false,
          ipAllocationPolicy:     {
            clusterIpv4CidrBlock: '10.72.0.0/14', clusterSecondaryRangeName: 'gke-gke-mock-cluster-pods-2717fec6', servicesIpv4CidrBlock: '34.118.224.0/20', useIpAliases: true
          },
          kubernetesVersion:        '1.35.1-gke.1396000',
          labels:                   {},
          locations:                ['us-central1-c'],
          loggingService:           'logging.googleapis.com/kubernetes',
          maintenanceWindow:        '',
          masterAuthorizedNetworks: {},
          monitoringService:        'monitoring.googleapis.com/kubernetes',
          network:                  'catherine-network',
          networkPolicyEnabled:     false,
          nodePools:                [{
            autoscaling: {
              enabled: true, maxNodeCount: 3, minNodeCount: 1
            },
            config: {
              diskSizeGb: 100, diskType: 'pd-standard', imageType: 'COS_CONTAINERD', machineType: 'n1-standard-2', serviceAccount: 'default'
            },
            initialNodeCount:  3,
            management:        { autoRepair: true, autoUpgrade: true },
            maxPodsConstraint: 110,
            name:              'group-1',
            version:           '1.35.1-gke.1396000'
          }, {
            autoscaling: {
              enabled: true, maxNodeCount: 3, minNodeCount: 1
            },
            config: {
              diskSizeGb: 100, diskType: 'pd-standard', imageType: 'COS_CONTAINERD', machineType: 'n1-standard-2', serviceAccount: 'default'
            },
            initialNodeCount:  1,
            management:        { autoRepair: true, autoUpgrade: true },
            maxPodsConstraint: 110,
            name:              'group-2',
            version:           '1.35.1-gke.1396000'
          }],
          privateClusterConfig: {},
          projectID:            'ei-mock-team',
          region:               '',
          subnetwork:           'catherine-network',
          zone:                 'us-central1-c'
        }
      },
      limits: {
        cpu: '13043m', memory: '12347432960', pods: '0'
      },
      linuxWorkerCount: 2,
      nodeCount:        2,
      provider:         'gke',
      requested:        {
        cpu: '1314m', cpuRaw: 1.314, memory: '1875336320', memoryRaw: 1875336320, pods: '27'
      },
      serviceAccountTokenSecret: 'cluster-serviceaccounttoken-5x8hx',
      version:                   {
        buildDate: '2026-02-13T20:16:51Z', compiler: 'gc', emulationMajor: '1', emulationMinor: '35', gitCommit: 'f8f53d264a0ff4653ba48c7ae66a0cea11c11399', gitTreeState: 'clean', gitVersion: 'v1.35.1-gke.1396000', goVersion: 'go1.25.6 X:boringcrypto', major: '1', minCompatibilityMajor: '1', minCompatibilityMinor: '34', minor: '35', platform: 'linux/amd64'
      }
    }
  }, {
    id:    'c-kkwv2',
    type:  'management.cattle.io.cluster',
    links: {
      log: 'https://mock-url/v1/management.cattle.io.clusters/c-kkwv2?link=log', patch: 'blocked', projects: 'https://mock-url/v1/management.cattle.io.clusters/c-kkwv2?link=projects', remove: 'blocked', schemas: 'https://mock-url/v1/management.cattle.io.clusters/c-kkwv2?link=schemas', self: 'https://mock-url/v1/management.cattle.io.clusters/c-kkwv2', shell: 'wss://mock-url/v3/clusters/c-kkwv2?shell=true', subscribe: 'https://mock-url/v1/management.cattle.io.clusters/c-kkwv2?link=subscribe', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.clusters/c-kkwv2'
    },
    actions: {
      apply: 'https://mock-url/v1/management.cattle.io.clusters/c-kkwv2?action=apply', generateKubeconfig: 'https://mock-url/v3/clusters/c-kkwv2?action=generateKubeconfig', importYaml: 'https://mock-url/v3/clusters/c-kkwv2?action=importYaml'
    },
    apiVersion: 'management.cattle.io/v3',
    id:         'c-kkwv2',
    kind:       'Cluster',
    metadata:   {
      annotations: {
        'authz.management.cattle.io/creator-role-bindings': '{"created":["cluster-owner"],"required":["cluster-owner"]}', 'authz.management.cattle.io/initial-sync': 'true', 'field.cattle.io/creatorId': 'user-wpds2', 'lifecycle.cattle.io/create.cluster-agent-controller-cleanup': 'true', 'lifecycle.cattle.io/create.cluster-provisioner-controller': 'true', 'lifecycle.cattle.io/create.cluster-scoped-gc': 'true', 'lifecycle.cattle.io/create.mgmt-cluster-rbac-remove': 'true', 'management.cattle.io/current-cluster-controllers-version': '1.34.4+k3s1', 'provisioner.cattle.io/ke-driver-update': 'updated', 'rancher.io/imported-cluster-version-management': 'system-default'
      },
      creationTimestamp: '2026-02-27T15:01:27Z',
      fields:            ['c-kkwv2', '2026-02-27T15:01:27Z'],
      finalizers:        ['controller.cattle.io/cluster-agent-controller-cleanup', 'controller.cattle.io/cluster-scoped-gc', 'controller.cattle.io/cluster-provisioner-controller', 'controller.cattle.io/mgmt-cluster-rbac-remove', 'wrangler.cattle.io/mgmt-cluster-remove'],
      generateName:      'c-',
      generation:        27,
      labels:            { 'cattle.io/creator': 'norman', 'provider.cattle.io': 'k3s' },
      name:              'c-kkwv2',
      relationships:     [{
        toId: 'fleet-default/c-kkwv2', toType: 'provisioning.cattle.io.cluster', rel: 'applies', state: 'active', message: 'Resource is Ready'
      }, {
        toId: 'c-kkwv2-clustermember', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'c-kkwv2-clusterowner', toType: 'rbac.authorization.k8s.io.clusterrole', rel: 'owner', state: 'active', message: 'Resource is current'
      }, {
        toId: 'cattle-global-data/cluster-serviceaccounttoken-8dpb4', toType: 'secret', rel: 'owner', state: 'active', message: 'Resource is always ready'
      }],
      resourceVersion: '193450',
      state:           {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: 'ecc63610-5dcd-4b7b-9228-3de8d3e33ea0'
    },
    spec: {
      agentImageOverride: '', answers: {}, clusterSecrets: {}, description: '', desiredAgentImage: '', desiredAuthImage: '', displayName: 'imported-mock-cluster', dockerRootDir: '/var/lib/docker', enableNetworkPolicy: false, fleetWorkspaceName: 'fleet-default', importedConfig: { kubeConfig: '' }, internal: false, k3sConfig: { k3supgradeStrategy: { serverConcurrency: 1, workerConcurrency: 1 }, kubernetesVersion: 'v1.34.4+k3s1' }, localClusterAuthEndpoint: { enabled: false }, windowsPreferedCluster: false
    },
    status: {
      agentFeatures: {
        fleet: false, 'managed-system-upgrade-controller': true, 'multi-cluster-management': false, 'multi-cluster-management-agent': true, provisioningprebootstrap: false, provisioningv2: false, rke2: false, turtles: false, 'ui-sql-cache': true
      },
      agentImage: 'rancher/rancher-agent:v2.14-b186acea1a528215f3c08569584157f83b4041a9-head',
      aksStatus:  {
        privateRequiresTunnel: null, rbacEnabled: null, upstreamSpec: null
      },
      aliStatus:   { privateRequiresTunnel: null, upstreamSpec: null },
      allocatable: {
        cpu: '8', cpuRaw: 8, memory: '32484188Ki', memoryRaw: 33263808512, pods: '110'
      },
      apiEndpoint:                'https://10.43.0.1:443',
      appliedAgentEnvVars:        [{ name: 'CATTLE_SERVER_VERSION', value: 'v2.14-b186acea1a528215f3c08569584157f83b4041a9-head' }, { name: 'CATTLE_INSTALL_UUID', value: '1a95b9c9-2b90-4ba5-bbe2-ccd98648e3b1' }, { name: 'CATTLE_INGRESS_IP_DOMAIN', value: 'sslip.io' }],
      appliedEnableNetworkPolicy: false,
      appliedSpec:                {
        agentImageOverride: '', answers: {}, clusterSecrets: {}, description: '', desiredAgentImage: '', desiredAuthImage: '', displayName: '', enableNetworkPolicy: null, internal: false, localClusterAuthEndpoint: { enabled: false }, windowsPreferedCluster: false
      },
      authImage:    '',
      caCert:       'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUJkekNDQVIyZ0F3SUJBZ0lCQURBS0JnZ3Foa2pPUFFRREFqQWpNU0V3SHdZRFZRUUREQmhyTTNNdGMyVnkKZG1WeUxXTmhRREUzTnpJeU1EUTFORGN3SGhjTk1qWXdNakkzTVRVd01qSTNXaGNOTXpZd01qSTFNVFV3TWpJMwpXakFqTVNFd0h3WURWUVFEREJock0zTXRjMlZ5ZG1WeUxXTmhRREUzTnpJeU1EUTFORGN3V1RBVEJnY3Foa2pPClBRSUJCZ2dxaGtqT1BRTUJCd05DQUFTMUNheEJtT2ZiRzJVYzdGL2EraXhxNTF1Q1dHSDVONVdEKzJNVjBETDQKZVNLaFhNUEF1NzFhak5qQ1VwdGhmWllKVTJzQXp5a1QyWWJLL1pKbjFJbmhvMEl3UURBT0JnTlZIUThCQWY4RQpCQU1DQXFRd0R3WURWUjBUQVFIL0JBVXdBd0VCL3pBZEJnTlZIUTRFRmdRVU9IdXRNT3AvMWxaMTJ6SGZVNXJuClNIQnBYRDB3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUlnT2dabUpwNnNZN09jWjVqTXJQQVBQdUhFS01ZVlBjT3oKekpaUDNHSnhyeTBDSVFDcjNYNm52WXlKdkFLeG1RZllscG5QejBxTUt6eEFsYUs5cUVJT2k2dWZ5QT09Ci0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K',
      capabilities: { loadBalancerCapabilities: {} },
      capacity:     {
        cpu: '8', memory: '32484188Ki', pods: '110'
      },
      conditions: [{
        error: false, lastUpdateTime: '', status: 'True', transitioning: false, type: 'Pending'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:29Z', status: 'True', transitioning: false, type: 'Provisioned'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:49Z', status: 'True', transitioning: false, type: 'Waiting'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'BackingNamespaceCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'DefaultProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'SystemProjectCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'InitialRolesPopulated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:27Z', status: 'True', transitioning: false, type: 'CreatorMadeOwner'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:28Z', status: 'True', transitioning: false, type: 'NoDiskPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:28Z', status: 'True', transitioning: false, type: 'NoMemoryPressure'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:01:28Z', status: 'True', transitioning: false, type: 'ServiceAccountSecretsMigrated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:41Z', status: 'True', transitioning: false, type: 'Connected'
      }, {
        error: false, lastUpdateTime: '', status: 'Unknown', transitioning: false, type: 'PreBootstrapped'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:19Z', status: 'True', transitioning: false, type: 'AgentTlsStrictCheck'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:20Z', status: 'True', transitioning: false, type: 'SystemAccountCreated'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'AgentDeployed'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:21Z', status: 'True', transitioning: false, type: 'GlobalAdminsSynced'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:49Z', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:31Z', status: 'True', transitioning: false, type: 'Updated'
      }],
      connected: true,
      driver:    'k3s',
      eksStatus: {
        generatedNodeRole: '', managedLaunchTemplateID: '', managedLaunchTemplateVersions: null, privateRequiresTunnel: null, securityGroups: null, subnets: null, upstreamSpec: null, virtualNetwork: ''
      },
      gkeStatus: { privateRequiresTunnel: null, upstreamSpec: null },
      limits:    {
        cpu: '0', memory: '170Mi', pods: '0'
      },
      nodeCount: 1,
      provider:  'k3s',
      requested: {
        cpu: '200m', cpuRaw: 0.2, memory: '140Mi', memoryRaw: 146800640, pods: '9'
      },
      serviceAccountTokenSecret: 'cluster-serviceaccounttoken-8dpb4',
      version:                   {
        buildDate: '2026-02-12T23:46:53Z', compiler: 'gc', emulationMajor: '1', emulationMinor: '34', gitCommit: 'c6017918a65c824ce8d321db15267c8a317cd39d', gitTreeState: 'clean', gitVersion: 'v1.34.4+k3s1', goVersion: 'go1.24.12', major: '1', minCompatibilityMajor: '1', minCompatibilityMinor: '33', minor: '34', platform: 'linux/amd64'
      }
    }
  }
];

export const nodes = [
  {
    id:    'c-4sjtl/machine-74db2',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-4sjtl/machine-74db2', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-4sjtl/machine-74db2'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T14:58:36Z',
      fields:            ['machine-74db2', '2026-02-27T14:58:36Z'],
      generateName:      'machine-',
      generation:        101,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'ip-1234.us-west-2.compute.internal' },
      name:              'machine-74db2',
      namespace:         'c-4sjtl',
      relationships:     null,
      resourceVersion:   '289800',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '2255dd99-10ce-4dec-9c2d-dda9889b909d'
    },
    spec: {
      controlPlane: false, customConfig: null, desiredNodeTaints: null, displayName: '', etcd: false, imported: false, internalNodeSpec: { providerID: 'mock-provider-1234' }, metadataUpdate: { annotations: {}, labels: {} }, nodePoolName: '', requestedHostname: 'ip-1234.us-west-2.compute.internal', worker: true
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 14:58:48 +0000 UTC', lastUpdateTime: '2026-02-27 22:27:26 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:58:36Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '123', type: 'InternalIP' }, { address: '123', type: 'ExternalIP' }, { address: 'ip-1234.us-west-2.compute.internal', type: 'InternalDNS' }, { address: 'ip-1234.us-west-2.compute.internal', type: 'Hostname' }, { address: '1234.us-west-2.compute.amazonaws.com', type: 'ExternalDNS' }],
        allocatable: {
          cpu: '1930m', 'ephemeral-storage': '18181869946', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '3371440Ki', pods: '17'
        },
        capacity: {
          cpu: '2', 'ephemeral-storage': '20893676Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '3926448Ki', pods: '17'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:27:26Z', lastTransitionTime: '2026-02-27T14:58:48Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: 'ee542dec-7fc1-4f21-9692-246563bcdafd', containerRuntimeVersion: 'containerd://2.1.5', kernelVersion: '6.12.68-92.122.amzn2023.x86_64', kubeProxyVersion: '', kubeletVersion: 'v1.35.0-eks-efcacff', machineID: 'ec20fc11dd6de232c7f7ec289c1f388a', operatingSystem: 'linux', osImage: 'Amazon Linux 2023.10.20260216', systemUUID: 'ec20fc11-dd6d-e232-c7f7-ec289c1f388a'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }]
      },
      nodeAnnotations: {
        'alpha.kubernetes.io/provided-node-ip': '1234', 'node.alpha.kubernetes.io/ttl': '0', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 't3.medium', 'beta.kubernetes.io/os': 'linux', 'eks.amazonaws.com/capacityType': 'ON_DEMAND', 'eks.amazonaws.com/nodegroup': 'group2', 'eks.amazonaws.com/nodegroup-image': 'ami-00407e3cac6e910e6', 'eks.amazonaws.com/sourceLaunchTemplateId': 'lt-05bf8e992d2af15c5', 'eks.amazonaws.com/sourceLaunchTemplateVersion': '3', 'failure-domain.beta.kubernetes.io/region': 'us-west-2', 'failure-domain.beta.kubernetes.io/zone': 'us-west-2a', 'k8s.io/cloud-provider-aws': 'e27a0b053af63c87a7ca952dfcdf8736', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'ip-1234.us-west-2.compute.internal', 'kubernetes.io/os': 'linux', 'node.kubernetes.io/instance-type': 't3.medium', 'topology.k8s.aws/zone-id': 'usw2-az2', 'topology.kubernetes.io/region': 'us-west-2', 'topology.kubernetes.io/zone': 'us-west-2a'
      },
      nodeName:  'ip-1234.us-west-2.compute.internal',
      requested: { cpu: '150m', pods: '2' }
    }
  }, {
    id:    'c-4sjtl/machine-7qnj7',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-4sjtl/machine-7qnj7', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-4sjtl/machine-7qnj7'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T14:35:45Z',
      fields:            ['machine-7qnj7', '2026-02-27T14:35:45Z'],
      generateName:      'machine-',
      generation:        108,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'ip-2345.us-west-2.compute.internal' },
      name:              'machine-7qnj7',
      namespace:         'c-4sjtl',
      relationships:     null,
      resourceVersion:   '289415',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '5bdc40ba-9856-4c0c-b388-23a6f7b74183'
    },
    spec: {
      controlPlane: false, customConfig: null, desiredNodeTaints: null, displayName: '', etcd: false, imported: false, internalNodeSpec: { providerID: 'mock-provider-1234' }, metadataUpdate: { annotations: {}, labels: {} }, nodePoolName: '', requestedHostname: 'ip-2345.us-west-2.compute.internal', worker: true
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 14:35:58 +0000 UTC', lastUpdateTime: '2026-02-27 22:25:39 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:35:45Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '123', type: 'InternalIP' }, { address: '123', type: 'ExternalIP' }, { address: 'ip-2345.us-west-2.compute.internal', type: 'InternalDNS' }, { address: 'ip-2345.us-west-2.compute.internal', type: 'Hostname' }, { address: 'ec2-123.us-west-2.compute.amazonaws.com', type: 'ExternalDNS' }],
        allocatable: {
          cpu: '1930m', 'ephemeral-storage': '18181869946', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '3371436Ki', pods: '17'
        },
        capacity: {
          cpu: '2', 'ephemeral-storage': '20893676Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '3926444Ki', pods: '17'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:25:39Z', lastTransitionTime: '2026-02-27T14:35:58Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: '4c8192b2-4e31-483e-85a9-ca37be883332', containerRuntimeVersion: 'containerd://2.1.5', kernelVersion: '6.12.68-92.122.amzn2023.x86_64', kubeProxyVersion: '', kubeletVersion: 'v1.35.0-eks-efcacff', machineID: 'ec26924b6e895abc73a87069e8b42f51', operatingSystem: 'linux', osImage: 'Amazon Linux 2023.10.20260216', systemUUID: 'ec26924b-6e89-5abc-73a8-7069e8b42f51'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }]
      },
      limits:          { memory: '340Mi' },
      nodeAnnotations: {
        'alpha.kubernetes.io/provided-node-ip': '1234', 'node.alpha.kubernetes.io/ttl': '0', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 't3.medium', 'beta.kubernetes.io/os': 'linux', 'eks.amazonaws.com/capacityType': 'ON_DEMAND', 'eks.amazonaws.com/nodegroup': 'group1', 'eks.amazonaws.com/nodegroup-image': 'ami-00407e3cac6e910e6', 'eks.amazonaws.com/sourceLaunchTemplateId': 'lt-05bf8e992d2af15c5', 'eks.amazonaws.com/sourceLaunchTemplateVersion': '2', 'failure-domain.beta.kubernetes.io/region': 'us-west-2', 'failure-domain.beta.kubernetes.io/zone': 'us-west-2b', 'k8s.io/cloud-provider-aws': 'e27a0b053af63c87a7ca952dfcdf8736', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'ip-2345.us-west-2.compute.internal', 'kubernetes.io/os': 'linux', 'node.kubernetes.io/instance-type': 't3.medium', 'topology.k8s.aws/zone-id': 'usw2-az1', 'topology.kubernetes.io/region': 'us-west-2', 'topology.kubernetes.io/zone': 'us-west-2b'
      },
      nodeName:  'ip-2345.us-west-2.compute.internal',
      requested: {
        cpu: '350m', memory: '140Mi', pods: '6'
      }
    }
  }, {
    id:    'c-4sjtl/machine-p2q65',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-4sjtl/machine-p2q65', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-4sjtl/machine-p2q65'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T14:35:42Z',
      fields:            ['machine-p2q65', '2026-02-27T14:35:42Z'],
      generateName:      'machine-',
      generation:        109,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'ip-3456.us-west-2.compute.internal' },
      name:              'machine-p2q65',
      namespace:         'c-4sjtl',
      relationships:     null,
      resourceVersion:   '289377',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: 'a8b5323f-79ae-4d8e-8e65-9fc44e7d7ffd'
    },
    spec: {
      controlPlane: false, customConfig: null, desiredNodeTaints: null, displayName: '', etcd: false, imported: false, internalNodeSpec: { providerID: 'mock-provider-1234' }, metadataUpdate: { annotations: {}, labels: {} }, nodePoolName: '', requestedHostname: 'ip-3456.us-west-2.compute.internal', worker: true
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 14:36:07 +0000 UTC', lastUpdateTime: '2026-02-27 22:25:28 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T14:35:42Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '234', type: 'InternalIP' }, { address: '123', type: 'ExternalIP' }, { address: 'ip-3456.us-west-2.compute.internal', type: 'InternalDNS' }, { address: 'ip-3456.us-west-2.compute.internal', type: 'Hostname' }, { address: 'ec2-123.us-west-2.compute.amazonaws.com', type: 'ExternalDNS' }],
        allocatable: {
          cpu: '1930m', 'ephemeral-storage': '18181869946', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '3371440Ki', pods: '17'
        },
        capacity: {
          cpu: '2', 'ephemeral-storage': '20893676Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '3926448Ki', pods: '17'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:25:28Z', lastTransitionTime: '2026-02-27T14:36:07Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: '27f4ad22-0a09-4ceb-82bb-ab008aee45eb', containerRuntimeVersion: 'containerd://2.1.5', kernelVersion: '6.12.68-92.122.amzn2023.x86_64', kubeProxyVersion: '', kubeletVersion: 'v1.35.0-eks-efcacff', machineID: 'ec251890975351b39604691236891cb3', operatingSystem: 'linux', osImage: 'Amazon Linux 2023.10.20260216', systemUUID: 'ec251890-9753-51b3-9604-691236891cb3'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }]
      },
      nodeAnnotations: {
        'alpha.kubernetes.io/provided-node-ip': '234', 'node.alpha.kubernetes.io/ttl': '0', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 't3.medium', 'beta.kubernetes.io/os': 'linux', 'eks.amazonaws.com/capacityType': 'ON_DEMAND', 'eks.amazonaws.com/nodegroup': 'group1', 'eks.amazonaws.com/nodegroup-image': 'ami-00407e3cac6e910e6', 'eks.amazonaws.com/sourceLaunchTemplateId': 'lt-05bf8e992d2af15c5', 'eks.amazonaws.com/sourceLaunchTemplateVersion': '2', 'failure-domain.beta.kubernetes.io/region': 'us-west-2', 'failure-domain.beta.kubernetes.io/zone': 'us-west-2a', 'k8s.io/cloud-provider-aws': 'e27a0b053af63c87a7ca952dfcdf8736', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'ip-3456.us-west-2.compute.internal', 'kubernetes.io/os': 'linux', 'node.kubernetes.io/instance-type': 't3.medium', 'topology.k8s.aws/zone-id': 'usw2-az2', 'topology.kubernetes.io/region': 'us-west-2', 'topology.kubernetes.io/zone': 'us-west-2a'
      },
      nodeName:  'ip-3456.us-west-2.compute.internal',
      requested: { cpu: '150m', pods: '4' }
    }
  }, {
    id:    'c-5hrg8/machine-8d7wm',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-5hrg8/machine-8d7wm', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-5hrg8/machine-8d7wm'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T15:06:00Z',
      fields:            ['machine-8d7wm', '2026-02-27T15:06:00Z'],
      generateName:      'machine-',
      generation:        94,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'gke-gke-mock-cluster-group-1-28f9cc5f-1234' },
      name:              'machine-8d7wm',
      namespace:         'c-5hrg8',
      relationships:     null,
      resourceVersion:   '289103',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '7cd44046-0a02-4a12-ba03-991d900e8ae3'
    },
    spec: {
      controlPlane:      false,
      customConfig:      null,
      desiredNodeTaints: null,
      displayName:       '',
      etcd:              false,
      imported:          false,
      internalNodeSpec:  {
        podCIDR: '10.72.0.0/24', podCIDRs: ['10.72.0.0/24'], providerID: 'mock-provider-1234'
      },
      metadataUpdate:    { annotations: {}, labels: {} },
      nodePoolName:      '',
      requestedHostname: 'gke-gke-mock-cluster-group-1-28f9cc5f-1234',
      worker:            true
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 15:05:46 +0000 UTC', lastUpdateTime: '2026-02-27 22:24:13 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:00Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '123', type: 'InternalIP' }, { address: '1234', type: 'ExternalIP' }, { address: 'gke-gke-mock-cluster-group-1-28f9cc5f-1234', type: 'Hostname' }],
        allocatable: {
          cpu: '1930m', 'ephemeral-storage': '47060071478', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '5739212Ki', pods: '110'
        },
        capacity: {
          cpu: '2', 'ephemeral-storage': '98831908Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '7619276Ki', pods: '110'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:24:13Z', lastTransitionTime: '2026-02-27T15:05:46Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: '02ddfbb2-d705-4272-b9fd-8f9223e5e33f', containerRuntimeVersion: 'containerd://2.1.5', kernelVersion: '6.12.55+', kubeProxyVersion: '', kubeletVersion: 'v1.35.1-gke.1396000', machineID: '895509896a80bd94dfb2cf955cbe965c', operatingSystem: 'linux', osImage: 'Container-Optimized OS from Google', systemUUID: '89550989-6a80-bd94-dfb2-cf955cbe965c'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }]
      },
      limits:          { cpu: '8043m', memory: '7642954240' },
      nodeAnnotations: {
        'container.googleapis.com/instance_id': '1234', 'csi.volume.kubernetes.io/nodeid': '{"pd.csi.storage.gke.io":"projects/ei-mock-team/zones/us-central1-c/instances/gke-gke-mock-cluster-group-1-28f9cc5f-1234"}', 'node.alpha.kubernetes.io/ttl': '0', 'node.gke.io/last-applied-node-labels': 'addon.gke.io/node-local-dns-ds-ready=true,cloud.google.com/gke-boot-disk=pd-standard,cloud.google.com/gke-container-runtime=containerd,cloud.google.com/gke-cpu-scaling-level=2,cloud.google.com/gke-logging-variant=DEFAULT,cloud.google.com/gke-max-pods-per-node=110,cloud.google.com/gke-memory-gb-scaling-level=7,cloud.google.com/gke-nodepool=group-1,cloud.google.com/gke-os-distribution=cos,cloud.google.com/gke-provisioning=standard,cloud.google.com/gke-stack-type=IPV4,cloud.google.com/machine-family=n1,cloud.google.com/private-node=false,disk-type.gke.io/pd-balanced=true,disk-type.gke.io/pd-extreme=true,disk-type.gke.io/pd-ssd=true,disk-type.gke.io/pd-standard=true', 'node.gke.io/last-applied-node-taints': '', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        'addon.gke.io/node-local-dns-ds-ready': 'true', 'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 'n1-standard-2', 'beta.kubernetes.io/os': 'linux', 'cloud.google.com/gke-boot-disk': 'pd-standard', 'cloud.google.com/gke-container-runtime': 'containerd', 'cloud.google.com/gke-cpu-scaling-level': '2', 'cloud.google.com/gke-logging-variant': 'DEFAULT', 'cloud.google.com/gke-max-pods-per-node': '110', 'cloud.google.com/gke-memory-gb-scaling-level': '7', 'cloud.google.com/gke-nodepool': 'group-1', 'cloud.google.com/gke-os-distribution': 'cos', 'cloud.google.com/gke-provisioning': 'standard', 'cloud.google.com/gke-stack-type': 'IPV4', 'cloud.google.com/machine-family': 'n1', 'cloud.google.com/private-node': 'false', 'disk-type.gke.io/pd-balanced': 'true', 'disk-type.gke.io/pd-extreme': 'true', 'disk-type.gke.io/pd-ssd': 'true', 'disk-type.gke.io/pd-standard': 'true', 'failure-domain.beta.kubernetes.io/region': 'us-central1', 'failure-domain.beta.kubernetes.io/zone': 'us-central1-c', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'gke-gke-mock-cluster-group-1-28f9cc5f-1234', 'kubernetes.io/os': 'linux', 'node.kubernetes.io/instance-type': 'n1-standard-2', 'topology.gke.io/zone': 'us-central1-c', 'topology.kubernetes.io/region': 'us-central1', 'topology.kubernetes.io/zone': 'us-central1-c'
      },
      nodeName:  'gke-gke-mock-cluster-group-1-28f9cc5f-1234',
      requested: {
        cpu: '768m', memory: '1178733440', pods: '18'
      }
    }
  }, {
    id:    'c-5hrg8/machine-j2h55',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-5hrg8/machine-j2h55', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-5hrg8/machine-j2h55'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T15:06:00Z',
      fields:            ['machine-j2h55', '2026-02-27T15:06:00Z'],
      generateName:      'machine-',
      generation:        98,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'gke-gke-mock-cluster-group-2-d3d4e0ba-1234' },
      name:              'machine-j2h55',
      namespace:         'c-5hrg8',
      relationships:     null,
      resourceVersion:   '289027',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '51bec20c-1567-4ec9-9689-a16955ccb616'
    },
    spec: {
      controlPlane:      false,
      customConfig:      null,
      desiredNodeTaints: null,
      displayName:       '',
      etcd:              false,
      imported:          false,
      internalNodeSpec:  {
        podCIDR: '10.72.3.0/24', podCIDRs: ['10.72.3.0/24'], providerID: 'mock-provider-1234'
      },
      metadataUpdate:    { annotations: {}, labels: {} },
      nodePoolName:      '',
      requestedHostname: 'gke-gke-mock-cluster-group-2-d3d4e0ba-1234',
      worker:            true
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 15:05:51 +0000 UTC', lastUpdateTime: '2026-02-27 22:23:52 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:06:00Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '1234', type: 'InternalIP' }, { address: '1234', type: 'ExternalIP' }, { address: 'gke-gke-mock-cluster-group-2-d3d4e0ba-1234', type: 'Hostname' }],
        allocatable: {
          cpu: '1930m', 'ephemeral-storage': '47060071478', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '5739220Ki', pods: '110'
        },
        capacity: {
          cpu: '2', 'ephemeral-storage': '98831908Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '7619284Ki', pods: '110'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:23:52Z', lastTransitionTime: '2026-02-27T15:05:51Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: '5954e443-47df-4b5e-9949-856da55a2d61', containerRuntimeVersion: 'containerd://2.1.5', kernelVersion: '6.12.55+', kubeProxyVersion: '', kubeletVersion: 'v1.35.1-gke.1396000', machineID: 'ccc057206cc049777efc74d7afb1e10b', operatingSystem: 'linux', osImage: 'Container-Optimized OS from Google', systemUUID: 'ccc05720-6cc0-4977-7efc-74d7afb1e10b'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }]
      },
      limits:          { cpu: '5', memory: '4704478720' },
      nodeAnnotations: {
        'container.googleapis.com/instance_id': '1234', 'csi.volume.kubernetes.io/nodeid': '{"pd.csi.storage.gke.io":"projects/ei-mock-team/zones/us-central1-c/instances/gke-gke-mock-cluster-group-2-d3d4e0ba-1234"}', 'node.alpha.kubernetes.io/ttl': '0', 'node.gke.io/last-applied-node-labels': 'addon.gke.io/node-local-dns-ds-ready=true,cloud.google.com/gke-boot-disk=pd-standard,cloud.google.com/gke-container-runtime=containerd,cloud.google.com/gke-cpu-scaling-level=2,cloud.google.com/gke-logging-variant=DEFAULT,cloud.google.com/gke-max-pods-per-node=110,cloud.google.com/gke-memory-gb-scaling-level=7,cloud.google.com/gke-nodepool=group-2,cloud.google.com/gke-os-distribution=cos,cloud.google.com/gke-provisioning=standard,cloud.google.com/gke-stack-type=IPV4,cloud.google.com/machine-family=n1,cloud.google.com/private-node=false,disk-type.gke.io/pd-balanced=true,disk-type.gke.io/pd-extreme=true,disk-type.gke.io/pd-ssd=true,disk-type.gke.io/pd-standard=true', 'node.gke.io/last-applied-node-taints': '', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        'addon.gke.io/node-local-dns-ds-ready': 'true', 'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 'n1-standard-2', 'beta.kubernetes.io/os': 'linux', 'cloud.google.com/gke-boot-disk': 'pd-standard', 'cloud.google.com/gke-container-runtime': 'containerd', 'cloud.google.com/gke-cpu-scaling-level': '2', 'cloud.google.com/gke-logging-variant': 'DEFAULT', 'cloud.google.com/gke-max-pods-per-node': '110', 'cloud.google.com/gke-memory-gb-scaling-level': '7', 'cloud.google.com/gke-nodepool': 'group-2', 'cloud.google.com/gke-os-distribution': 'cos', 'cloud.google.com/gke-provisioning': 'standard', 'cloud.google.com/gke-stack-type': 'IPV4', 'cloud.google.com/machine-family': 'n1', 'cloud.google.com/private-node': 'false', 'disk-type.gke.io/pd-balanced': 'true', 'disk-type.gke.io/pd-extreme': 'true', 'disk-type.gke.io/pd-ssd': 'true', 'disk-type.gke.io/pd-standard': 'true', 'failure-domain.beta.kubernetes.io/region': 'us-central1', 'failure-domain.beta.kubernetes.io/zone': 'us-central1-c', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'gke-gke-mock-cluster-group-2-d3d4e0ba-1234', 'kubernetes.io/os': 'linux', 'node.kubernetes.io/instance-type': 'n1-standard-2', 'topology.gke.io/zone': 'us-central1-c', 'topology.kubernetes.io/region': 'us-central1', 'topology.kubernetes.io/zone': 'us-central1-c'
      },
      nodeName:  'gke-gke-mock-cluster-group-2-d3d4e0ba-1234',
      requested: {
        cpu: '546m', memory: '696602880', pods: '9'
      }
    }
  }, {
    id:    'c-9zj2b/machine-8fgkn',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-9zj2b/machine-8fgkn', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-9zj2b/machine-8fgkn'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T15:03:09Z',
      fields:            ['machine-8fgkn', '2026-02-27T15:03:09Z'],
      generateName:      'machine-',
      generation:        92,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'aks-pool1-28301118-vmss000001' },
      name:              'machine-8fgkn',
      namespace:         'c-9zj2b',
      relationships:     null,
      resourceVersion:   '289954',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: 'a7bd0a94-f453-41cc-96fb-5793faf20a86'
    },
    spec: {
      controlPlane:      false,
      customConfig:      null,
      desiredNodeTaints: null,
      displayName:       '',
      etcd:              false,
      imported:          false,
      internalNodeSpec:  {
        podCIDR: '10.244.0.0/24', podCIDRs: ['10.244.0.0/24'], providerID: 'mock-provider-1234'
      },
      metadataUpdate:    { annotations: {}, labels: {} },
      nodePoolName:      '',
      requestedHostname: 'aks-pool1-28301118-vmss000001',
      worker:            true
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 15:00:39 +0000 UTC', lastUpdateTime: '2026-02-27 22:28:08 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:09Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '1234', type: 'InternalIP' }, { address: 'aks-pool1-28301118-vmss000001', type: 'Hostname' }],
        allocatable: {
          cpu: '1900m', 'ephemeral-storage': '118810356745', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '5934988Ki', pods: '110'
        },
        capacity: {
          cpu: '2', 'ephemeral-storage': '128917488Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '8134540Ki', pods: '110'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:28:08Z', lastTransitionTime: '2026-02-27T15:00:39Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: '03aa9c65-dec8-419d-8a70-b1a2e58aea95', containerRuntimeVersion: 'containerd://2.1.6-1', kernelVersion: '6.8.0-1044-azure', kubeProxyVersion: '', kubeletVersion: 'v1.35.0', machineID: '328e597db405498c8f86d2fcee445ce6', operatingSystem: 'linux', osImage: 'Ubuntu 24.04.4 LTS', systemUUID: 'befb6076-515b-480e-b3bb-54d18f7ea528'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'untrusted' }]
      },
      limits:          { cpu: '500m', memory: '7262Mi' },
      nodeAnnotations: {
        'alpha.kubernetes.io/provided-node-ip': '1234', 'csi.volume.kubernetes.io/nodeid': '{"disk.csi.azure.com":"aks-pool1-28301118-vmss000001","file.csi.azure.com":"aks-pool1-28301118-vmss000001"}', 'node.alpha.kubernetes.io/ttl': '0', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        agentpool: 'pool1', 'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 'Standard_D2d_v4', 'beta.kubernetes.io/os': 'linux', 'failure-domain.beta.kubernetes.io/region': 'eastus', 'failure-domain.beta.kubernetes.io/zone': 'eastus-2', 'kubernetes.azure.com/agentpool': 'pool1', 'kubernetes.azure.com/cluster': 'MC_imported-mock-cluster_aks-mock-cluster_eastus', 'kubernetes.azure.com/consolidated-additional-properties': 'a86ce7b8-13ec-11f1-987d-1eb896a44863', 'kubernetes.azure.com/kubelet-identity-client-id': '822d20f5-12f3-42c1-afe8-fc4420d1de2a', 'kubernetes.azure.com/kubelet-serving-ca': 'cluster', 'kubernetes.azure.com/localdns-state': 'disabled', 'kubernetes.azure.com/mode': 'user', 'kubernetes.azure.com/node-image-version': 'AKSUbuntu-2404gen2containerd-202602.13.0', 'kubernetes.azure.com/nodepool-type': 'VirtualMachineScaleSets', 'kubernetes.azure.com/os-sku': 'Ubuntu', 'kubernetes.azure.com/os-sku-effective': 'Ubuntu2404', 'kubernetes.azure.com/os-sku-requested': 'Ubuntu', 'kubernetes.azure.com/role': 'agent', 'kubernetes.azure.com/sku-cpu': '2', 'kubernetes.azure.com/sku-memory': '8192', 'kubernetes.azure.com/storageprofile': 'managed', 'kubernetes.azure.com/storagetier': 'Standard_LRS', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'aks-pool1-28301118-vmss000001', 'kubernetes.io/os': 'linux', 'node.kubernetes.io/instance-type': 'Standard_D2d_v4', storageprofile: 'managed', storagetier: 'Standard_LRS', 'topology.disk.csi.azure.com/zone': 'eastus-2', 'topology.kubernetes.io/region': 'eastus', 'topology.kubernetes.io/zone': 'eastus-2'
      },
      nodeName:  'aks-pool1-28301118-vmss000001',
      requested: {
        cpu: '270m', memory: '226Mi', pods: '6'
      }
    }
  }, {
    id:    'c-9zj2b/machine-sglft',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-9zj2b/machine-sglft', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-9zj2b/machine-sglft'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T15:03:09Z',
      fields:            ['machine-sglft', '2026-02-27T15:03:09Z'],
      generateName:      'machine-',
      generation:        95,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'aks-agentpool-28301118-vmss000000' },
      name:              'machine-sglft',
      namespace:         'c-9zj2b',
      relationships:     null,
      resourceVersion:   '289817',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '09f4e78f-c14b-4072-849f-a40628e82133'
    },
    spec: {
      controlPlane:      false,
      customConfig:      null,
      desiredNodeTaints: null,
      displayName:       '',
      etcd:              false,
      imported:          false,
      internalNodeSpec:  {
        podCIDR: '10.244.1.0/24', podCIDRs: ['10.244.1.0/24'], providerID: 'mock-provider-1234'
      },
      metadataUpdate:    { annotations: {}, labels: {} },
      nodePoolName:      '',
      requestedHostname: 'aks-agentpool-28301118-vmss000000',
      worker:            true
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 15:00:44 +0000 UTC', lastUpdateTime: '2026-02-27 22:27:30 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:03:09Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '1234', type: 'InternalIP' }, { address: 'aks-agentpool-28301118-vmss000000', type: 'Hostname' }],
        allocatable: {
          cpu: '1900m', 'ephemeral-storage': '118810356745', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '5930752Ki', pods: '110'
        },
        capacity: {
          cpu: '2', 'ephemeral-storage': '128917488Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '8130304Ki', pods: '110'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:27:30Z', lastTransitionTime: '2026-02-27T15:00:44Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: '37c1b147-5823-4225-b184-21744dec2220', containerRuntimeVersion: 'containerd://2.1.6-1', kernelVersion: '6.8.0-1044-azure', kubeProxyVersion: '', kubeletVersion: 'v1.35.0', machineID: 'd661251330564828bab0711b64c41190', operatingSystem: 'linux', osImage: 'Ubuntu 24.04.4 LTS', systemUUID: 'b8c26dac-359c-4466-9cc7-4d9a90dcedda'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'untrusted' }]
      },
      limits:          { cpu: '9554m', memory: '12413216Ki' },
      nodeAnnotations: {
        'alpha.kubernetes.io/provided-node-ip': '1234', 'csi.volume.kubernetes.io/nodeid': '{"disk.csi.azure.com":"aks-agentpool-28301118-vmss000000","file.csi.azure.com":"aks-agentpool-28301118-vmss000000"}', 'node.alpha.kubernetes.io/ttl': '0', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        agentpool: 'agentpool', 'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 'Standard_D2d_v4', 'beta.kubernetes.io/os': 'linux', 'failure-domain.beta.kubernetes.io/region': 'eastus', 'failure-domain.beta.kubernetes.io/zone': 'eastus-1', 'kubernetes.azure.com/agentpool': 'agentpool', 'kubernetes.azure.com/cluster': 'MC_imported-mock-cluster_aks-mock-cluster_eastus', 'kubernetes.azure.com/consolidated-additional-properties': 'a86cdfdc-13ec-11f1-987d-1eb896a44863', 'kubernetes.azure.com/kubelet-identity-client-id': '822d20f5-12f3-42c1-afe8-fc4420d1de2a', 'kubernetes.azure.com/kubelet-serving-ca': 'cluster', 'kubernetes.azure.com/localdns-state': 'disabled', 'kubernetes.azure.com/mode': 'system', 'kubernetes.azure.com/node-image-version': 'AKSUbuntu-2404gen2containerd-202602.13.0', 'kubernetes.azure.com/nodepool-type': 'VirtualMachineScaleSets', 'kubernetes.azure.com/os-sku': 'Ubuntu', 'kubernetes.azure.com/os-sku-effective': 'Ubuntu2404', 'kubernetes.azure.com/os-sku-requested': 'Ubuntu', 'kubernetes.azure.com/role': 'agent', 'kubernetes.azure.com/sku-cpu': '2', 'kubernetes.azure.com/sku-memory': '8192', 'kubernetes.azure.com/storageprofile': 'managed', 'kubernetes.azure.com/storagetier': 'Standard_LRS', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'aks-agentpool-28301118-vmss000000', 'kubernetes.io/os': 'linux', 'node.kubernetes.io/instance-type': 'Standard_D2d_v4', storageprofile: 'managed', storagetier: 'Standard_LRS', 'topology.disk.csi.azure.com/zone': 'eastus-1', 'topology.kubernetes.io/region': 'eastus', 'topology.kubernetes.io/zone': 'eastus-1'
      },
      nodeName:  'aks-agentpool-28301118-vmss000000',
      requested: {
        cpu: '864m', memory: '710Mi', pods: '16'
      }
    }
  }, {
    id:    'c-kkwv2/machine-4lbm7',
    type:  'management.cattle.io.node',
    links: {
      patch: 'blocked', remove: 'blocked', self: 'https://mock-url/v1/management.cattle.io.nodes/c-kkwv2/machine-4lbm7', update: 'blocked', view: 'https://mock-url/v1/management.cattle.io.nodes/c-kkwv2/machine-4lbm7'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'Node',
    metadata:   {
      annotations:       { 'cleanup.cattle.io/user-node-remove': 'true', 'management.cattle.io/nodesyncer': 'true' },
      creationTimestamp: '2026-02-27T15:04:19Z',
      fields:            ['machine-4lbm7', '2026-02-27T15:04:19Z'],
      generateName:      'machine-',
      generation:        97,
      labels:            { 'cattle.io/creator': 'norman', 'management.cattle.io/nodename': 'ip-1234-4' },
      name:              'machine-4lbm7',
      namespace:         'c-kkwv2',
      relationships:     null,
      resourceVersion:   '289358',
      state:             {
        error: false, message: 'Resource is Ready', name: 'active', transitioning: false
      },
      uid: '736277b6-fa8e-4e37-a494-2acb65aae84d'
    },
    spec: {
      controlPlane:      true,
      customConfig:      null,
      desiredNodeTaints: null,
      displayName:       '',
      etcd:              false,
      imported:          false,
      internalNodeSpec:  {
        podCIDR: '10.42.0.0/24', podCIDRs: ['10.42.0.0/24'], providerID: 'mock-provider-1234'
      },
      metadataUpdate:    { annotations: {}, labels: {} },
      nodePoolName:      '',
      requestedHostname: 'ip-1234-4',
      worker:            false
    },
    status: {
      conditions: [{
        error: false, lastTransitionTime: '2026-02-27 15:02:35 +0000 UTC', lastUpdateTime: '2026-02-27 22:25:24 +0000 UTC', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', transitioning: false, type: 'Ready'
      }, {
        error: false, lastUpdateTime: '2026-02-27T15:04:19Z', message: 'registered with kubernetes', status: 'True', transitioning: false, type: 'Registered'
      }],
      internalNodeStatus: {
        addresses:   [{ address: '10.0.18.167', type: 'InternalIP' }, { address: 'ip-1234-4', type: 'Hostname' }],
        allocatable: {
          cpu: '8', 'ephemeral-storage': '28579587664', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '32484188Ki', pods: '110'
        },
        capacity: {
          cpu: '8', 'ephemeral-storage': '29378688Ki', 'hugepages-1Gi': '0', 'hugepages-2Mi': '0', memory: '32484188Ki', pods: '110'
        },
        conditions: [{
          lastHeartbeatTime: '2026-02-27T22:25:24Z', lastTransitionTime: '2026-02-27T15:02:35Z', message: 'kubelet is posting ready status', reason: 'KubeletReady', status: 'True', type: 'Ready'
        }],
        daemonEndpoints: { kubeletEndpoint: { Port: 10250 } },
        features:        { supplementalGroupsPolicy: true },
        nodeInfo:        {
          architecture: 'amd64', bootID: 'ac1c7a4f-d289-4568-987c-eae538ab9c6a', containerRuntimeVersion: 'containerd://2.1.5-k3s1', kernelVersion: '6.14.0-1018-aws', kubeProxyVersion: '', kubeletVersion: 'v1.34.4+k3s1', machineID: 'ec22eee033364a2b6b43bdb955444f4b', operatingSystem: 'linux', osImage: 'Ubuntu 24.04.3 LTS', systemUUID: 'ec22eee0-3336-4a2b-6b43-bdb955444f4b'
        },
        runtimeHandlers: [{ features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: '' }, { features: { recursiveReadOnlyMounts: true, userNamespaces: true }, name: 'runc' }, { features: { recursiveReadOnlyMounts: false, userNamespaces: false }, name: 'runhcs-wcow-process' }]
      },
      limits:          { memory: '170Mi' },
      nodeAnnotations: {
        'alpha.kubernetes.io/provided-node-ip': '1234', 'flannel.alpha.coreos.com/backend-data': '{"VNI":1,"VtepMAC":"26:f2:e5:51:18:db"}', 'flannel.alpha.coreos.com/backend-type': 'vxlan', 'flannel.alpha.coreos.com/kube-subnet-manager': 'true', 'flannel.alpha.coreos.com/public-ip': '1234', 'k3s.io/hostname': 'ip-1234-4', 'k3s.io/internal-ip': '1234', 'k3s.io/node-args': '["server"]', 'k3s.io/node-config-hash': 'HKLO67SPSTTSQ2KPLIB43EJEGV4CNWV52ISWRWMJ5WLI4GJHBULQ====', 'k3s.io/node-env': '{"K3S_KUBECONFIG_MODE":"644"}', 'node.alpha.kubernetes.io/ttl': '0', 'volumes.kubernetes.io/controller-managed-attach-detach': 'true'
      },
      nodeLabels: {
        'beta.kubernetes.io/arch': 'amd64', 'beta.kubernetes.io/instance-type': 'k3s', 'beta.kubernetes.io/os': 'linux', 'kubernetes.io/arch': 'amd64', 'kubernetes.io/hostname': 'ip-1234-4', 'kubernetes.io/os': 'linux', 'node-role.kubernetes.io/control-plane': 'true', 'node.kubernetes.io/instance-type': 'k3s'
      },
      nodeName:  'ip-1234-4',
      requested: {
        cpu: '200m', memory: '140Mi', pods: '9'
      }
    }
  },
];

export const namespaces = [
  {
    id:    'c-9zj2b',
    type:  'namespace',
    links: {
      patch:  'https://mock-url/v1/namespaces/c-9zj2b',
      remove: 'https://mock-url/v1/namespaces/c-9zj2b',
      self:   'https://mock-url/v1/namespaces/c-9zj2b',
      update: 'https://mock-url/v1/namespaces/c-9zj2b',
      view:   'https://mock-url/api/v1/namespaces/c-9zj2b'
    },
    apiVersion: 'v1',
    kind:       'Namespace',
    metadata:   {
      annotations: {
        'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"}]}',
        'lifecycle.cattle.io/create.namespace-auth': 'true',
        'management.cattle.io/no-default-sa-token':  'true',
        'management.cattle.io/system-namespace':     'true'
      },
      creationTimestamp: '2026-03-02T15:25:54Z',
      fields:            [
        'c-9zj2b',
        'Active',
        '24m'
      ],
      labels:          { 'kubernetes.io/metadata.name': 'c-9zj2b' },
      name:            'c-9zj2b',
      relationships:   null,
      resourceVersion: '1125510',
      state:           {
        error:         false,
        message:       '',
        name:          'active',
        transitioning: false
      },
      uid: '4ffb55b9-be4d-4a17-8494-26ff4136cb1a'
    },
    spec: {
      finalizers: [
        'kubernetes'
      ]
    },
    status: { phase: 'Active' }
  },
  {
    id:    'c-4sjtl',
    type:  'namespace',
    links: {
      patch:  'https://mock-url/v1/namespaces/c-4sjtl',
      remove: 'https://mock-url/v1/namespaces/c-4sjtl',
      self:   'https://mock-url/v1/namespaces/c-4sjtl',
      update: 'https://mock-url/v1/namespaces/c-4sjtl',
      view:   'https://mock-url/api/v1/namespaces/c-4sjtl'
    },
    apiVersion: 'v1',
    kind:       'Namespace',
    metadata:   {
      annotations: {
        'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"}]}',
        'lifecycle.cattle.io/create.namespace-auth': 'true',
        'management.cattle.io/no-default-sa-token':  'true',
        'management.cattle.io/system-namespace':     'true'
      },
      creationTimestamp: '2026-03-02T15:25:54Z',
      fields:            [
        'c-4sjtl',
        'Active',
        '24m'
      ],
      labels:          { 'kubernetes.io/metadata.name': 'c-4sjtl' },
      name:            'c-4sjtl',
      relationships:   null,
      resourceVersion: '1125510',
      state:           {
        error:         false,
        message:       '',
        name:          'active',
        transitioning: false
      },
      uid: '4ffb55b9-be4d-4a17-8494-26ff4136cb1a'
    },
    spec: {
      finalizers: [
        'kubernetes'
      ]
    },
    status: { phase: 'Active' }
  },
  {
    id:    'c-5hrg8',
    type:  'namespace',
    links: {
      patch:  'https://mock-url/v1/namespaces/c-5hrg8',
      remove: 'https://mock-url/v1/namespaces/c-5hrg8',
      self:   'https://mock-url/v1/namespaces/c-5hrg8',
      update: 'https://mock-url/v1/namespaces/c-5hrg8',
      view:   'https://mock-url/api/v1/namespaces/c-5hrg8'
    },
    apiVersion: 'v1',
    kind:       'Namespace',
    metadata:   {
      annotations: {
        'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"}]}',
        'lifecycle.cattle.io/create.namespace-auth': 'true',
        'management.cattle.io/no-default-sa-token':  'true',
        'management.cattle.io/system-namespace':     'true'
      },
      creationTimestamp: '2026-03-02T15:25:54Z',
      fields:            [
        'c-5hrg8',
        'Active',
        '24m'
      ],
      labels:          { 'kubernetes.io/metadata.name': 'c-5hrg8' },
      name:            'c-5hrg8',
      relationships:   null,
      resourceVersion: '1125510',
      state:           {
        error:         false,
        message:       '',
        name:          'active',
        transitioning: false
      },
      uid: '4ffb55b9-be4d-4a17-8494-26ff4136cb1a'
    },
    spec: {
      finalizers: [
        'kubernetes'
      ]
    },
    status: { phase: 'Active' }
  },
  {
    id:    'c-kkwv2',
    type:  'namespace',
    links: {
      patch:  'https://mock-url/v1/namespaces/c-kkwv2',
      remove: 'https://mock-url/v1/namespaces/c-kkwv2',
      self:   'https://mock-url/v1/namespaces/c-kkwv2',
      update: 'https://mock-url/v1/namespaces/c-kkwv2',
      view:   'https://mock-url/api/v1/namespaces/c-kkwv2'
    },
    apiVersion: 'v1',
    kind:       'Namespace',
    metadata:   {
      annotations: {
        'cattle.io/status':                          '{"Conditions":[{"Type":"ResourceQuotaInit","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"},{"Type":"InitialRolesPopulated","Status":"True","Message":"","LastUpdateTime":"2026-03-02T15:25:55Z"}]}',
        'lifecycle.cattle.io/create.namespace-auth': 'true',
        'management.cattle.io/no-default-sa-token':  'true',
        'management.cattle.io/system-namespace':     'true'
      },
      creationTimestamp: '2026-03-02T15:25:54Z',
      fields:            [
        'c-kkwv2',
        'Active',
        '24m'
      ],
      labels:          { 'kubernetes.io/metadata.name': 'c-kkwv2' },
      name:            'c-kkwv2',
      relationships:   null,
      resourceVersion: '1125510',
      state:           {
        error:         false,
        message:       '',
        name:          'active',
        transitioning: false
      },
      uid: '4ffb55b9-be4d-4a17-8494-26ff4136cb1a'
    },
    spec: {
      finalizers: [
        'kubernetes'
      ]
    },
    status: { phase: 'Active' }
  }
];
