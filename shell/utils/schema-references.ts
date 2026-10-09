import { apiGroupOf } from '@shell/utils/related-resources';
import { parseType } from '@shell/models/schema';

/**
 * Find the resources a resource refers to, from the definitions of its type
 *
 * Steve describes each type with a tree of definitions (`/v1/schemaDefinitions/<type>`), one for
 * each object in the type. How a definition is named decides how a reference is recognised:
 *
 * - A built-in kubernetes type names each definition after its go type, for example
 *   `io.k8s.api.core.v1.SecretKeySelector`. A reference is recognised by that name, from the tables
 *   below
 * - A custom resource names each definition after its path, for example
 *   `io.x-k8s.cluster.v1beta2.Machine.spec.infrastructureRef`. That name does not say what the object
 *   is, so a reference is recognised by the fields its definition declares instead: a definition
 *   declaring both `kind` and `name` is taken to be a reference, see `readerFor`
 *
 * Definitions of custom resources taken to be references, and the fields they declare:
 * - cluster api `Machine.spec.infrastructureRef`: `apiGroup`, `kind`, `name`
 * - gateway api `HTTPRoute.spec.rules.backendRefs`: `group`, `kind`, `name`, `namespace`, `port`
 * - provisioning `Cluster.spec.rkeConfig.machinePools.machineConfigRef`: `apiVersion`, `kind`, `name`
 *
 * The group is read from whichever of `apiGroup`, `group` or `apiVersion` the definition declares,
 * see `groupOfShape`. An object whose definition declares no `kind`, such as cluster api
 * `spec.topology.classRef`, is not found
 *
 * A definition declaring `kind` and `name` that is not a reference costs one lookup at most: the
 * kind has to match a type the user can get, and the resource has to exist
 *
 * A reference needs a `kind` and a `name`. The group and kind together give the steve type. A
 * reference with no group is matched on `kind` alone, see `schemaForReference`. A reference with no
 * namespace is to a resource in the namespace of the resource referring to it
 */

/**
 * One resource referred to by a field of another
 */
export type SchemaReference = {
  /** Where the reference is in the resource, for example `.spec.scaleTargetRef` */
  path: string,

  kind: string,

  /**
   * The api group of `kind`, empty for the core group
   *
   * Undefined where the reference does not say, so the type has to be found from `kind` alone
   */
  group?: string,

  name: string,

  /** Undefined where the reference does not say, so it is the namespace of the resource referring to it */
  namespace?: string,

  /**
   * The resource referred to uses the one referring to it, rather than the other way round. See
   * `BACK_REFERENCE_FIELDS`
   */
  dependent?: boolean,
};

type ResourceField = { type: string, subtype?: string };

type Definition = { type?: string, resourceFields?: { [field: string]: ResourceField } };

type ReferenceTarget = Omit<SchemaReference, 'path' | 'dependent'>;

/**
 * Reads a reference from the value of its field
 *
 * `field` is the name of the field holding the value, for references whose kind depends on it
 */
type ReferenceReader = (value: any, field: string) => ReferenceTarget | null;

const CORE = 'io.k8s.api.core.v1.';

/**
 * The group of an `apiVersion`, undefined where there is none
 */
const groupOfApiVersion = (apiVersion?: string): string | undefined => (apiVersion ? apiGroupOf(apiVersion) : undefined);

/**
 * A reader for a value naming its kind, with its group in `apiVersion`
 *
 * An unset `apiVersion` leaves the group unknown, so the type is found from `kind` alone
 */
const withApiVersion = (namespaced = false): ReferenceReader => (v) => ({
  kind: v?.kind, group: groupOfApiVersion(v?.apiVersion), name: v?.name, ...(namespaced ? { namespace: v?.namespace } : {})
});

/**
 * A reader for a value naming its kind, with its group in `apiGroup`
 *
 * An unset `apiGroup` is the core group
 */
const withApiGroup = (namespaced = false): ReferenceReader => (v) => ({
  kind: v?.kind, group: v?.apiGroup || '', name: v?.name, ...(namespaced ? { namespace: v?.namespace } : {})
});

/**
 * A reader for a value that does not name its kind, as its definition refers to one core kind only
 */
const withKind = (kind: string, nameField = 'name', namespaceField?: string): ReferenceReader => (value) => ({
  kind,
  group:     '',
  name:      value?.[nameField],
  namespace: namespaceField ? value?.[namespaceField] : undefined,
});

/**
 * Built-in definitions that are references, by definition name
 */
const REFERENCE_DEFINITIONS: { [definition: string]: ReferenceReader } = {
  [`${ CORE }ObjectReference`]:                            withApiVersion(true),
  'io.k8s.api.autoscaling.v1.CrossVersionObjectReference': withApiVersion(),
  'io.k8s.api.autoscaling.v2.CrossVersionObjectReference': withApiVersion(),
  [`${ CORE }TypedLocalObjectReference`]:                  withApiGroup(),
  [`${ CORE }TypedObjectReference`]:                       withApiGroup(true),
  'io.k8s.api.rbac.v1.RoleRef':                            withApiGroup(),
  'io.k8s.api.rbac.v1.Subject':                            withApiGroup(true),

  [`${ CORE }SecretReference`]:                                          withKind('Secret', 'name', 'namespace'),
  [`${ CORE }SecretKeySelector`]:                                        withKind('Secret'),
  [`${ CORE }SecretEnvSource`]:                                          withKind('Secret'),
  [`${ CORE }SecretProjection`]:                                         withKind('Secret'),
  [`${ CORE }SecretVolumeSource`]:                                       withKind('Secret', 'secretName'),
  [`${ CORE }ConfigMapKeySelector`]:                                     withKind('ConfigMap'),
  [`${ CORE }ConfigMapEnvSource`]:                                       withKind('ConfigMap'),
  [`${ CORE }ConfigMapProjection`]:                                      withKind('ConfigMap'),
  [`${ CORE }ConfigMapVolumeSource`]:                                    withKind('ConfigMap'),
  [`${ CORE }PersistentVolumeClaimVolumeSource`]:                        withKind('PersistentVolumeClaim', 'claimName'),
  'io.k8s.api.networking.v1.IngressServiceBackend':                      withKind('Service'),
  'io.k8s.api.admissionregistration.v1.ServiceReference':                withKind('Service', 'name', 'namespace'),
  'io.k8s.kube-aggregator.pkg.apis.apiregistration.v1.ServiceReference': withKind('Service', 'name', 'namespace'),

  // schema definition says this field is an object reference but it doesn't have a 'kind' set
  // if the field has 'secret' in the name, assume the kind is secret
  // otherwise ignore the field
  [`${ CORE }LocalObjectReference`]: (v, field) => (/secret/i.test(field) ? withKind('Secret')(v, field) : null),
};

/**
 * Built-in string fields holding the name of a resource, by `<definition>.<field>`
 */
const NAME_FIELDS: { [field: string]: { kind: string, group: string } } = {
  [`${ CORE }PodSpec.serviceAccountName`]:                          { kind: 'ServiceAccount', group: '' },
  // deprecated alias of `serviceAccountName`
  [`${ CORE }PodSpec.serviceAccount`]:                              { kind: 'ServiceAccount', group: '' },
  [`${ CORE }PersistentVolumeClaimSpec.storageClassName`]:          { kind: 'StorageClass', group: 'storage.k8s.io' },
  [`${ CORE }PersistentVolumeClaimSpec.volumeAttributesClassName`]: { kind: 'VolumeAttributesClass', group: 'storage.k8s.io' },
  [`${ CORE }PersistentVolumeClaimSpec.volumeName`]:                { kind: 'PersistentVolume', group: '' },
  [`${ CORE }PersistentVolumeSpec.storageClassName`]:               { kind: 'StorageClass', group: 'storage.k8s.io' },
  [`${ CORE }PersistentVolumeSpec.volumeAttributesClassName`]:      { kind: 'VolumeAttributesClass', group: 'storage.k8s.io' },
  [`${ CORE }CSIPersistentVolumeSource.driver`]:                    { kind: 'CSIDriver', group: 'storage.k8s.io' },
  'io.k8s.api.networking.v1.IngressSpec.ingressClassName':          { kind: 'IngressClass', group: 'networking.k8s.io' },
  'io.k8s.api.networking.v1.IngressTLS.secretName':                 { kind: 'Secret', group: '' },
};

/**
 * Fields referring to a resource that uses the one holding the reference, by `<definition>.<field>`
 *
 * A PersistentVolume names the claim bound to it, and the claim is what uses the volume
 */
const BACK_REFERENCE_FIELDS = new Set([
  `${ CORE }PersistentVolumeSpec.claimRef`,
]);

/**
 * Fields not searched for references, by `<definition>.<field>`
 *
 * These are templates of claims a controller creates. The claims are resources of their own, and
 * refer to the same resources
 */
const SKIPPED_FIELDS = new Set([
  'io.k8s.api.apps.v1.StatefulSetSpec.volumeClaimTemplates',
  `${ CORE }EphemeralVolumeSource.volumeClaimTemplate`,
]);

/**
 * Fields of the resource itself not searched for references
 */
const SKIPPED_ROOT_FIELDS = new Set(['metadata', 'status']);

/**
 * The group of a reference in a custom resource, from whichever field it is named in
 *
 * An empty or missing `group` is the core group, as in the gateway api. A missing `apiVersion`
 * leaves the group unknown, as in the machine config reference of a provisioning cluster
 */
function groupOfShape(fields: { [field: string]: ResourceField }, value: any): string | undefined {
  if (fields.apiGroup) {
    return value?.apiGroup || '';
  }

  if (fields.group) {
    return value?.group || '';
  }

  if (fields.apiVersion) {
    return groupOfApiVersion(value?.apiVersion);
  }

  return undefined;
}

/**
 * The reader for a definition, if it is a reference
 */
function readerFor(definitionName: string, definition: Definition): ReferenceReader | null {
  if (REFERENCE_DEFINITIONS[definitionName]) {
    return REFERENCE_DEFINITIONS[definitionName];
  }

  // built-in definitions are named after their go type, so the table above is used for them
  // the shape test below is for custom resources, whose definitions are named after their path
  // gateway api definitions are named `io.k8s.networking.gateway.*`, so these prefixes must not be widened to `io.k8s.`
  if (definitionName.startsWith('io.k8s.api.') || definitionName.startsWith('io.k8s.apimachinery.')) {
    return null;
  }

  const fields = definition.resourceFields || {};

  if (!fields.kind || !fields.name) {
    return null;
  }

  return (v) => ({
    kind:      v?.kind,
    group:     groupOfShape(fields, v),
    name:      v?.name,
    namespace: fields.namespace ? v?.namespace : undefined,
  });
}

/**
 * The resources `resource` refers to, found from the definitions of its type
 *
 * The schema's definitions must have been fetched first, see `fetchResourceFields`. A schema with
 * `resourceFields` of its own, rather than definitions, finds the types of its fields with
 * `schemaFor`
 *
 * A reference with no kind or name is left out
 *
 * @param schema the steve schema of `resource`
 * @param resource the resource to search
 * @param schemaFor finds the schema of a type, for a schema without definitions
 */
export function schemaReferencesIn(schema: any, resource: any, schemaFor: (type: string) => any): SchemaReference[] {
  const definitions: { [name: string]: Definition } | null = schema?.requiresResourceFields ? schema.schemaDefinitions || {} : null;
  const root: Definition | null = definitions ? schema.schemaDefinition : schema;

  if (!root?.resourceFields || !resource) {
    return [];
  }

  const definitionFor = (name: string): Definition | undefined => (definitions ? definitions[name] : schemaFor(name));
  const references: SchemaReference[] = [];

  const add = (reference: Omit<SchemaReference, 'dependent'>, dependent: boolean) => {
    references.push({ ...reference, ...(dependent ? { dependent } : {}) });
  };

  /**
   * Search `value`, an object of the definition `definitionName`, and the objects inside it
   *
   * `field` is the name of the field holding `value`. `dependent` is set when that field is in `BACK_REFERENCE_FIELDS`
   */
  const visit = (value: any, definitionName: string, definition: Definition, {
    path, field = '', dependent = false, isRoot = false
  }: { path: string, field?: string, dependent?: boolean, isRoot?: boolean }) => {
    if (!value || typeof value !== 'object') {
      return;
    }

    const target = isRoot ? null : readerFor(definitionName, definition)?.(value, field);

    if (target?.kind && target?.name) {
      add({ ...target, path }, dependent);
    }

    // a reference can hold others, so the search continues inside it
    // e.g. gateway api `backendRefs[].filters[].requestMirror.backendRef`
    for (const [childField, resourceField] of Object.entries(definition.resourceFields || {})) {
      const key = `${ definitionName }.${ childField }`;
      const childValue = value[childField];

      if ((isRoot && SKIPPED_ROOT_FIELDS.has(childField)) || SKIPPED_FIELDS.has(key) || childValue === null || childValue === undefined) {
        continue;
      }

      const childPath = `${ path }.${ childField }`;
      const childDependent = BACK_REFERENCE_FIELDS.has(key);

      if (NAME_FIELDS[key] && typeof childValue === 'string' && childValue) {
        add({
          ...NAME_FIELDS[key], name: childValue, path: childPath
        }, childDependent);
      }

      const [type, subtype] = parseType(resourceField.type, resourceField);
      const isCollection = (type === 'array' || type === 'map') && !!subtype;
      const childDefinitionName = isCollection ? subtype : type;
      const childDefinition = definitionFor(childDefinitionName);

      if (!childDefinition) {
        continue;
      }

      // each item of an array or map is searched with a path of its own
      const items: [string, any][] = isCollection ? Object.entries(childValue).map(([index, item]) => [type === 'array' ? `${ childPath }[${ index }]` : `${ childPath }.${ index }`, item]) : [[childPath, childValue]];

      items.forEach(([itemPath, item]) => visit(item, childDefinitionName, childDefinition, {
        path: itemPath, field: childField, dependent: childDependent
      }));
    }
  };

  // the `type` of a definition is its own name, e.g. `io.k8s.api.apps.v1.Deployment`
  // a schema with `resourceFields` of its own has no definition name, so its id is used
  visit(resource, definitions ? root.type || '' : schema.id, root, { path: '', isRoot: true });

  return references;
}

/**
 * The schema of the type a reference refers to, or null where there is none or it can not be told
 * apart from others
 *
 * A reference with no group is matched on `kind` alone, which has to belong to one type only
 *
 * @param schemasByKind every schema in the store of the resource referring to it, by `attributes.kind`
 * @param reference
 */
export function schemaForReference(schemasByKind: Map<string, any[]>, { kind, group }: Pick<SchemaReference, 'kind' | 'group'>): any | null {
  const ofKind = schemasByKind.get(kind) || [];

  if (group === undefined) {
    return ofKind.length === 1 ? ofKind[0] : null;
  }

  return ofKind.find((schema) => (schema.attributes?.group || '') === group) || null;
}

/**
 * Schemas by `attributes.kind`, to find the type of a reference with `schemaForReference`
 *
 * @param schemas
 */
export function schemasByKind(schemas: any[]): Map<string, any[]> {
  const out = new Map<string, any[]>();

  (schemas || []).forEach((schema) => {
    const kind = schema?.attributes?.kind;

    if (kind) {
      out.set(kind, [...out.get(kind) || [], schema]);
    }
  });

  return out;
}
