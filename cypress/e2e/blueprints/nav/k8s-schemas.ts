export function generateFakeNodeSchema(mgmtClusterId:string):any {
  return {
    id:    'node',
    type:  'schema',
    links: {
      collection: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/nodes`,
      self:       `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/schemas/node`
    },
    description:     'Node is a worker node in Kubernetes. Each node will have a unique identifier in the cache (i.e. in etcd).',
    pluralName:      'nodes',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Status',
          type:        'string',
          format:      '',
          description: 'The status of the node',
          priority:    0,
          field:       '$.metadata.fields[1]'
        },
        {
          name:        'Roles',
          type:        'string',
          format:      '',
          description: 'The roles of the node',
          priority:    0,
          field:       '$.metadata.fields[2]'
        },
        {
          name:        'Age',
          type:        'string',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[3]'
        },
        {
          name:        'Version',
          type:        'string',
          format:      '',
          description: 'Kubelet Version reported by the node.',
          priority:    0,
          field:       '$.metadata.fields[4]'
        },
        {
          name:        'Internal-IP',
          type:        'string',
          format:      '',
          description: "List of addresses reachable to the node. Queried from cloud provider, if available. More info: https://kubernetes.io/docs/concepts/nodes/node/#addresses Note: This field is declared as mergeable, but the merge key is not sufficiently unique, which can cause data corruption when it is merged. Callers should instead use a full-replacement patch. See https://pr.k8s.io/79391 for an example. Consumers should assume that addresses can change during the lifetime of a Node. However, there are some exceptions where this may not be possible, such as Pods that inherit a Node's address in its own status or consumers of the downward API (status.hostIP).",
          priority:    1,
          field:       '$.metadata.fields[5]'
        },
        {
          name:        'External-IP',
          type:        'string',
          format:      '',
          description: "List of addresses reachable to the node. Queried from cloud provider, if available. More info: https://kubernetes.io/docs/concepts/nodes/node/#addresses Note: This field is declared as mergeable, but the merge key is not sufficiently unique, which can cause data corruption when it is merged. Callers should instead use a full-replacement patch. See https://pr.k8s.io/79391 for an example. Consumers should assume that addresses can change during the lifetime of a Node. However, there are some exceptions where this may not be possible, such as Pods that inherit a Node's address in its own status or consumers of the downward API (status.hostIP).",
          priority:    1,
          field:       '$.metadata.fields[6]'
        },
        {
          name:        'OS-Image',
          type:        'string',
          format:      '',
          description: 'OS Image reported by the node from /etc/os-release (e.g. Debian GNU/Linux 7 (wheezy)).',
          priority:    1,
          field:       '$.metadata.fields[7]'
        },
        {
          name:        'Kernel-Version',
          type:        'string',
          format:      '',
          description: "Kernel Version reported by the node from 'uname -r' (e.g. 3.16.0-0.bpo.4-amd64).",
          priority:    1,
          field:       '$.metadata.fields[8]'
        },
        {
          name:        'Container-Runtime',
          type:        'string',
          format:      '',
          description: 'ContainerRuntime Version reported by the node through runtime remote API (e.g. containerd://1.4.2).',
          priority:    1,
          field:       '$.metadata.fields[9]'
        }
      ],
      group:      '',
      kind:       'Node',
      namespaced: false,
      resource:   'nodes',
      verbs:      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch'
      ],
      version: 'v1'
    },
  };
}

export function generateFakeCountSchema(mgmtClusterId:string):any {
  return {
    id:    'count',
    type:  'schema',
    links: {
      collection: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/counts`,
      self:       `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/schemas/count`
    },
    description:     'Node is a worker node in Kubernetes. Each node will have a unique identifier in the cache (i.e. in etcd).',
    pluralName:      'nodes',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Status',
          type:        'string',
          format:      '',
          description: 'The status of the node',
          priority:    0,
          field:       '$.metadata.fields[1]'
        },
        {
          name:        'Roles',
          type:        'string',
          format:      '',
          description: 'The roles of the node',
          priority:    0,
          field:       '$.metadata.fields[2]'
        },
        {
          name:        'Age',
          type:        'string',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[3]'
        },
        {
          name:        'Version',
          type:        'string',
          format:      '',
          description: 'Kubelet Version reported by the node.',
          priority:    0,
          field:       '$.metadata.fields[4]'
        },
        {
          name:        'Internal-IP',
          type:        'string',
          format:      '',
          description: "List of addresses reachable to the node. Queried from cloud provider, if available. More info: https://kubernetes.io/docs/concepts/nodes/node/#addresses Note: This field is declared as mergeable, but the merge key is not sufficiently unique, which can cause data corruption when it is merged. Callers should instead use a full-replacement patch. See https://pr.k8s.io/79391 for an example. Consumers should assume that addresses can change during the lifetime of a Node. However, there are some exceptions where this may not be possible, such as Pods that inherit a Node's address in its own status or consumers of the downward API (status.hostIP).",
          priority:    1,
          field:       '$.metadata.fields[5]'
        },
        {
          name:        'External-IP',
          type:        'string',
          format:      '',
          description: "List of addresses reachable to the node. Queried from cloud provider, if available. More info: https://kubernetes.io/docs/concepts/nodes/node/#addresses Note: This field is declared as mergeable, but the merge key is not sufficiently unique, which can cause data corruption when it is merged. Callers should instead use a full-replacement patch. See https://pr.k8s.io/79391 for an example. Consumers should assume that addresses can change during the lifetime of a Node. However, there are some exceptions where this may not be possible, such as Pods that inherit a Node's address in its own status or consumers of the downward API (status.hostIP).",
          priority:    1,
          field:       '$.metadata.fields[6]'
        },
        {
          name:        'OS-Image',
          type:        'string',
          format:      '',
          description: 'OS Image reported by the node from /etc/os-release (e.g. Debian GNU/Linux 7 (wheezy)).',
          priority:    1,
          field:       '$.metadata.fields[7]'
        },
        {
          name:        'Kernel-Version',
          type:        'string',
          format:      '',
          description: "Kernel Version reported by the node from 'uname -r' (e.g. 3.16.0-0.bpo.4-amd64).",
          priority:    1,
          field:       '$.metadata.fields[8]'
        },
        {
          name:        'Container-Runtime',
          type:        'string',
          format:      '',
          description: 'ContainerRuntime Version reported by the node through runtime remote API (e.g. containerd://1.4.2).',
          priority:    1,
          field:       '$.metadata.fields[9]'
        }
      ],
      group:      '',
      kind:       'Node',
      namespaced: false,
      resource:   'nodes',
      verbs:      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch'
      ],
      version: 'v1'
    },
  };
}

export function generateFakeNamespaceSchema(mgmtClusterId:string):any {
  return {
    id:    'namespace',
    type:  'schema',
    links: {
      collection: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/namespaces`,
      self:       `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/schemas/namespace`
    },
    description:     'Node is a worker node in Kubernetes. Each node will have a unique identifier in the cache (i.e. in etcd).',
    pluralName:      'nodes',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Status',
          type:        'string',
          format:      '',
          description: 'The status of the node',
          priority:    0,
          field:       '$.metadata.fields[1]'
        },
        {
          name:        'Roles',
          type:        'string',
          format:      '',
          description: 'The roles of the node',
          priority:    0,
          field:       '$.metadata.fields[2]'
        },
        {
          name:        'Age',
          type:        'string',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[3]'
        },
        {
          name:        'Version',
          type:        'string',
          format:      '',
          description: 'Kubelet Version reported by the node.',
          priority:    0,
          field:       '$.metadata.fields[4]'
        },
        {
          name:        'Internal-IP',
          type:        'string',
          format:      '',
          description: "List of addresses reachable to the node. Queried from cloud provider, if available. More info: https://kubernetes.io/docs/concepts/nodes/node/#addresses Note: This field is declared as mergeable, but the merge key is not sufficiently unique, which can cause data corruption when it is merged. Callers should instead use a full-replacement patch. See https://pr.k8s.io/79391 for an example. Consumers should assume that addresses can change during the lifetime of a Node. However, there are some exceptions where this may not be possible, such as Pods that inherit a Node's address in its own status or consumers of the downward API (status.hostIP).",
          priority:    1,
          field:       '$.metadata.fields[5]'
        },
        {
          name:        'External-IP',
          type:        'string',
          format:      '',
          description: "List of addresses reachable to the node. Queried from cloud provider, if available. More info: https://kubernetes.io/docs/concepts/nodes/node/#addresses Note: This field is declared as mergeable, but the merge key is not sufficiently unique, which can cause data corruption when it is merged. Callers should instead use a full-replacement patch. See https://pr.k8s.io/79391 for an example. Consumers should assume that addresses can change during the lifetime of a Node. However, there are some exceptions where this may not be possible, such as Pods that inherit a Node's address in its own status or consumers of the downward API (status.hostIP).",
          priority:    1,
          field:       '$.metadata.fields[6]'
        },
        {
          name:        'OS-Image',
          type:        'string',
          format:      '',
          description: 'OS Image reported by the node from /etc/os-release (e.g. Debian GNU/Linux 7 (wheezy)).',
          priority:    1,
          field:       '$.metadata.fields[7]'
        },
        {
          name:        'Kernel-Version',
          type:        'string',
          format:      '',
          description: "Kernel Version reported by the node from 'uname -r' (e.g. 3.16.0-0.bpo.4-amd64).",
          priority:    1,
          field:       '$.metadata.fields[8]'
        },
        {
          name:        'Container-Runtime',
          type:        'string',
          format:      '',
          description: 'ContainerRuntime Version reported by the node through runtime remote API (e.g. containerd://1.4.2).',
          priority:    1,
          field:       '$.metadata.fields[9]'
        }
      ],
      group:      '',
      kind:       'Node',
      namespaced: false,
      resource:   'nodes',
      verbs:      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch'
      ],
      version: 'v1'
    },
  };
}

export function generateFakeDaemonsetSchema(mgmtClusterId:string):any {
  return {
    id:    'apps.daemonset',
    type:  'schema',
    links: {
      collection: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/apps.daemonsets`,
      self:       `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/schemas/apps.daemonset`
    },
    description:     'DaemonSet represents the configuration of a daemon set.',
    pluralName:      'apps.daemonsets',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Desired',
          type:        'integer',
          format:      '',
          description: 'The total number of nodes that should be running the daemon pod (including nodes correctly running the daemon pod). More info: https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/',
          priority:    0,
          field:       '$.metadata.fields[1]'
        },
        {
          name:        'Current',
          type:        'integer',
          format:      '',
          description: 'The number of nodes that are running at least 1 daemon pod and are supposed to run the daemon pod. More info: https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/',
          priority:    0,
          field:       '$.metadata.fields[2]'
        },
        {
          name:        'Ready',
          type:        'integer',
          format:      '',
          description: 'The number of nodes that should be running the daemon pod and have one or more of the daemon pod running and ready.',
          priority:    0,
          field:       '$.metadata.fields[3]'
        },
        {
          name:        'Up-to-date',
          type:        'integer',
          format:      '',
          description: 'The total number of nodes that are running updated daemon pod',
          priority:    0,
          field:       '$.metadata.fields[4]'
        },
        {
          name:        'Available',
          type:        'integer',
          format:      '',
          description: 'The number of nodes that should be running the daemon pod and have one or more of the daemon pod running and available (ready for at least spec.minReadySeconds)',
          priority:    0,
          field:       '$.metadata.fields[5]'
        },
        {
          name:        'Node Selector',
          type:        'string',
          format:      '',
          description: "NodeSelector is a selector which must be true for the pod to fit on a node. Selector which must match a node's labels for the pod to be scheduled on that node. More info: https://kubernetes.io/docs/concepts/configuration/assign-pod-node/",
          priority:    0,
          field:       '$.metadata.fields[6]'
        },
        {
          name:        'Age',
          type:        'string',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[7]'
        },
        {
          name:        'Containers',
          type:        'string',
          format:      '',
          description: 'Names of each container in the template.',
          priority:    1,
          field:       '$.metadata.fields[8]'
        },
        {
          name:        'Images',
          type:        'string',
          format:      '',
          description: 'Images referenced by each container in the template.',
          priority:    1,
          field:       '$.metadata.fields[9]'
        },
        {
          name:        'Selector',
          type:        'string',
          format:      '',
          description: 'A label query over pods that are managed by the daemon set. Must match in order to be controlled. If empty, defaulted to labels on Pod template. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#label-selectors',
          priority:    1,
          field:       '$.metadata.fields[10]'
        }
      ],
      group:      'apps',
      kind:       'DaemonSet',
      namespaced: true,
      resource:   'daemonsets',
      verbs:      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  };
}

export function generateFakePodSchema(mgmtClusterId:string):any {
  return {
    id:    'pod',
    type:  'schema',
    links: {
      collection: `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/pods`,
      self:       `https://localhost:8005/k8s/clusters/${ mgmtClusterId }/v1/schemas/pod`
    },
    description:     'Pod is a collection of containers that can run on a host. This resource is created by clients and scheduled onto hosts.',
    pluralName:      'pods',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields:    null,
    collectionMethods: [
      'GET',
      'POST'
    ],
    attributes: {
      columns: [
        {
          name:        'Name',
          type:        'string',
          format:      'name',
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names',
          priority:    0,
          field:       '$.metadata.fields[0]'
        },
        {
          name:        'Ready',
          type:        'string',
          format:      '',
          description: 'The aggregate readiness state of this pod for accepting traffic.',
          priority:    0,
          field:       '$.metadata.fields[1]'
        },
        {
          name:        'Status',
          type:        'string',
          format:      '',
          description: 'The aggregate status of the containers in this pod.',
          priority:    0,
          field:       '$.metadata.fields[2]'
        },
        {
          name:        'Restarts',
          type:        'string',
          format:      '',
          description: 'The number of times the containers in this pod have been restarted and when the last container in this pod has restarted.',
          priority:    0,
          field:       '$.metadata.fields[3]'
        },
        {
          name:        'Age',
          type:        'string',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[4]'
        },
        {
          name:        'IP',
          type:        'string',
          format:      '',
          description: 'podIP address allocated to the pod. Routable at least within the cluster. Empty if not yet allocated.',
          priority:    1,
          field:       '$.metadata.fields[5]'
        },
        {
          name:        'Node',
          type:        'string',
          format:      '',
          description: 'NodeName is a request to schedule this pod onto a specific node. If it is non-empty, the scheduler simply schedules this pod onto that node, assuming that it fits resource requirements.',
          priority:    1,
          field:       '$.metadata.fields[6]'
        },
        {
          name:        'Nominated Node',
          type:        'string',
          format:      '',
          description: 'nominatedNodeName is set only when this pod preempts other pods on the node, but it cannot be scheduled right away as preemption victims receive their graceful termination periods. This field does not guarantee that the pod will be scheduled on this node. Scheduler may decide to place the pod elsewhere if other nodes become available sooner. Scheduler may also decide to give the resources on this node to a higher priority pod that is created after preemption. As a result, this field may be different than PodSpec.nodeName when the pod is scheduled.',
          priority:    1,
          field:       '$.metadata.fields[7]'
        },
        {
          name:        'Readiness Gates',
          type:        'string',
          format:      '',
          description: 'If specified, all readiness gates will be evaluated for pod readiness. A pod is ready when all its containers are ready AND all conditions specified in the readiness gates have status equal to "True" More info: https://git.k8s.io/enhancements/keps/sig-network/580-pod-readiness-gates',
          priority:    1,
          field:       '$.metadata.fields[8]'
        }
      ],
      group:      '',
      kind:       'Pod',
      namespaced: true,
      resource:   'pods',
      verbs:      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  };
}
