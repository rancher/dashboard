import { HELM_RELEASE, OBJECTSET } from '@shell/config/labels-annotations';
import { CATALOG, SCHEMA, SECRET } from '@shell/config/types';
import { ResourceModel } from '@shell/core/types';
import { apiGroupOf, findIfExists } from '@shell/utils/related-resources';
import { schemaForReference, schemasByKind } from '@shell/utils/schema-references';

export type ObjectReference = {
  apiVersion: string,
  kind: string,
  name: string,
  // namespace is absent if in the same namespace as the parent resource
  namespace?: string,
};

export type HelmRelease = { name: string, namespace: string };

export type ResourceManagement =
  | { by: 'controller', owner: ObjectReference }
  | { by: 'rancher', owner: ObjectReference }
  | { by: 'fleet', release: HelmRelease }
  | { by: 'helm', release: HelmRelease, record?: boolean };

// helm stores each release revision in a Secret with this prefix, labelled `owner: helm` and `name: <release>`
const HELM_RECORD_PREFIX = 'sh.helm.release.v1.';

/**
 * The ownerReference with `controller: true`, if any. Kubernetes allows at most one
 */
export function controllerReferenceOf(resource: ResourceModel): ObjectReference | undefined {
  return (resource?.metadata?.ownerReferences || []).find((reference: any) => reference?.controller === true);
}

/**
 * What writes `resource`, determined from metadata with this priority:
 * 1. controller ownerReference. checked first: controllers copy their labels and annotations to what they control
 * 2. `objectset.rio.cattle.io/owner-gvk`
 * 3. helm release annotations with `objectset.rio.cattle.io/id`: fleet
 * 4. helm release annotations
 * 5. helm release Secret
 *
 * `objectset.rio.cattle.io/id` alone is not a match: import yaml also writes it
 * `app.kubernetes.io/managed-by: Helm` is not used: charts may omit it
 *
 * @param options.ignoreController for a controller that does not overwrite edits, e.g. a provisioning cluster's machine configs
 * @returns the match, or null
 */
export function managementOf(resource: ResourceModel, { ignoreController = false } = {}): ResourceManagement | null {
  const controller = ignoreController ? undefined : controllerReferenceOf(resource);

  if (controller) {
    return { by: 'controller', owner: controller };
  }

  const annotations = resource?.metadata?.annotations || {};
  const ownerGvk: string | undefined = annotations[OBJECTSET.OWNER_GVK];

  if (ownerGvk) {
    // `group/version, Kind=Kind`; the core group is empty, e.g. `/v1, Kind=Namespace`
    const [groupVersion, kind = ''] = ownerGvk.split(', Kind=');

    return {
      by:    'rancher',
      owner: {
        apiVersion: groupVersion.replace(/^\//, ''),
        kind,
        name:       annotations[OBJECTSET.OWNER_NAME] || '',
        ...(annotations[OBJECTSET.OWNER_NAMESPACE] ? { namespace: annotations[OBJECTSET.OWNER_NAMESPACE] } : {}),
      },
    };
  }

  const releaseName: string | undefined = annotations[HELM_RELEASE.NAME];

  if (releaseName) {
    const release = { name: releaseName, namespace: annotations[HELM_RELEASE.NAMESPACE] || resource.metadata?.namespace || '' };

    return annotations[OBJECTSET.ID] ? { by: 'fleet', release } : { by: 'helm', release };
  }

  const labels = resource?.metadata?.labels || {};

  if (resource?.type === SECRET && resource.metadata?.name?.startsWith(HELM_RECORD_PREFIX) && labels.owner === 'helm' && labels.name) {
    return {
      by: 'helm', release: { name: labels.name, namespace: resource.metadata.namespace || '' }, record: true
    };
  }

  return null;
}

/**
 * The resource `reference` names, or null if its type is unknown, it is missing or forbidden
 *
 * The type comes from the schemas in `model`'s store. A reference with no namespace uses `model`'s
 *
 * @param model the resource holding the reference
 * @returns never rejects
 */
export async function findReferenced(model: ResourceModel, reference: ObjectReference): Promise<ResourceModel | null> {
  const schema = schemaForReference(schemasByKind(model.$getters['all'](SCHEMA)), { kind: reference.kind, group: apiGroupOf(reference.apiVersion) });

  if (!schema || !reference.name) {
    return null;
  }

  const namespace = reference.namespace || model.metadata?.namespace;

  if (schema.attributes?.namespaced && !namespace) {
    return null;
  }

  return findIfExists(model, schema.id, schema.attributes?.namespaced ? `${ namespace }/${ reference.name }` : reference.name);
}

/**
 * The resource the management banner links to, or null
 * - controller / rancher: the owner
 * - helm: the rancher App `<namespace>/<name>`, present only for releases installed from rancher apps
 * - fleet: none, only the helm release is named
 *
 * @returns never rejects
 */
export async function findManager(resource: ResourceModel, management: ResourceManagement): Promise<ResourceModel | null> {
  switch (management.by) {
  case 'controller':
  case 'rancher':
    return findReferenced(resource, management.owner);
  case 'helm':
    return findIfExists(resource, CATALOG.APP, `${ management.release.namespace }/${ management.release.name }`);
  default:
    return null;
  }
}
