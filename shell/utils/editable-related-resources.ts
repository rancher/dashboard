import {
  CONFIG_MAP, PVC, SECRET, SERVICE_ACCOUNT, WORKLOAD_TYPES
} from '@shell/config/types';
import {
  EditableRelatedResource, EditableRelatedResourceCompute, EditableRelatedResourceBanner, EditableRelatedResourcesFetchOptions, EditableResource
} from '@shell/core/types';
import { clone } from '@shell/utils/object';
import { convert, matches } from '@shell/utils/selector';

/**
 * Helpers for models gathering their editable related resources
 *
 * The functions fetching resources take a model to fetch through: any model in the store the
 * related resources are in, usually the one gathering them
 */

/** What the primary resource of the multi-resource YAML editor is asked for */
export const ALL_RELATED_RESOURCES: EditableRelatedResourcesFetchOptions = { dependencies: true, dependents: true };

type LabelSelector = { matchLabels?: { [key: string]: string }, matchExpressions?: any[] };

/**
 * An editable related resource shown under the heading of its type
 *
 * `group` is the one the steve model gives the resources it owns, so the two share a heading
 */
export function relatedEntry(
  resource: EditableResource,
  { dependent = false, banner }: { dependent?: boolean, banner?: EditableRelatedResourceCompute<EditableRelatedResourceBanner | null | undefined> } = {}
): EditableRelatedResource {
  return {
    resource,
    group: resource.typeDisplay,
    ...(dependent ? { dependent } : {}),
    ...(banner ? { banner } : {}),
  };
}

/**
 * The resource, or null where it does not exist or the user can not fetch the type
 *
 * A spec can name a resource that does not exist, for example an optional ConfigMap, so a 404 is not
 * reported
 */
export async function findIfExists(model: EditableResource, type: string, id: string): Promise<EditableResource | null> {
  if (!type || !id || !model.$getters['schemaFor'](type)) {
    return null;
  }

  return model.$getters['byId'](type, id) || model.$dispatch('find', { type, id }).catch((e: any) => {
    if (e?._status !== 404) {
      console.warn(`Failed to fetch ${ type } ${ id }`, e); // eslint-disable-line no-console
    }

    return null;
  });
}

/**
 * Every resource of `type`, in `namespace` when one is given, or none where the user can not list
 * the type
 */
export async function findAllOf(model: EditableResource, type: string, namespace?: string): Promise<EditableResource[]> {
  if (!model.$getters['schemaFor'](type)) {
    return [];
  }

  try {
    const all = await model.$dispatch('findAll', { type, opt: namespace ? { namespaced: namespace } : {} });

    return (all || []).filter((resource: EditableResource) => !namespace || resource.metadata?.namespace === namespace);
  } catch (e) {
    console.warn(`Failed to fetch ${ type }${ namespace ? ` in namespace ${ namespace }` : '' }`, e); // eslint-disable-line no-console

    return [];
  }
}

/**
 * The workloads in `namespace` that no other workload owns
 *
 * A ReplicaSet owned by a Deployment, or a Job owned by a CronJob, shares its pod template, so only
 * the owner is returned
 */
export async function workloadsInNamespace(model: EditableResource, namespace: string): Promise<EditableResource[]> {
  const byType = await Promise.all(Object.values(WORKLOAD_TYPES).map((type) => findAllOf(model, type, namespace)));

  return byType.flat().filter((workload) => !workload.ownedByWorkload);
}

/**
 * The api group of an `apiVersion`, empty for the core group
 */
export function apiGroupOf(apiVersion = ''): string {
  return apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
}

/**
 * The steve type of a resource named by api group and kind, as in a `scaleTargetRef`
 */
export function typeForKind(apiGroup: string | undefined, kind: string | undefined): string {
  if (!kind) {
    return '';
  }

  return apiGroup ? `${ apiGroup }.${ kind.toLowerCase() }` : kind.toLowerCase();
}

/**
 * Does a kube label selector select a resource with `labels`?
 *
 * An empty selector selects nothing here. Kubernetes treats it as every pod in the namespace, which
 * is not specific to any one workload
 */
export function selectsLabels(labelSelector: LabelSelector | undefined, labels: { [key: string]: string } = {}): boolean {
  const matchLabels = labelSelector?.matchLabels || {};
  const matchExpressions = labelSelector?.matchExpressions || [];

  if (!Object.keys(matchLabels).length && !matchExpressions.length) {
    return false;
  }

  // `convert` adds to the array it is given, which would change the resource
  return matches({ metadata: { labels } }, convert(matchLabels, clone(matchExpressions)));
}

/**
 * The names of the resources a pod spec refers to, by type
 *
 * See https://kubernetes.io/docs/concepts/storage/volumes/ for the volume references. `fromEnv` holds
 * the ConfigMaps and Secrets read into environment variables, which a running container does not
 * see change
 */
export function podSpecReferences(podSpec: any = {}): { names: { [type: string]: Set<string> }, fromEnv: { [type: string]: Set<string> } } {
  const names: { [type: string]: Set<string> } = {
    [CONFIG_MAP]:      new Set(),
    [SECRET]:          new Set(),
    [PVC]:             new Set(),
    [SERVICE_ACCOUNT]: new Set(),
  };
  const fromEnv: { [type: string]: Set<string> } = { [CONFIG_MAP]: new Set(), [SECRET]: new Set() };

  const add = (type: string, name: string | undefined, isEnv = false) => {
    if (name) {
      names[type].add(name);

      if (isEnv) {
        fromEnv[type].add(name);
      }
    }
  };

  (podSpec?.volumes || []).forEach((volume: any) => {
    add(CONFIG_MAP, volume?.configMap?.name);
    add(SECRET, volume?.secret?.secretName);
    add(SECRET, volume?.csi?.nodePublishSecretRef?.name);
    add(PVC, volume?.persistentVolumeClaim?.claimName);

    (volume?.projected?.sources || []).forEach((source: any) => {
      add(CONFIG_MAP, source?.configMap?.name);
      add(SECRET, source?.secret?.name);
    });
  });

  [...podSpec?.initContainers || [], ...podSpec?.containers || []].forEach((container: any) => {
    (container?.env || []).forEach((env: any) => {
      add(CONFIG_MAP, env?.valueFrom?.configMapKeyRef?.name, true);
      add(SECRET, env?.valueFrom?.secretKeyRef?.name, true);
    });

    (container?.envFrom || []).forEach((source: any) => {
      add(CONFIG_MAP, source?.configMapRef?.name, true);
      add(SECRET, source?.secretRef?.name, true);
    });
  });

  (podSpec?.imagePullSecrets || []).forEach((ref: any) => add(SECRET, ref?.name));

  // `serviceAccount` is the deprecated alias of `serviceAccountName`
  // a pod that names neither runs as the namespace's `default` service account, which is not added
  add(SERVICE_ACCOUNT, podSpec?.serviceAccountName || podSpec?.serviceAccount);

  return { names, fromEnv };
}

/**
 * Was the claim created by the StatefulSet `setName` from its volume claim template `templateName`?
 *
 * The StatefulSet controller names these `<template>-<statefulset>-<ordinal>`. The ordinal is not
 * limited to the current replicas, as a claim is kept when its replica is scaled down
 */
export function isClaimFromTemplate(claimName: string | undefined, templateName: string | undefined, setName: string | undefined): boolean {
  if (!claimName || !templateName || !setName) {
    return false;
  }

  const prefix = `${ templateName }-${ setName }-`;

  return claimName.startsWith(prefix) && /^\d+$/.test(claimName.slice(prefix.length));
}

/**
 * The backends of an Ingress: its default backend and the backend of each path
 */
export function ingressBackends(ingress: EditableResource): any[] {
  const pathBackends = (ingress.spec?.rules || []).flatMap((rule: any) => (rule?.http?.paths || []).map((path: any) => path?.backend));

  return [ingress.spec?.defaultBackend, ...pathBackends].filter(Boolean);
}

/**
 * The names of the Services an Ingress routes to
 */
export function ingressServiceNames(ingress: EditableResource): string[] {
  return ingressBackends(ingress).map((backend) => backend?.service?.name).filter(Boolean);
}
