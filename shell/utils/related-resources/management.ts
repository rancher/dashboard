import { HELM_RELEASE, OBJECTSET } from '@shell/config/labels-annotations';
import { CATALOG, SCHEMA, SECRET } from '@shell/config/types';
import { ResourceModel } from '@shell/core/types';
import { apiGroupOf, findIfExists } from '@shell/utils/related-resources';
import { schemaForReference, schemasByKind } from '@shell/utils/schema-references';

/**
 * What writes a resource, so that a change made to it in the editor can be overwritten
 *
 * Told from the resource's own metadata, so it needs no request
 */

/** An object named by `apiVersion`, `kind` and `name`, as in an ownerReference */
export type ObjectReference = {
  apiVersion: string,
  kind: string,
  name: string,

  /** Only where the reference names it. An ownerReference never does, as it is in the namespace of the resource */
  namespace?: string,
};

export type HelmRelease = { name: string, namespace: string };

/**
 * - `controller`: an ownerReference with `controller: true`. The controller writes the resource,
 *   so it is read-only where it is not the primary resource
 * - `rancher`: applied by a rancher controller for `owner`, from the `objectset.rio.cattle.io/owner-*` annotations
 * - `fleet`: deployed by the fleet agent, which installs a helm release and writes `objectset.rio.cattle.io/id`
 * - `helm`: installed by a helm release. `record` marks the Secret helm keeps the release in
 */
export type ResourceManagement =
  | { by: 'controller', owner: ObjectReference }
  | { by: 'rancher', owner: ObjectReference }
  | { by: 'fleet', release: HelmRelease }
  | { by: 'helm', release: HelmRelease, record?: boolean };

// helm keeps each revision of a release in a Secret named after it, labelled `owner: helm` and `name: <release>`
const HELM_RECORD_PREFIX = 'sh.helm.release.v1.';

/**
 * The ownerReference with `controller: true`, if any
 *
 * Kubernetes allows one controller per resource. An ownerReference without it only has the
 * resource deleted with its owner
 *
 * @param resource
 * @returns the ownerReference, or undefined
 */
export function controllerReferenceOf(resource: ResourceModel): ObjectReference | undefined {
  return (resource?.metadata?.ownerReferences || []).find((reference: any) => reference?.controller === true);
}

/**
 * What writes `resource`, or null where nothing is known to
 *
 * Checked in this order, the first match deciding
 * 1. a controller ownerReference. A controller copies its own labels and annotations to what it
 *    controls, for example a ReplicaSet carries its Deployment's helm annotations, so these come second
 * 2. `objectset.rio.cattle.io/owner-gvk`, written by a rancher controller's apply
 * 3. helm release annotations together with `objectset.rio.cattle.io/id`, written by the fleet agent
 * 4. helm release annotations alone
 * 5. the Secret helm keeps a release in
 *
 * `objectset.rio.cattle.io/id` without an owner or helm annotations is also written by import yaml,
 * which applies once, so it is not a match
 *
 * The `app.kubernetes.io/managed-by: Helm` label is not used: it comes from a chart's templates,
 * so a chart can leave it out, and pods copy it from their template
 *
 * @param resource
 * @returns the match, or null
 */
export function managementOf(resource: ResourceModel): ResourceManagement | null {
  const controller = controllerReferenceOf(resource);

  if (controller) {
    return { by: 'controller', owner: controller };
  }

  const annotations = resource?.metadata?.annotations || {};
  const ownerGvk: string | undefined = annotations[OBJECTSET.OWNER_GVK];

  if (ownerGvk) {
    // `group/version, Kind=Kind`, with an empty group for the core group, for example `/v1, Kind=Namespace`
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
 * The resource an `ObjectReference` names, or null where its type is unknown, it does not exist or
 * the user can not get it
 *
 * The type is found from the schemas in the store of `model`. A reference with no namespace is to a
 * resource in the namespace of `model`, where the type is namespaced
 *
 * @param model the resource holding the reference, to fetch through
 * @param reference
 * @returns the resource. Never rejects
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
 * The resource to link to from the banner describing `management`, or null
 *
 * - the controller, or the owner rancher applies the resource for
 * - the rancher App of a helm release, `catalog.cattle.io.app` `<namespace>/<name>`, which exists
 *   where the release was installed from rancher's apps
 * - nothing for fleet, as the resource names only the helm release
 *
 * @param resource the resource `management` describes, to fetch through
 * @param management
 * @returns the resource. Never rejects
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
