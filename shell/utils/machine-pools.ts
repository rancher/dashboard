import jsyaml from 'js-yaml';
import isEqual from 'lodash/isEqual';
import { normalizeName } from '@shell/utils/kube';
import { clone } from '@shell/utils/object';
import { saferDump } from '@shell/utils/create-yaml';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import { KIND as ELEMENTAL_KIND } from '@shell/config/elemental-types';
import { EditableRelatedResourceContext } from '@shell/core/types';
import { CAPI } from '@shell/config/types';

export const GOOGLE = 'google';

/**
 * The root vuex store, or anything dispatching to the root of it
 */
export interface MachinePoolStore {
  dispatch: (type: string, payload?: any, options?: any) => Promise<any>;
  getters: { [key: string]: any };
}

/**
 * One machine pool of a provisioning cluster, as saved
 *
 * The shape of the entries of `machinePools` in the rke2 cluster form
 */
export interface MachinePoolEntry {
  /** An entry of the cluster's `spec.rkeConfig.machinePools` */
  pool: any;

  /** The machine config model that `pool.machineConfigRef` references */
  config: any;

  /** The machine config does not exist yet */
  create?: boolean;

  /** The machine config exists */
  update?: boolean;

  [key: string]: any;
}

export interface SaveMachinePoolOptions {
  store: MachinePoolStore;

  /** `metadata.name` of the provisioning cluster */
  clusterName: string;

  /** The machine config as loaded, the base of the merge with the latest version from the server */
  initialConfig?: any;

  /** The provider picked in the cluster form, for example `google` */
  provider?: string;

  isElementalCluster?: boolean;
}

/**
 * Merge the changes made on the server since `initialConfig` was loaded into `config`
 *
 * `config` is mutated. Throws when the server and `config` changed the same field
 */
export async function syncMachineConfigWithLatest(config: any, initialConfig: any, store: MachinePoolStore): Promise<void> {
  if (!config?.id) {
    return;
  }

  // Use management/request instead of management/find to avoid overwriting the current machine pool in the store
  const _latestConfig = await store.dispatch('management/request', { url: `/v1/${ config.type }s/${ config.id }` });
  const latestConfig = await store.dispatch('management/create', _latestConfig);
  const initial = await store.dispatch('management/create', initialConfig || {});

  const conflict = await handleConflict(
    initial,
    config,
    latestConfig,
    {
      dispatch: store.dispatch,
      getters:  store.getters
    },
    'management'
  );

  // if there's conflicts, throw Error stops save process and surfaces error to user
  if (conflict) {
    throw Error(conflict as any);
  }
}

/**
 * Resolve the firewall rule prefixes of a google machine config
 *
 * `setInternalFirewallRulePrefix` and `setExternalFirewallRulePrefix` are checkboxes in the google
 * machine config form, not fields of the machine config, so they are removed
 */
function applyGoogleFirewallRulePrefixes(config: any, clusterName: string, prefix: string): void {
  if (!!config.setInternalFirewallRulePrefix) {
    config.internalFirewallRulePrefix = `${ clusterName }`;
  } else if (!!config.internalFirewallRulePrefix) {
    delete config.internalFirewallRulePrefix;
  }
  if (!!config.setExternalFirewallRulePrefix) {
    config.externalFirewallRulePrefix = prefix;
  } else if (!!config.externalFirewallRulePrefix) {
    delete config.externalFirewallRulePrefix;
  }
  // These have to be removed regardless of their value because they are not part of the object we are sending
  delete config.setInternalFirewallRulePrefix;
  delete config.setExternalFirewallRulePrefix;
}

/**
 * Save the machine config of one machine pool, and update the pool to match
 *
 * `entry` is mutated: `entry.config` becomes the saved machine config and `entry.pool` references
 * it. Saving the pool itself is left to the caller, as it is part of the provisioning cluster
 */
export async function saveMachinePool(entry: MachinePoolEntry, {
  store, clusterName, initialConfig, provider, isElementalCluster
}: SaveMachinePoolOptions): Promise<void> {
  await syncMachineConfigWithLatest(entry.config, initialConfig, store);

  // Capitals and such aren't allowed;
  entry.pool.name = normalizeName(entry.pool.name) || 'pool';
  const prefix = `${ clusterName }-${ entry.pool.name }`;

  const prefixFormatted = prefix.substr(0, 50).toLowerCase();

  // For Google, we need to set internal and external firewall prefixes if enabled,
  // but it is better to track it here since cluster and pool names are guaranteed to be set by now.
  // the checkboxes only exist on a machine config edited in the google machine config form
  // without them every firewall rule prefix is removed, so callers without that form omit `provider`
  if (provider === GOOGLE) {
    applyGoogleFirewallRulePrefixes(entry.config, clusterName, prefix);
  }

  if (entry.create) {
    if (!entry.config.metadata?.name) {
      entry.config.metadata.generateName = `nc-${ prefixFormatted }-`;
    }

    const neu = await entry.config.save();

    entry.config = neu;
    entry.pool.machineConfigRef.name = neu.metadata.name;
    entry.create = false;
    entry.update = true;
  } else if (entry.update) {
    entry.config = await entry.config.save();
  }

  // Ensure Elemental clusters have a hostname prefix
  if (isElementalCluster && !entry.pool.hostnamePrefix) {
    entry.pool.hostnamePrefix = `${ prefixFormatted }-`;
  }
}

/**
 * A `MachinePoolStore` for a resource model
 *
 * A model's `$dispatch` is scoped to the model's own store, so every dispatch is sent to the root
 */
export function machinePoolStoreFor(resource: any): MachinePoolStore {
  return {
    dispatch: (type, payload, opts) => resource.$dispatch(type, payload, { ...opts, root: true }),
    getters:  resource.$rootGetters,
  };
}

export function isElementalMachinePool(pool: any): boolean {
  return pool?.machineConfigRef?.kind === ELEMENTAL_KIND.MACHINE_INV_SELECTOR_TEMPLATES;
}

/**
 * Saves the machine config of `entry` and updates `entry.pool` to match, as `saveMachinePool` does
 */
export type SaveMachinePoolStep = (entry: MachinePoolEntry, clusterName: string) => Promise<void>;

/**
 * A machine pool for a new machine config, as the cluster form adds one
 *
 * The first pool of a cluster has every role, the others are workers
 */
function newMachinePool(pools: any[], config: any): any {
  const names = new Set(pools.map((p) => p.name));
  let idx = pools.length;
  let name;

  do {
    name = `pool${ ++idx }`;
  } while (names.has(name));

  const [group] = (config.apiVersion || '').split('/');

  return {
    name,
    etcdRole:             pools.length === 0,
    controlPlaneRole:     pools.length === 0,
    workerRole:           true,
    hostnamePrefix:       '',
    labels:               {},
    quantity:             1,
    unhealthyNodeTimeout: '0m',
    machineConfigRef:     {
      kind: config.kind,
      name: null,
      // a ref without an apiVersion is resolved in the rke-machine-config group
      ...(group && group !== CAPI.MACHINE_CONFIG_GROUP ? { apiVersion: config.apiVersion } : {}),
    },
    drainBeforeDelete: true,
  };
}

/**
 * Save a machine config edited in the multi-resource YAML editor
 *
 * `savePool` is run for the pool that references the machine config, then the pool references the
 * saved machine config. The pool is written to the cluster's YAML in `ctx.editorState`, not
 * saved, so it is saved with the cluster and shown as an unsaved change to it until then
 *
 * A new machine config (`ctx.isNew`) that no pool references yet is given a new pool
 *
 * @param ctx The context of the machine config's editable related resource
 * @param store
 * @param savePool `saveMachinePool`, or a replacement for a provider whose machine configs are saved differently
 * @returns The saved machine config
 */
export async function saveMachineConfigYaml(ctx: EditableRelatedResourceContext, store: MachinePoolStore, savePool: SaveMachinePoolStep): Promise<any> {
  const {
    resource, primaryResource, editorState, nodeId, primaryNodeId, initialYaml, isNew
  } = ctx;

  const config = await store.dispatch('management/create', jsyaml.load(editorState.yaml[nodeId] ?? initialYaml[nodeId]));
  const cluster: any = jsyaml.load(editorState.yaml[primaryNodeId] ?? initialYaml[primaryNodeId]) || {};
  const pools: any[] = cluster.spec?.rkeConfig?.machinePools || [];

  // the edited machine config yaml can change the name, so match on the name it was loaded with
  const name = resource.metadata?.name;
  const existingPool = name ? pools.find((p: any) => p.machineConfigRef?.name === name) : undefined;
  const pool = existingPool || (isNew ? newMachinePool(pools, config) : undefined);

  if (!pool) {
    throw new Error(store.getters['i18n/t']('resourceYaml.errors.machinePoolNotFound', { name }));
  }

  if (!existingPool) {
    cluster.spec = cluster.spec || {};
    cluster.spec.rkeConfig = cluster.spec.rkeConfig || {};
    cluster.spec.rkeConfig.machinePools = [...pools, pool];
  }

  const poolBefore = existingPool ? clone(existingPool) : undefined;
  const entry: MachinePoolEntry = {
    pool, config, create: !!isNew, update: !isNew
  };

  await savePool(entry, cluster.metadata?.name || primaryResource?.metadata?.name);

  pool.machineConfigRef.name = entry.config.metadata.name;

  // the dump of parsed yaml drops the user's comments, so the cluster yaml is only replaced when the pool changed
  if (!isEqual(poolBefore, pool)) {
    editorState.yaml[primaryNodeId] = saferDump(cluster);
  }

  return entry.config;
}
