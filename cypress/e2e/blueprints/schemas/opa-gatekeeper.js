export const gatekeeperSchemas = [
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.match.kinds',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.match.kinds' },
    description:    'Kinds accepts a list of objects with apiGroups and kinds fields that list the groups/kinds of objects to which the mutation will apply. If multiple groups/kinds objects are specified, only one match is needed for the resource to be in scope.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.match.kindses',
    resourceFields: {
      apiGroups: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: "APIGroups is the API groups the resources belong to. '*' is all groups. If '*' is present, the length of the slice must be one. Required."
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelector' },
    description:    'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelector' },
    description:    "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace.",
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.match',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.match' },
    description:    'Match allows the user to limit which resources get mutated. Individual match criteria are AND-ed together. An undefined match criteria matches everything.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.matches',
    resourceFields: {
      excludedNamespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExcludedNamespaces is a list of namespace names. If defined, a constraint only applies to resources not in a listed namespace. ExcludedNamespaces also supports a prefix or suffix based glob.  For example, `excludedNamespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `excludedNamespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      kinds: {
        type:     'array[mutations.gatekeeper.sh.v1.modifyset.spec.match.kinds]',
        nullable: true,
        create:   true,
        update:   true
      },
      labelSelector: {
        type:        'mutations.gatekeeper.sh.v1.modifyset.spec.match.labelSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.'
      },
      name: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Name is the name of an object.  If defined, it will match against objects with the specified name.  Name also supports a prefix or suffix glob.  For example, `name: pod-*` would match both `pod-a` and `pod-b`, and `name: *-pod` would match both `a-pod` and `b-pod`.'
      },
      namespaceSelector: {
        type:        'mutations.gatekeeper.sh.v1.modifyset.spec.match.namespaceSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace."
      },
      namespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Namespaces is a list of namespace names. If defined, a constraint only applies to resources in a listed namespace.  Namespaces also supports a prefix or suffix based glob.  For example, `namespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `namespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      scope: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Scope determines if cluster-scoped and/or namespaced-scoped resources are matched.  Accepts `*`, `Cluster`, or `Namespaced`. (defaults to `*`)'
      },
      source: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Source determines whether generated or original resources are matched. Accepts `Generated`|`Original`|`All` (defaults to `All`). A value of `Generated` will only match generated resources, while `Original` will only match regular resources.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.parameters.pathTests',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.parameters.pathTests' },
    description:    'PathTest allows the user to customize how the mutation works if parent paths are missing. It traverses the list in order. All sub paths are tested against the provided condition, if the test fails, the mutation is not applied. All `subPath` entries must be a prefix of `location`. Any glob characters will take on the same value as was used to expand the matching glob in `location`. \n Available Tests: * MustExist    - the path must exist or do not mutate * MustNotExist - the path must not exist or do not mutate.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.parameters.pathTestses',
    resourceFields: {
      condition: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Condition describes whether the path either MustExist or MustNotExist in the original object'
      },
      subPath: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.parameters.values',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.parameters.values' },
    description:    'Values describes the values provided to the operation as `values.fromList`.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.parameters.valueses',
    resourceFields: {}
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.parameters',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.parameters' },
    description:    'Parameters define the behavior of the mutator.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.parameterses',
    resourceFields: {
      operation: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Operation describes whether values should be merged in ("merge"), or pruned ("prune"). Default value is "merge"'
      },
      pathTests: {
        type:        'array[mutations.gatekeeper.sh.v1.modifyset.spec.parameters.pathTests]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'PathTests are a series of existence tests that can be checked before a mutation is applied'
      },
      values: {
        type:        'mutations.gatekeeper.sh.v1.modifyset.spec.parameters.values',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Values describes the values provided to the operation as `values.fromList`.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec.applyTo',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec.applyTo' },
    description:    'ApplyTo determines what GVKs items the mutation should apply to. Globs are not allowed.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.spec.applyTos',
    resourceFields: {
      groups: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      versions: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.spec' },
    description:    'ModifySetSpec defines the desired state of ModifySet.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.specs',
    resourceFields: {
      applyTo: {
        type:        'array[mutations.gatekeeper.sh.v1.modifyset.spec.applyTo]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ApplyTo lists the specific groups, versions and kinds a mutation will be applied to. This is necessary because every mutation implies part of an object schema and object schemas are associated with specific GVKs.'
      },
      location: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Location describes the path to be mutated, for example: `spec.containers[name: main].args`.'
      },
      match: {
        type:        'mutations.gatekeeper.sh.v1.modifyset.spec.match',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Match allows the user to limit which resources get mutated. Individual match criteria are AND-ed together. An undefined match criteria matches everything.'
      },
      parameters: {
        type:        'mutations.gatekeeper.sh.v1.modifyset.spec.parameters',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Parameters define the behavior of the mutator.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.status.byPod.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.status.byPod.errors' },
    description:    'MutatorError represents a single error caught while adding a mutator to a system.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.status.byPod.errorses',
    resourceFields: {
      _type: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Type indicates a specific class of error for use by controller code. If not present, the error should be treated as not matching any known type.'
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.status.byPod',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.status.byPod' },
    description:    'MutatorPodStatusStatus defines the observed state of MutatorPodStatus.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.status.byPods',
    resourceFields: {
      _id: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      enforced: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      },
      errors: {
        type:     'array[mutations.gatekeeper.sh.v1.modifyset.status.byPod.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      mutatorUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Storing the mutator UID allows us to detect drift, such as when a mutator has been recreated after its CRD was deleted out from under it, interrupting the watch'
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.modifyset.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.modifyset.status' },
    description:    'ModifySetStatus defines the observed state of ModifySet.',
    pluralName:     'mutations.gatekeeper.sh.v1.modifyset.statuses',
    resourceFields: {
      byPod: {
        type:     'array[mutations.gatekeeper.sh.v1.modifyset.status.byPod]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:    'mutations.gatekeeper.sh.modifyset',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/mutations.gatekeeper.sh.modifyset',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.modifyset'
    },
    description:     'ModifySet allows the user to modify non-keyed lists, such as the list of arguments to a container.',
    pluralName:      'mutations.gatekeeper.sh.modifyset',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'mutations.gatekeeper.sh.v1.modifyset.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ModifySetSpec defines the desired state of ModifySet.'
      },
      status: {
        type:        'mutations.gatekeeper.sh.v1.modifyset.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ModifySetStatus defines the observed state of ModifySet.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.status.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.status.errors' },
    description:    'CreateCRDError represents a single error caught during parsing, compiling, etc.',
    pluralName:     'status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.status.errorses',
    resourceFields: {
      code: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      },
      location: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.status' },
    description:    'ConstraintTemplatePodStatusStatus defines the observed state of ConstraintTemplatePodStatus.',
    pluralName:     'status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.statuses',
    resourceFields: {
      _id: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Important: Run "make" to regenerate code after modifying this file'
      },
      errors: {
        type:     'array[status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.status.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      templateUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: "UID is a type that holds unique ID values, including UUIDs.  Because we don't ONLY use UUIDs, this is an alias to string.  Being a type captures intent and helps make sure that UIDs and names do not get conflated."
      }
    }
  },
  {
    id:    'status.gatekeeper.sh.constrainttemplatepodstatus',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/status.gatekeeper.sh.constrainttemplatepodstatuses',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.constrainttemplatepodstatus'
    },
    description:     'ConstraintTemplatePodStatus is the Schema for the constrainttemplatepodstatuses API.',
    pluralName:      'status.gatekeeper.sh.constrainttemplatepodstatuses',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      status: {
        type:        'status.gatekeeper.sh.v1beta1.constrainttemplatepodstatus.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ConstraintTemplatePodStatusStatus defines the observed state of ConstraintTemplatePodStatus.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.status.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.status.errors' },
    pluralName:     'status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.status.errorses',
    resourceFields: {
      _type: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.status' },
    description:    'ExpansionTemplatePodStatusStatus defines the observed state of ExpansionTemplatePodStatus.',
    pluralName:     'status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.statuses',
    resourceFields: {
      _id: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Important: Run "make" to regenerate code after modifying this file'
      },
      errors: {
        type:     'array[status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.status.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      templateUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: "UID is a type that holds unique ID values, including UUIDs.  Because we don't ONLY use UUIDs, this is an alias to string.  Being a type captures intent and helps make sure that UIDs and names do not get conflated."
      }
    }
  },
  {
    id:    'status.gatekeeper.sh.expansiontemplatepodstatus',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/status.gatekeeper.sh.expansiontemplatepodstatuses',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.expansiontemplatepodstatus'
    },
    description:     'ExpansionTemplatePodStatus is the Schema for the expansiontemplatepodstatuses API.',
    pluralName:      'status.gatekeeper.sh.expansiontemplatepodstatuses',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      status: {
        type:        'status.gatekeeper.sh.v1beta1.expansiontemplatepodstatus.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExpansionTemplatePodStatusStatus defines the observed state of ExpansionTemplatePodStatus.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameters.pathTests',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameters.pathTests' },
    description:    'PathTest allows the user to customize how the mutation works if parent paths are missing. It traverses the list in order. All sub paths are tested against the provided condition, if the test fails, the mutation is not applied. All `subPath` entries must be a prefix of `location`. Any glob characters will take on the same value as was used to expand the matching glob in `location`. \n Available Tests: * MustExist    - the path must exist or do not mutate * MustNotExist - the path must not exist or do not mutate.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameters.pathTestses',
    resourceFields: {
      condition: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Condition describes whether the path either MustExist or MustNotExist in the original object'
      },
      subPath: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameters',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameters' },
    description:    'Parameters define the behavior of the mutator.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameterses',
    resourceFields: {
      assignDomain: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignDomain sets the domain component on an image string. The trailing slash should not be included.'
      },
      assignPath: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignPath sets the domain component on an image string.'
      },
      assignTag: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignImage sets the image component on an image string. It must start with a `:` or `@`.'
      },
      pathTests: {
        type:     'array[mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameters.pathTests]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.applyTo',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.applyTo' },
    description:    'ApplyTo determines what GVKs items the mutation should apply to. Globs are not allowed.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.applyTos',
    resourceFields: {
      groups: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      versions: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.kinds',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.kinds' },
    description:    'Kinds accepts a list of objects with apiGroups and kinds fields that list the groups/kinds of objects to which the mutation will apply. If multiple groups/kinds objects are specified, only one match is needed for the resource to be in scope.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.kindses',
    resourceFields: {
      apiGroups: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: "APIGroups is the API groups the resources belong to. '*' is all groups. If '*' is present, the length of the slice must be one. Required."
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelector' },
    description:    'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelector' },
    description:    "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace.",
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match' },
    description:    'Match allows the user to limit which resources get mutated. Individual match criteria are AND-ed together. An undefined match criteria matches everything.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.matches',
    resourceFields: {
      excludedNamespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExcludedNamespaces is a list of namespace names. If defined, a constraint only applies to resources not in a listed namespace. ExcludedNamespaces also supports a prefix or suffix based glob.  For example, `excludedNamespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `excludedNamespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      kinds: {
        type:     'array[mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.kinds]',
        nullable: true,
        create:   true,
        update:   true
      },
      labelSelector: {
        type:        'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.labelSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.'
      },
      name: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Name is the name of an object.  If defined, it will match against objects with the specified name.  Name also supports a prefix or suffix glob.  For example, `name: pod-*` would match both `pod-a` and `pod-b`, and `name: *-pod` would match both `a-pod` and `b-pod`.'
      },
      namespaceSelector: {
        type:        'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match.namespaceSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace."
      },
      namespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Namespaces is a list of namespace names. If defined, a constraint only applies to resources in a listed namespace.  Namespaces also supports a prefix or suffix based glob.  For example, `namespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `namespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      scope: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Scope determines if cluster-scoped and/or namespaced-scoped resources are matched.  Accepts `*`, `Cluster`, or `Namespaced`. (defaults to `*`)'
      },
      source: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Source determines whether generated or original resources are matched. Accepts `Generated`|`Original`|`All` (defaults to `All`). A value of `Generated` will only match generated resources, while `Original` will only match regular resources.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.spec' },
    description:    'AssignImageSpec defines the desired state of AssignImage.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.specs',
    resourceFields: {
      applyTo: {
        type:        'array[mutations.gatekeeper.sh.v1alpha1.assignimage.spec.applyTo]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ApplyTo lists the specific groups, versions and kinds a mutation will be applied to. This is necessary because every mutation implies part of an object schema and object schemas are associated with specific GVKs.'
      },
      location: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Location describes the path to be mutated, for example: `spec.containers[name: main].image`.'
      },
      match: {
        type:        'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.match',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Match allows the user to limit which resources get mutated. Individual match criteria are AND-ed together. An undefined match criteria matches everything.'
      },
      parameters: {
        type:        'mutations.gatekeeper.sh.v1alpha1.assignimage.spec.parameters',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Parameters define the behavior of the mutator.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPod.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPod.errors' },
    description:    'MutatorError represents a single error caught while adding a mutator to a system.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPod.errorses',
    resourceFields: {
      _type: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Type indicates a specific class of error for use by controller code. If not present, the error should be treated as not matching any known type.'
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPod',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPod' },
    description:    'MutatorPodStatusStatus defines the observed state of MutatorPodStatus.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPods',
    resourceFields: {
      _id: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      enforced: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      },
      errors: {
        type:     'array[mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPod.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      mutatorUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Storing the mutator UID allows us to detect drift, such as when a mutator has been recreated after its CRD was deleted out from under it, interrupting the watch'
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1alpha1.assignimage.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1alpha1.assignimage.status' },
    description:    'AssignImageStatus defines the observed state of AssignImage.',
    pluralName:     'mutations.gatekeeper.sh.v1alpha1.assignimage.statuses',
    resourceFields: {
      byPod: {
        type:     'array[mutations.gatekeeper.sh.v1alpha1.assignimage.status.byPod]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:    'mutations.gatekeeper.sh.assignimage',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/mutations.gatekeeper.sh.assignimage',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.assignimage'
    },
    description:     'AssignImage is the Schema for the assignimage API.',
    pluralName:      'mutations.gatekeeper.sh.assignimage',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'mutations.gatekeeper.sh.v1alpha1.assignimage.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignImageSpec defines the desired state of AssignImage.'
      },
      status: {
        type:        'mutations.gatekeeper.sh.v1alpha1.assignimage.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignImageStatus defines the observed state of AssignImage.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec.targets.code',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec.targets.code' },
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.targets.codes',
    resourceFields: {
      engine: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'The engine used to evaluate the code. Example: "Rego". Required.'
      },
      source: {
        type:        'json',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'The source code for the template. Required.'
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec.targets',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec.targets' },
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.targetses',
    resourceFields: {
      code: {
        type:        'array[templates.gatekeeper.sh.v1.constrainttemplate.spec.targets.code]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'The source code options for the constraint template. "Rego" can only be specified in one place (either here or in the "rego" field)'
      },
      libs: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      rego: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      target: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.names',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.names' },
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.nameses',
    resourceFields: {
      kind: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      shortNames: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validation.openAPIV3Schema',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validation.openAPIV3Schema' },
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validation.openAPIV3Schemas',
    resourceFields: {}
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validation',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validation' },
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validations',
    resourceFields: {
      legacySchema: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      },
      openAPIV3Schema: {
        type:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validation.openAPIV3Schema',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec' },
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.specs',
    resourceFields: {
      names: {
        type:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.names',
        nullable: true,
        create:   true,
        update:   true
      },
      validation: {
        type:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec.validation',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec.crd' },
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crds',
    resourceFields: {
      spec: {
        type:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd.spec',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.spec' },
    description:    'ConstraintTemplateSpec defines the desired state of ConstraintTemplate.',
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.specs',
    resourceFields: {
      crd: {
        type:     'templates.gatekeeper.sh.v1.constrainttemplate.spec.crd',
        nullable: true,
        create:   true,
        update:   true
      },
      targets: {
        type:     'array[templates.gatekeeper.sh.v1.constrainttemplate.spec.targets]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.status.byPod.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.status.byPod.errors' },
    description:    'CreateCRDError represents a single error caught during parsing, compiling, etc.',
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.status.byPod.errorses',
    resourceFields: {
      code: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      },
      location: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.status.byPod',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.status.byPod' },
    description:    'ByPodStatus defines the observed state of ConstraintTemplate as seen by an individual controller',
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.status.byPods',
    resourceFields: {
      _id: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'a unique identifier for the pod that wrote the status'
      },
      errors: {
        type:     'array[templates.gatekeeper.sh.v1.constrainttemplate.status.byPod.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'templates.gatekeeper.sh.v1.constrainttemplate.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.v1.constrainttemplate.status' },
    description:    'ConstraintTemplateStatus defines the observed state of ConstraintTemplate.',
    pluralName:     'templates.gatekeeper.sh.v1.constrainttemplate.statuses',
    resourceFields: {
      byPod: {
        type:     'array[templates.gatekeeper.sh.v1.constrainttemplate.status.byPod]',
        nullable: true,
        create:   true,
        update:   true
      },
      created: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:    'templates.gatekeeper.sh.constrainttemplate',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/templates.gatekeeper.sh.constrainttemplates',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/templates.gatekeeper.sh.constrainttemplate'
    },
    description:     'ConstraintTemplate is the Schema for the constrainttemplates API',
    pluralName:      'templates.gatekeeper.sh.constrainttemplates',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'templates.gatekeeper.sh.v1.constrainttemplate.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ConstraintTemplateSpec defines the desired state of ConstraintTemplate.'
      },
      status: {
        type:        'templates.gatekeeper.sh.v1.constrainttemplate.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ConstraintTemplateStatus defines the observed state of ConstraintTemplate.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.applyTo',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.applyTo' },
    description:    'ApplyTo determines what GVKs items the mutation should apply to. Globs are not allowed.',
    pluralName:     'expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.applyTos',
    resourceFields: {
      groups: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      versions: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.generatedGVK',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.generatedGVK' },
    description:    'GeneratedGVK specifies the GVK of the resources which the generator resource creates.',
    pluralName:     'expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.generatedGVKs',
    resourceFields: {
      group: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      kind: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      version: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec' },
    description:    'ExpansionTemplateSpec defines the desired state of ExpansionTemplate.',
    pluralName:     'expansion.gatekeeper.sh.v1beta1.expansiontemplate.specs',
    resourceFields: {
      applyTo: {
        type:        'array[expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.applyTo]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ApplyTo lists the specific groups, versions and kinds of generator resources which will be expanded.'
      },
      enforcementAction: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'EnforcementAction specifies the enforcement action to be used for resources matching the ExpansionTemplate. Specifying an empty value will use the enforcement action specified by the Constraint in violation.'
      },
      generatedGVK: {
        type:        'expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec.generatedGVK',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'GeneratedGVK specifies the GVK of the resources which the generator resource creates.'
      },
      templateSource: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'TemplateSource specifies the source field on the generator resource to use as the base for expanded resource. For Pod-creating generators, this is usually spec.template'
      }
    }
  },
  {
    id:             'expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPod.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPod.errors' },
    pluralName:     'expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPod.errorses',
    resourceFields: {
      _type: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPod',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPod' },
    description:    'ExpansionTemplatePodStatusStatus defines the observed state of ExpansionTemplatePodStatus.',
    pluralName:     'expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPods',
    resourceFields: {
      _id: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Important: Run "make" to regenerate code after modifying this file'
      },
      errors: {
        type:     'array[expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPod.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      templateUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: "UID is a type that holds unique ID values, including UUIDs.  Because we don't ONLY use UUIDs, this is an alias to string.  Being a type captures intent and helps make sure that UIDs and names do not get conflated."
      }
    }
  },
  {
    id:             'expansion.gatekeeper.sh.v1beta1.expansiontemplate.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/expansion.gatekeeper.sh.v1beta1.expansiontemplate.status' },
    description:    'ExpansionTemplateStatus defines the observed state of ExpansionTemplate.',
    pluralName:     'expansion.gatekeeper.sh.v1beta1.expansiontemplate.statuses',
    resourceFields: {
      byPod: {
        type:     'array[expansion.gatekeeper.sh.v1beta1.expansiontemplate.status.byPod]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:    'expansion.gatekeeper.sh.expansiontemplate',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/expansion.gatekeeper.sh.expansiontemplate',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/expansion.gatekeeper.sh.expansiontemplate'
    },
    description:     'ExpansionTemplate is the Schema for the ExpansionTemplate API.',
    pluralName:      'expansion.gatekeeper.sh.expansiontemplate',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'expansion.gatekeeper.sh.v1beta1.expansiontemplate.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExpansionTemplateSpec defines the desired state of ExpansionTemplate.'
      },
      status: {
        type:        'expansion.gatekeeper.sh.v1beta1.expansiontemplate.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExpansionTemplateStatus defines the observed state of ExpansionTemplate.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'externaldata.gatekeeper.sh.v1beta1.provider.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/externaldata.gatekeeper.sh.v1beta1.provider.spec' },
    description:    'Spec defines the Provider specifications.',
    pluralName:     'externaldata.gatekeeper.sh.v1beta1.provider.specs',
    resourceFields: {
      caBundle: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: "CABundle is a base64-encoded string that contains the TLS CA bundle in PEM format. It is used to verify the signature of the provider's certificate."
      },
      timeout: {
        type:        'integer',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Timeout is the timeout when querying the provider.'
      },
      url: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'URL is the url for the provider. URL is prefixed with https://.'
      }
    }
  },
  {
    id:    'externaldata.gatekeeper.sh.provider',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/externaldata.gatekeeper.sh.providers',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/externaldata.gatekeeper.sh.provider'
    },
    description:     'Provider is the Schema for the Provider API',
    pluralName:      'externaldata.gatekeeper.sh.providers',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'externaldata.gatekeeper.sh.v1beta1.provider.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Spec defines the Provider specifications.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'config.gatekeeper.sh.v1alpha1.config.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.status' },
    description:    'ConfigStatus defines the observed state of Config.',
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.statuses',
    resourceFields: {}
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec.readiness',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec.readiness' },
    description:    'Configuration for readiness tracker',
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.spec.readinesses',
    resourceFields: {
      statsEnabled: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec.sync.syncOnly',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec.sync.syncOnly' },
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.spec.sync.syncOnlies',
    resourceFields: {
      group: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      kind: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      version: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec.sync',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec.sync' },
    description:    'Configuration for syncing k8s objects',
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.spec.syncs',
    resourceFields: {
      syncOnly: {
        type:        'array[config.gatekeeper.sh.v1alpha1.config.spec.sync.syncOnly]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'If non-empty, only entries on this list will be replicated into OPA'
      }
    }
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec.validation.traces.kind',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec.validation.traces.kind' },
    description:    'Only trace requests of the following GroupVersionKind',
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.spec.validation.traces.kinds',
    resourceFields: {
      group: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      kind: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      version: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec.validation.traces',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec.validation.traces' },
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.spec.validation.traceses',
    resourceFields: {
      dump: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Also dump the state of OPA with the trace. Set to `All` to dump everything.'
      },
      kind: {
        type:        'config.gatekeeper.sh.v1alpha1.config.spec.validation.traces.kind',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Only trace requests of the following GroupVersionKind'
      },
      user: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Only trace requests from the specified user'
      }
    }
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec.validation',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec.validation' },
    description:    'Configuration for validation',
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.spec.validations',
    resourceFields: {
      traces: {
        type:        'array[config.gatekeeper.sh.v1alpha1.config.spec.validation.traces]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'List of requests to trace. Both "user" and "kinds" must be specified'
      }
    }
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec.match',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec.match' },
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.spec.matches',
    resourceFields: {
      excludedNamespaces: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      processes: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'config.gatekeeper.sh.v1alpha1.config.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.v1alpha1.config.spec' },
    description:    'ConfigSpec defines the desired state of Config.',
    pluralName:     'config.gatekeeper.sh.v1alpha1.config.specs',
    resourceFields: {
      match: {
        type:        'array[config.gatekeeper.sh.v1alpha1.config.spec.match]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Configuration for namespace exclusion'
      },
      readiness: {
        type:        'config.gatekeeper.sh.v1alpha1.config.spec.readiness',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Configuration for readiness tracker'
      },
      sync: {
        type:        'config.gatekeeper.sh.v1alpha1.config.spec.sync',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Configuration for syncing k8s objects'
      },
      validation: {
        type:        'config.gatekeeper.sh.v1alpha1.config.spec.validation',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Configuration for validation'
      }
    }
  },
  {
    id:    'config.gatekeeper.sh.config',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/config.gatekeeper.sh.configs',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/config.gatekeeper.sh.config'
    },
    description:     'Config is the Schema for the configs API.',
    pluralName:      'config.gatekeeper.sh.configs',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'config.gatekeeper.sh.v1alpha1.config.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ConfigSpec defines the desired state of Config.'
      },
      status: {
        type:        'config.gatekeeper.sh.v1alpha1.config.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ConfigStatus defines the observed state of Config.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'status.gatekeeper.sh.v1beta1.mutatorpodstatus.status.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.mutatorpodstatus.status.errors' },
    description:    'MutatorError represents a single error caught while adding a mutator to a system.',
    pluralName:     'status.gatekeeper.sh.v1beta1.mutatorpodstatus.status.errorses',
    resourceFields: {
      _type: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Type indicates a specific class of error for use by controller code. If not present, the error should be treated as not matching any known type.'
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'status.gatekeeper.sh.v1beta1.mutatorpodstatus.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.mutatorpodstatus.status' },
    description:    'MutatorPodStatusStatus defines the observed state of MutatorPodStatus.',
    pluralName:     'status.gatekeeper.sh.v1beta1.mutatorpodstatus.statuses',
    resourceFields: {
      _id: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      enforced: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      },
      errors: {
        type:     'array[status.gatekeeper.sh.v1beta1.mutatorpodstatus.status.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      mutatorUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Storing the mutator UID allows us to detect drift, such as when a mutator has been recreated after its CRD was deleted out from under it, interrupting the watch'
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:    'status.gatekeeper.sh.mutatorpodstatus',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/status.gatekeeper.sh.mutatorpodstatuses',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.mutatorpodstatus'
    },
    description:     'MutatorPodStatus is the Schema for the mutationpodstatuses API.',
    pluralName:      'status.gatekeeper.sh.mutatorpodstatuses',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      status: {
        type:        'status.gatekeeper.sh.v1beta1.mutatorpodstatus.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'MutatorPodStatusStatus defines the observed state of MutatorPodStatus.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.kinds',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.match.kinds' },
    description:    'Kinds accepts a list of objects with apiGroups and kinds fields that list the groups/kinds of objects to which the mutation will apply. If multiple groups/kinds objects are specified, only one match is needed for the resource to be in scope.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.kindses',
    resourceFields: {
      apiGroups: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: "APIGroups is the API groups the resources belong to. '*' is all groups. If '*' is present, the length of the slice must be one. Required."
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelector' },
    description:    'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelector' },
    description:    "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace.",
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.match',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.match' },
    description:    'Match selects which objects are in scope.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.matches',
    resourceFields: {
      excludedNamespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExcludedNamespaces is a list of namespace names. If defined, a constraint only applies to resources not in a listed namespace. ExcludedNamespaces also supports a prefix or suffix based glob.  For example, `excludedNamespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `excludedNamespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      kinds: {
        type:     'array[mutations.gatekeeper.sh.v1.assignmetadata.spec.match.kinds]',
        nullable: true,
        create:   true,
        update:   true
      },
      labelSelector: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.labelSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.'
      },
      name: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Name is the name of an object.  If defined, it will match against objects with the specified name.  Name also supports a prefix or suffix glob.  For example, `name: pod-*` would match both `pod-a` and `pod-b`, and `name: *-pod` would match both `a-pod` and `b-pod`.'
      },
      namespaceSelector: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.spec.match.namespaceSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace."
      },
      namespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Namespaces is a list of namespace names. If defined, a constraint only applies to resources in a listed namespace.  Namespaces also supports a prefix or suffix based glob.  For example, `namespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `namespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      scope: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Scope determines if cluster-scoped and/or namespaced-scoped resources are matched.  Accepts `*`, `Cluster`, or `Namespaced`. (defaults to `*`)'
      },
      source: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Source determines whether generated or original resources are matched. Accepts `Generated`|`Original`|`All` (defaults to `All`). A value of `Generated` will only match generated resources, while `Original` will only match regular resources.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.fromMetadata',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.fromMetadata' },
    description:    'FromMetadata assigns a value from the specified metadata field.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.fromMetadatas',
    resourceFields: {
      field: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Field specifies which metadata field provides the assigned value. Valid fields are `namespace` and `name`.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.externalData',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.externalData' },
    description:    'ExternalData describes the external data provider to be used for mutation.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.externalDatas',
    resourceFields: {
      dataSource: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'DataSource specifies where to extract the data that will be sent to the external data provider as parameters.'
      },
      default: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Default specifies the default value to use when the external data provider returns an error and the failure policy is set to "UseDefault".'
      },
      failurePolicy: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'FailurePolicy specifies the policy to apply when the external data provider returns an error.'
      },
      provider: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Provider is the name of the external data provider.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign' },
    description:    'Assign.value holds the value to be assigned',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assigns',
    resourceFields: {
      externalData: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.externalData',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExternalData describes the external data provider to be used for mutation.'
      },
      fromMetadata: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign.fromMetadata',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'FromMetadata assigns a value from the specified metadata field.'
      },
      value: {
        type:        'json',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Value is a constant value that will be assigned to `location`'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters' },
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameterses',
    resourceFields: {
      assign: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters.assign',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Assign.value holds the value to be assigned'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.spec' },
    description:    'AssignMetadataSpec defines the desired state of AssignMetadata.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.specs',
    resourceFields: {
      location: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      match: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.spec.match',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Match selects which objects are in scope.'
      },
      parameters: {
        type:     'mutations.gatekeeper.sh.v1.assignmetadata.spec.parameters',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.status.byPod.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.status.byPod.errors' },
    description:    'MutatorError represents a single error caught while adding a mutator to a system.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.status.byPod.errorses',
    resourceFields: {
      _type: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Type indicates a specific class of error for use by controller code. If not present, the error should be treated as not matching any known type.'
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.status.byPod',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.status.byPod' },
    description:    'MutatorPodStatusStatus defines the observed state of MutatorPodStatus.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.status.byPods',
    resourceFields: {
      _id: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      enforced: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      },
      errors: {
        type:     'array[mutations.gatekeeper.sh.v1.assignmetadata.status.byPod.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      mutatorUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Storing the mutator UID allows us to detect drift, such as when a mutator has been recreated after its CRD was deleted out from under it, interrupting the watch'
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assignmetadata.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assignmetadata.status' },
    description:    'AssignMetadataStatus defines the observed state of AssignMetadata.',
    pluralName:     'mutations.gatekeeper.sh.v1.assignmetadata.statuses',
    resourceFields: {
      byPod: {
        type:        'array[mutations.gatekeeper.sh.v1.assignmetadata.status.byPod]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'INSERT ADDITIONAL STATUS FIELD - define observed state of cluster Important: Run "make" to regenerate code after modifying this file'
      }
    }
  },
  {
    id:    'mutations.gatekeeper.sh.assignmetadata',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/mutations.gatekeeper.sh.assignmetadata',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.assignmetadata'
    },
    description:     'AssignMetadata is the Schema for the assignmetadata API.',
    pluralName:      'mutations.gatekeeper.sh.assignmetadata',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignMetadataSpec defines the desired state of AssignMetadata.'
      },
      status: {
        type:        'mutations.gatekeeper.sh.v1.assignmetadata.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignMetadataStatus defines the observed state of AssignMetadata.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'status.gatekeeper.sh.v1beta1.constraintpodstatus.status.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.constraintpodstatus.status.errors' },
    description:    'Error represents a single error caught while adding a constraint to OPA.',
    pluralName:     'status.gatekeeper.sh.v1beta1.constraintpodstatus.status.errorses',
    resourceFields: {
      code: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      },
      location: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'status.gatekeeper.sh.v1beta1.constraintpodstatus.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.v1beta1.constraintpodstatus.status' },
    description:    'ConstraintPodStatusStatus defines the observed state of ConstraintPodStatus.',
    pluralName:     'status.gatekeeper.sh.v1beta1.constraintpodstatus.statuses',
    resourceFields: {
      _id: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      constraintUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Storing the constraint UID allows us to detect drift, such as when a constraint has been recreated after its CRD was deleted out from under it, interrupting the watch'
      },
      enforced: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      },
      errors: {
        type:     'array[status.gatekeeper.sh.v1beta1.constraintpodstatus.status.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:    'status.gatekeeper.sh.constraintpodstatus',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/status.gatekeeper.sh.constraintpodstatuses',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/status.gatekeeper.sh.constraintpodstatus'
    },
    description:     'ConstraintPodStatus is the Schema for the constraintpodstatuses API.',
    pluralName:      'status.gatekeeper.sh.constraintpodstatuses',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      status: {
        type:        'status.gatekeeper.sh.v1beta1.constraintpodstatus.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ConstraintPodStatusStatus defines the observed state of ConstraintPodStatus.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
    id:             'mutations.gatekeeper.sh.v1.assign.spec.match.kinds',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.match.kinds' },
    description:    'Kinds accepts a list of objects with apiGroups and kinds fields that list the groups/kinds of objects to which the mutation will apply. If multiple groups/kinds objects are specified, only one match is needed for the resource to be in scope.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.match.kindses',
    resourceFields: {
      apiGroups: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: "APIGroups is the API groups the resources belong to. '*' is all groups. If '*' is present, the length of the slice must be one. Required."
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.match.labelSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.match.labelSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.match.labelSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.match.labelSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.match.labelSelector' },
    description:    'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.match.labelSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1.assign.spec.match.labelSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelector.matchExpressions',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelector.matchExpressions' },
    description:    'A label selector requirement is a selector that contains values, a key, and an operator that relates the key and values.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelector.matchExpressionses',
    resourceFields: {
      key: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: 'key is the label key that the selector applies to.'
      },
      operator: {
        type:        'string',
        nullable:    true,
        create:      true,
        required:    true,
        update:      true,
        description: "operator represents a key's relationship to a set of values. Valid operators are In, NotIn, Exists and DoesNotExist."
      },
      values: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'values is an array of string values. If the operator is In or NotIn, the values array must be non-empty. If the operator is Exists or DoesNotExist, the values array must be empty. This array is replaced during a strategic merge patch.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelector',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelector' },
    description:    "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace.",
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelectors',
    resourceFields: {
      matchExpressions: {
        type:        'array[mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelector.matchExpressions]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchExpressions is a list of label selector requirements. The requirements are ANDed.'
      },
      matchLabels: {
        type:        'map[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels map is equivalent to an element of matchExpressions, whose key field is "key", the operator is "In", and the values array contains only "value". The requirements are ANDed.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.match',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.match' },
    description:    'Match allows the user to limit which resources get mutated. Individual match criteria are AND-ed together. An undefined match criteria matches everything.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.matches',
    resourceFields: {
      excludedNamespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExcludedNamespaces is a list of namespace names. If defined, a constraint only applies to resources not in a listed namespace. ExcludedNamespaces also supports a prefix or suffix based glob.  For example, `excludedNamespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `excludedNamespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      kinds: {
        type:     'array[mutations.gatekeeper.sh.v1.assign.spec.match.kinds]',
        nullable: true,
        create:   true,
        update:   true
      },
      labelSelector: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec.match.labelSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'LabelSelector is the combination of two optional fields: `matchLabels` and `matchExpressions`.  These two fields provide different methods of selecting or excluding k8s objects based on the label keys and values included in object metadata.  All selection expressions from both sections are ANDed to determine if an object meets the cumulative requirements of the selector.'
      },
      name: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Name is the name of an object.  If defined, it will match against objects with the specified name.  Name also supports a prefix or suffix glob.  For example, `name: pod-*` would match both `pod-a` and `pod-b`, and `name: *-pod` would match both `a-pod` and `b-pod`.'
      },
      namespaceSelector: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec.match.namespaceSelector',
        nullable:    true,
        create:      true,
        update:      true,
        description: "NamespaceSelector is a label selector against an object's containing namespace or the object itself, if the object is a namespace."
      },
      namespaces: {
        type:        'array[string]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Namespaces is a list of namespace names. If defined, a constraint only applies to resources in a listed namespace.  Namespaces also supports a prefix or suffix based glob.  For example, `namespaces: [kube-*]` matches both `kube-system` and `kube-public`, and `namespaces: [*-system]` matches both `kube-system` and `gatekeeper-system`.'
      },
      scope: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Scope determines if cluster-scoped and/or namespaced-scoped resources are matched.  Accepts `*`, `Cluster`, or `Namespaced`. (defaults to `*`)'
      },
      source: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Source determines whether generated or original resources are matched. Accepts `Generated`|`Original`|`All` (defaults to `All`). A value of `Generated` will only match generated resources, while `Original` will only match regular resources.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.externalData',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.externalData' },
    description:    'ExternalData describes the external data provider to be used for mutation.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.externalDatas',
    resourceFields: {
      dataSource: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'DataSource specifies where to extract the data that will be sent to the external data provider as parameters.'
      },
      default: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Default specifies the default value to use when the external data provider returns an error and the failure policy is set to "UseDefault".'
      },
      failurePolicy: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'FailurePolicy specifies the policy to apply when the external data provider returns an error.'
      },
      provider: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Provider is the name of the external data provider.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.fromMetadata',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.fromMetadata' },
    description:    'FromMetadata assigns a value from the specified metadata field.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.fromMetadatas',
    resourceFields: {
      field: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Field specifies which metadata field provides the assigned value. Valid fields are `namespace` and `name`.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.parameters.assign' },
    description:    'Assign.value holds the value to be assigned',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.parameters.assigns',
    resourceFields: {
      externalData: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.externalData',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ExternalData describes the external data provider to be used for mutation.'
      },
      fromMetadata: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign.fromMetadata',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'FromMetadata assigns a value from the specified metadata field.'
      },
      value: {
        type:        'json',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Value is a constant value that will be assigned to `location`'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.parameters.pathTests',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.parameters.pathTests' },
    description:    'PathTest allows the user to customize how the mutation works if parent paths are missing. It traverses the list in order. All sub paths are tested against the provided condition, if the test fails, the mutation is not applied. All `subPath` entries must be a prefix of `location`. Any glob characters will take on the same value as was used to expand the matching glob in `location`. \n Available Tests: * MustExist    - the path must exist or do not mutate * MustNotExist - the path must not exist or do not mutate.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.parameters.pathTestses',
    resourceFields: {
      condition: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Condition describes whether the path either MustExist or MustNotExist in the original object'
      },
      subPath: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.parameters',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.parameters' },
    description:    'Parameters define the behavior of the mutator.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.parameterses',
    resourceFields: {
      assign: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec.parameters.assign',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Assign.value holds the value to be assigned'
      },
      pathTests: {
        type:     'array[mutations.gatekeeper.sh.v1.assign.spec.parameters.pathTests]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec.applyTo',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec.applyTo' },
    description:    'ApplyTo determines what GVKs items the mutation should apply to. Globs are not allowed.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.spec.applyTos',
    resourceFields: {
      groups: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      kinds: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      },
      versions: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.spec',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.spec' },
    description:    'AssignSpec defines the desired state of Assign.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.specs',
    resourceFields: {
      applyTo: {
        type:        'array[mutations.gatekeeper.sh.v1.assign.spec.applyTo]',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'ApplyTo lists the specific groups, versions and kinds a mutation will be applied to. This is necessary because every mutation implies part of an object schema and object schemas are associated with specific GVKs.'
      },
      location: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Location describes the path to be mutated, for example: `spec.containers[name: main]`.'
      },
      match: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec.match',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Match allows the user to limit which resources get mutated. Individual match criteria are AND-ed together. An undefined match criteria matches everything.'
      },
      parameters: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec.parameters',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Parameters define the behavior of the mutator.'
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.status.byPod.errors',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.status.byPod.errors' },
    description:    'MutatorError represents a single error caught while adding a mutator to a system.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.status.byPod.errorses',
    resourceFields: {
      _type: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Type indicates a specific class of error for use by controller code. If not present, the error should be treated as not matching any known type.'
      },
      message: {
        type:     'string',
        nullable: true,
        create:   true,
        required: true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.status.byPod',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.status.byPod' },
    description:    'MutatorPodStatusStatus defines the observed state of MutatorPodStatus.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.status.byPods',
    resourceFields: {
      _id: {
        type:     'string',
        nullable: true,
        create:   true,
        update:   true
      },
      enforced: {
        type:     'boolean',
        nullable: true,
        create:   true,
        update:   true
      },
      errors: {
        type:     'array[mutations.gatekeeper.sh.v1.assign.status.byPod.errors]',
        nullable: true,
        create:   true,
        update:   true
      },
      mutatorUID: {
        type:        'string',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'Storing the mutator UID allows us to detect drift, such as when a mutator has been recreated after its CRD was deleted out from under it, interrupting the watch'
      },
      observedGeneration: {
        type:     'integer',
        nullable: true,
        create:   true,
        update:   true
      },
      operations: {
        type:     'array[string]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:             'mutations.gatekeeper.sh.v1.assign.status',
    type:           'schema',
    links:          { self: 'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.v1.assign.status' },
    description:    'AssignStatus defines the observed state of Assign.',
    pluralName:     'mutations.gatekeeper.sh.v1.assign.statuses',
    resourceFields: {
      byPod: {
        type:     'array[mutations.gatekeeper.sh.v1.assign.status.byPod]',
        nullable: true,
        create:   true,
        update:   true
      }
    }
  },
  {
    id:    'mutations.gatekeeper.sh.assign',
    type:  'schema',
    links: {
      collection: 'https://209.97.184.234.sslip.io/v1/mutations.gatekeeper.sh.assign',
      self:       'https://209.97.184.234.sslip.io/v1/schemas/mutations.gatekeeper.sh.assign'
    },
    description:     'Assign is the Schema for the assign API.',
    pluralName:      'mutations.gatekeeper.sh.assign',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    resourceFields: {
      apiVersion: {
        type:   'string',
        create: false,
        update: false
      },
      kind: {
        type:   'string',
        create: false,
        update: false
      },
      metadata: {
        type:   'io.k8s.apimachinery.pkg.apis.meta.v1.ObjectMeta',
        create: true,
        update: true
      },
      spec: {
        type:        'mutations.gatekeeper.sh.v1.assign.spec',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignSpec defines the desired state of Assign.'
      },
      status: {
        type:        'mutations.gatekeeper.sh.v1.assign.status',
        nullable:    true,
        create:      true,
        update:      true,
        description: 'AssignStatus defines the observed state of Assign.'
      }
    },
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
          description: 'Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: http://kubernetes.io/docs/user-guide/identifiers#names',
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
  }
];
