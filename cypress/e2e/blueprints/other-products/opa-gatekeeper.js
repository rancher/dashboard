import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

const k8sSchemas = [
  {
    id:    'status.gatekeeper.sh.expansiontemplatepodstatus',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/status.gatekeeper.sh.expansiontemplatepodstatuses',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/status.gatekeeper.sh.expansiontemplatepodstatus'
    },
    description:     'ExpansionTemplatePodStatus is the Schema for the expansiontemplatepodstatuses API.',
    pluralName:      'status.gatekeeper.sh.expansiontemplatepodstatuses',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'status.gatekeeper.sh',
      kind:       'ExpansionTemplatePodStatus',
      namespaced: true,
      resource:   'expansiontemplatepodstatuses',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  },
  {
    id:    'mutations.gatekeeper.sh.assignmetadata',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/mutations.gatekeeper.sh.assignmetadata',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/mutations.gatekeeper.sh.assignmetadata'
    },
    description:     'AssignMetadata is the Schema for the assignmetadata API.',
    pluralName:      'mutations.gatekeeper.sh.assignmetadata',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'mutations.gatekeeper.sh',
      kind:       'AssignMetadata',
      namespaced: false,
      resource:   'assignmetadata',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'status.gatekeeper.sh.constrainttemplatepodstatus',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/status.gatekeeper.sh.constrainttemplatepodstatuses',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/status.gatekeeper.sh.constrainttemplatepodstatus'
    },
    description:     'ConstraintTemplatePodStatus is the Schema for the constrainttemplatepodstatuses API.',
    pluralName:      'status.gatekeeper.sh.constrainttemplatepodstatuses',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'status.gatekeeper.sh',
      kind:       'ConstraintTemplatePodStatus',
      namespaced: true,
      resource:   'constrainttemplatepodstatuses',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  },
  {
    id:    'mutations.gatekeeper.sh.assign',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/mutations.gatekeeper.sh.assign',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/mutations.gatekeeper.sh.assign'
    },
    description:     'Assign is the Schema for the assign API.',
    pluralName:      'mutations.gatekeeper.sh.assign',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'mutations.gatekeeper.sh',
      kind:       'Assign',
      namespaced: false,
      resource:   'assign',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'mutations.gatekeeper.sh.assignimage',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/mutations.gatekeeper.sh.assignimage',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/mutations.gatekeeper.sh.assignimage'
    },
    description:     'AssignImage is the Schema for the assignimage API.',
    pluralName:      'mutations.gatekeeper.sh.assignimage',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:            'mutations.gatekeeper.sh',
      kind:             'AssignImage',
      namespaced:       false,
      preferredVersion: 'v1',
      resource:         'assignimage',
      verbs:            [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1alpha1'
    }
  },
  {
    id:    'status.gatekeeper.sh.constraintpodstatus',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/status.gatekeeper.sh.constraintpodstatuses',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/status.gatekeeper.sh.constraintpodstatus'
    },
    description:     'ConstraintPodStatus is the Schema for the constraintpodstatuses API.',
    pluralName:      'status.gatekeeper.sh.constraintpodstatuses',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'status.gatekeeper.sh',
      kind:       'ConstraintPodStatus',
      namespaced: true,
      resource:   'constraintpodstatuses',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  },
  {
    id:    'status.gatekeeper.sh.mutatorpodstatus',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/status.gatekeeper.sh.mutatorpodstatuses',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/status.gatekeeper.sh.mutatorpodstatus'
    },
    description:     'MutatorPodStatus is the Schema for the mutationpodstatuses API.',
    pluralName:      'status.gatekeeper.sh.mutatorpodstatuses',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'status.gatekeeper.sh',
      kind:       'MutatorPodStatus',
      namespaced: true,
      resource:   'mutatorpodstatuses',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  },
  {
    id:    'expansion.gatekeeper.sh.expansiontemplate',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/expansion.gatekeeper.sh.expansiontemplate',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/expansion.gatekeeper.sh.expansiontemplate'
    },
    description:     'ExpansionTemplate is the Schema for the ExpansionTemplate API.',
    pluralName:      'expansion.gatekeeper.sh.expansiontemplate',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'expansion.gatekeeper.sh',
      kind:       'ExpansionTemplate',
      namespaced: false,
      resource:   'expansiontemplate',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  },
  {
    id:    'constraints.gatekeeper.sh.k8srequiredlabels',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8srequiredlabels',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/constraints.gatekeeper.sh.k8srequiredlabels'
    },
    pluralName:      'constraints.gatekeeper.sh.k8srequiredlabels',
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
          name:  'enforcement-action',
          field: '.spec.enforcementAction',
          type:  'string'
        },
        {
          name:  'total-violations',
          field: '.status.totalViolations',
          type:  'integer'
        }
      ],
      group:      'constraints.gatekeeper.sh',
      kind:       'K8sRequiredLabels',
      namespaced: false,
      resource:   'k8srequiredlabels',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  },
  {
    id:    'externaldata.gatekeeper.sh.provider',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/externaldata.gatekeeper.sh.providers',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/externaldata.gatekeeper.sh.provider'
    },
    description:     'Provider is the Schema for the providers API',
    pluralName:      'externaldata.gatekeeper.sh.providers',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'externaldata.gatekeeper.sh',
      kind:       'Provider',
      namespaced: false,
      resource:   'providers',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  },
  {
    id:    'config.gatekeeper.sh.config',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/config.gatekeeper.sh.configs',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/config.gatekeeper.sh.config'
    },
    description:     'Config is the Schema for the configs API.',
    pluralName:      'config.gatekeeper.sh.configs',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'config.gatekeeper.sh',
      kind:       'Config',
      namespaced: true,
      resource:   'configs',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1alpha1'
    }
  },
  {
    id:    'mutations.gatekeeper.sh.modifyset',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/mutations.gatekeeper.sh.modifyset',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/mutations.gatekeeper.sh.modifyset'
    },
    description:     'ModifySet allows the user to modify non-keyed lists, such as the list of arguments to a container.',
    pluralName:      'mutations.gatekeeper.sh.modifyset',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'mutations.gatekeeper.sh',
      kind:       'ModifySet',
      namespaced: false,
      resource:   'modifyset',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'templates.gatekeeper.sh.constrainttemplate',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/templates.gatekeeper.sh.constrainttemplate'
    },
    description:     'ConstraintTemplate is the Schema for the constrainttemplates API',
    pluralName:      'templates.gatekeeper.sh.constrainttemplates',
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
          name:        'Age',
          type:        'date',
          format:      '',
          description: 'CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.\n\nPopulated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata',
          priority:    0,
          field:       '$.metadata.fields[1]'
        }
      ],
      group:      'templates.gatekeeper.sh',
      kind:       'ConstraintTemplate',
      namespaced: false,
      resource:   'constrainttemplates',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  },
  {
    id:    'constraints.gatekeeper.sh.k8sallowedrepos',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8sallowedrepos',
      self:       'https://localhost:8005/k8s/clusters/local/v1/schemas/constraints.gatekeeper.sh.k8sallowedrepos'
    },
    pluralName:      'constraints.gatekeeper.sh.k8sallowedrepos',
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
          name:  'enforcement-action',
          field: '.spec.enforcementAction',
          type:  'string'
        },
        {
          name:  'total-violations',
          field: '.status.totalViolations',
          type:  'integer'
        }
      ],
      group:      'constraints.gatekeeper.sh',
      kind:       'K8sAllowedRepos',
      namespaced: false,
      resource:   'k8sallowedrepos',
      verbs:      [
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'create',
        'update',
        'watch'
      ],
      version: 'v1beta1'
    }
  }
];

const allowedReposGet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8sallowedrepos' },
  createTypes:  { 'constraints.gatekeeper.sh.k8sallowedrepos': 'https://localhost:8005/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8sallowedrepos' },
  actions:      {},
  resourceType: 'constraints.gatekeeper.sh.k8sallowedrepos',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  data:         []
};

const requiredLabelsGet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8srequiredlabels' },
  createTypes:  { 'constraints.gatekeeper.sh.k8srequiredlabels': 'https://localhost:8005/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8srequiredlabels' },
  actions:      {},
  resourceType: 'constraints.gatekeeper.sh.k8srequiredlabels',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  data:         []
};

const constraintTemplatesGet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates' },
  createTypes:  { 'templates.gatekeeper.sh.constrainttemplate': 'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates' },
  actions:      {},
  resourceType: 'templates.gatekeeper.sh.constrainttemplate',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        2,
  data:         [
    {
      id:    'k8sallowedrepos',
      type:  'templates.gatekeeper.sh.constrainttemplate',
      links: {
        remove: 'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates/k8sallowedrepos',
        self:   'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates/k8sallowedrepos',
        update: 'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates/k8sallowedrepos',
        view:   'https://localhost:8005/k8s/clusters/local/apis/templates.gatekeeper.sh/v1/constrainttemplates/k8sallowedrepos'
      },
      apiVersion: 'templates.gatekeeper.sh/v1',
      kind:       'ConstraintTemplate',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-gatekeeper',
          'meta.helm.sh/release-namespace': 'cattle-gatekeeper-system'
        },
        creationTimestamp: '2024-04-05T12:57:24Z',
        fields:            [
          'k8sallowedrepos',
          '36m'
        ],
        generation:      1,
        labels:          { 'app.kubernetes.io/managed-by': 'Helm' },
        name:            'k8sallowedrepos',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'e44c7c20-28fa-4b8e-a9c1-c2a0358ee4f4'
      },
      spec: {
        crd: {
          spec: {
            names:      { kind: 'K8sAllowedRepos' },
            validation: {
              legacySchema:    true,
              openAPIV3Schema: {
                properties: {
                  repos: {
                    items: { type: 'string' },
                    type:  'array'
                  }
                }
              }
            }
          }
        },
        targets: [
          {
            rego:   'package k8sallowedrepos\n\nviolation[{"msg": msg}] {\n  container := input.review.object.spec.containers[_]\n  satisfied := [good | repo = input.parameters.repos[_] ; good = startswith(container.image, repo)]\n  not any(satisfied)\n  msg := sprintf("container <%v> has an invalid image repo <%v>, allowed repos are %v", [container.name, container.image, input.parameters.repos])\n}\n\nviolation[{"msg": msg}] {\n  container := input.review.object.spec.initContainers[_]\n  satisfied := [good | repo = input.parameters.repos[_] ; good = startswith(container.image, repo)]\n  not any(satisfied)\n  msg := sprintf("container <%v> has an invalid image repo <%v>, allowed repos are %v", [container.name, container.image, input.parameters.repos])\n}\n',
            target: 'admission.k8s.gatekeeper.sh'
          }
        ]
      },
      status: {
        byPod: [
          {
            id:                 'gatekeeper-audit-64ddbb6f99-4hc49',
            observedGeneration: 1,
            operations:         [
              'audit',
              'mutation-status',
              'status'
            ],
            templateUID: 'e44c7c20-28fa-4b8e-a9c1-c2a0358ee4f4'
          },
          {
            id:                 'gatekeeper-controller-manager-c99ff4769-4k2lz',
            observedGeneration: 1,
            operations:         [
              'mutation-webhook',
              'webhook'
            ],
            templateUID: 'e44c7c20-28fa-4b8e-a9c1-c2a0358ee4f4'
          },
          {
            id:                 'gatekeeper-controller-manager-c99ff4769-9m8bp',
            observedGeneration: 1,
            operations:         [
              'mutation-webhook',
              'webhook'
            ],
            templateUID: 'e44c7c20-28fa-4b8e-a9c1-c2a0358ee4f4'
          },
          {
            id:                 'gatekeeper-controller-manager-c99ff4769-nf8d8',
            observedGeneration: 1,
            operations:         [
              'mutation-webhook',
              'webhook'
            ],
            templateUID: 'e44c7c20-28fa-4b8e-a9c1-c2a0358ee4f4'
          }
        ],
        created: true
      }
    },
    {
      id:    'k8srequiredlabels',
      type:  'templates.gatekeeper.sh.constrainttemplate',
      links: {
        remove: 'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates/k8srequiredlabels',
        self:   'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates/k8srequiredlabels',
        update: 'https://localhost:8005/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates/k8srequiredlabels',
        view:   'https://localhost:8005/k8s/clusters/local/apis/templates.gatekeeper.sh/v1/constrainttemplates/k8srequiredlabels'
      },
      apiVersion: 'templates.gatekeeper.sh/v1',
      kind:       'ConstraintTemplate',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':      'rancher-gatekeeper',
          'meta.helm.sh/release-namespace': 'cattle-gatekeeper-system'
        },
        creationTimestamp: '2024-04-05T12:57:24Z',
        fields:            [
          'k8srequiredlabels',
          '36m'
        ],
        generation:      1,
        labels:          { 'app.kubernetes.io/managed-by': 'Helm' },
        name:            'k8srequiredlabels',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'd11aeb71-cd58-425c-bcdc-5959ac4fa2c3'
      },
      spec: {
        crd: {
          spec: {
            names:      { kind: 'K8sRequiredLabels' },
            validation: {
              legacySchema:    true,
              openAPIV3Schema: {
                properties: {
                  labels: {
                    items: {
                      properties: {
                        allowedRegex: { type: 'string' },
                        key:          { type: 'string' }
                      },
                      type: 'object'
                    },
                    type: 'array'
                  },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        targets: [
          {
            rego:   'package k8srequiredlabels\n\nget_message(parameters, _default) = msg {\n  not parameters.message\n  msg := _default\n}\n\nget_message(parameters, _default) = msg {\n  msg := parameters.message\n}\n\nviolation[{"msg": msg, "details": {"missing_labels": missing}}] {\n  provided := {label | input.review.object.metadata.labels[label]}\n  required := {label | label := input.parameters.labels[_].key}\n  missing := required - provided\n  count(missing) > 0\n  def_msg := sprintf("you must provide labels: %v", [missing])\n  msg := get_message(input.parameters, def_msg)\n}\n\nviolation[{"msg": msg}] {\n  value := input.review.object.metadata.labels[key]\n  expected := input.parameters.labels[_]\n  expected.key == key\n  # do not match if allowedRegex is not defined, or is an empty string\n  expected.allowedRegex != ""\n  not re_match(expected.allowedRegex, value)\n  def_msg := sprintf("Label <%v: %v> does not satisfy allowed regex: %v", [key, value, expected.allowedRegex])\n  msg := get_message(input.parameters, def_msg)\n}\n',
            target: 'admission.k8s.gatekeeper.sh'
          }
        ]
      },
      status: {
        byPod: [
          {
            id:                 'gatekeeper-audit-64ddbb6f99-4hc49',
            observedGeneration: 1,
            operations:         [
              'audit',
              'mutation-status',
              'status'
            ],
            templateUID: 'd11aeb71-cd58-425c-bcdc-5959ac4fa2c3'
          },
          {
            id:                 'gatekeeper-controller-manager-c99ff4769-4k2lz',
            observedGeneration: 1,
            operations:         [
              'mutation-webhook',
              'webhook'
            ],
            templateUID: 'd11aeb71-cd58-425c-bcdc-5959ac4fa2c3'
          },
          {
            id:                 'gatekeeper-controller-manager-c99ff4769-9m8bp',
            observedGeneration: 1,
            operations:         [
              'mutation-webhook',
              'webhook'
            ],
            templateUID: 'd11aeb71-cd58-425c-bcdc-5959ac4fa2c3'
          },
          {
            id:                 'gatekeeper-controller-manager-c99ff4769-nf8d8',
            observedGeneration: 1,
            operations:         [
              'mutation-webhook',
              'webhook'
            ],
            templateUID: 'd11aeb71-cd58-425c-bcdc-5959ac4fa2c3'
          }
        ],
        created: true
      }
    }
  ]
};

function reply(statusCode, body) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function generateOpaGatekeeperForLocalCluster() {
  cy.intercept('GET', `/k8s/clusters/local/v1/schemas?*`, (req) => {
    req.continue((res) => {
      const schemaData = [...res.body.data, ...k8sSchemas];

      res.body.data = schemaData;
      res.send(res.body);
    });
  }).as('k8sSchemas');

  const interceptsData = [
    ['/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8sallowedrepos?*', allowedReposGet],
    ['/k8s/clusters/local/v1/constraints.gatekeeper.sh.k8srequiredlabels?*', requiredLabelsGet],
    ['/k8s/clusters/local/v1/templates.gatekeeper.sh.constrainttemplates?*', constraintTemplatesGet],
  ];

  interceptsData.forEach((requestData, i) => {
    cy.intercept('GET', `${ requestData[0] }?*`,
      reply(200, requestData[1])).as(`monitoring-req-${ i }`);
  });

  return true;
}
