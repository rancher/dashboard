import { ref, computed } from 'vue';
import { useStore, Store } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { removeObject } from '@shell/utils/array';
import { handleConflict } from '@shell/plugins/dashboard-store/normalize';
import merge from 'lodash/merge';

/**
 * Classes to be adopted by the node badges in Machine pools
 */
const NODE_TOTAL = {
  error: {
    color: 'bg-error',
    icon:  'icon-x',
  },
  warning: {
    color: 'bg-warning',
    icon:  'icon-warning',
  },
  success: {
    color: 'bg-success',
    icon:  'icon-checkmark'
  }
};

/**
 * Owns the machine pool list and its per-pool validation state, and derives the
 * presentation-level bits (node role totals/badges, ipv6/dual-stack detection) from them.
 *
 * Deliberately does NOT own machine pool creation/save/cleanup (initMachinePools, addMachinePool,
 * saveMachinePools, cleanupMachinePools, validateMachinePool) - those are wired into the consuming
 * component's save-hook lifecycle (registerBeforeHook/registerAfterHook) and the extension-provider
 * mechanism, both of which need `this` on the component instance.
 */
export function useMachinePools() {
  const store = useStore();
  const { t } = useI18n(store);

  const machinePools = ref<any[] | null>(null);
  const machinePoolValidation = ref<Record<string, boolean>>({}); // map of validation states for each machine pool

  const unremovedMachinePools = computed(() => (machinePools.value || []).filter((x) => !x.remove));

  const hasOnlyIpv6Pools = computed(() => !(machinePools.value || []).find((p) => !p.isIpv6 || p.isDualStack));
  const hasDualStackPools = computed(() => !!(machinePools.value || []).find((p) => p.isDualStack));

  const nodeTotals = computed(() => {
    const roles = ['etcd', 'controlPlane', 'worker'];
    const counts: Record<string, number> = {};
    const out: Record<string, Record<string, any>> = {
      color:   {},
      label:   {},
      icon:    {},
      tooltip: {},
    };

    for (const role of roles) {
      counts[role] = 0;
      out.color[role] = NODE_TOTAL.success.color;
      out.icon[role] = NODE_TOTAL.success.icon;
    }

    for (const row of machinePools.value || []) {
      if (row.remove) {
        continue;
      }

      const qty = parseInt(row.pool.quantity, 10);

      if (isNaN(qty)) {
        continue;
      }

      for (const role of roles) {
        counts[role] = counts[role] + (row.pool[`${ role }Role`] ? qty : 0);
      }
    }

    for (const role of roles) {
      out.label[role] = t(`cluster.machinePool.nodeTotals.label.${ role }`, { count: counts[role] });
      out.tooltip[role] = t(`cluster.machinePool.nodeTotals.tooltip.${ role }`, { count: counts[role] });
    }

    if (counts.etcd <= 0) {
      out.color.etcd = NODE_TOTAL.error.color;
      out.icon.etcd = NODE_TOTAL.error.icon;
    } else if (counts.etcd === 1 || counts.etcd % 2 === 0 || counts.etcd > 7) {
      out.color.etcd = NODE_TOTAL.warning.color;
      out.icon.etcd = NODE_TOTAL.warning.icon;
    }

    if (counts.controlPlane <= 0) {
      out.color.controlPlane = NODE_TOTAL.error.color;
      out.icon.controlPlane = NODE_TOTAL.error.icon;
    } else if (counts.controlPlane === 1) {
      out.color.controlPlane = NODE_TOTAL.warning.color;
      out.icon.controlPlane = NODE_TOTAL.warning.icon;
    }

    if (counts.worker <= 0) {
      out.color.worker = NODE_TOTAL.error.color;
      out.icon.worker = NODE_TOTAL.error.icon;
    } else if (counts.worker === 1) {
      out.color.worker = NODE_TOTAL.warning.color;
      out.icon.worker = NODE_TOTAL.warning.icon;
    }

    return out;
  });

  /**
   * Ensure that all the existing node roles pool are at least 1 each
   */
  function hasRequiredNodes() {
    return nodeTotals.value?.color && Object.values(nodeTotals.value.color).every((color) => color !== NODE_TOTAL.error.color);
  }

  function removeMachinePool(idx: number) {
    const entry = (machinePools.value as any[])[idx];

    if (!entry) {
      return;
    }

    if (entry.create) {
      // If this is a new pool that isn't saved yet, it can just be dropped
      removeObject(machinePools.value as any[], entry);
    } else {
      // Mark for removal on save
      entry.remove = true;
    }
  }

  /**
   * Track Machine Pool validation status
   */
  function machinePoolValidationChanged(id: string, value: boolean | undefined) {
    if (value === undefined) {
      delete machinePoolValidation.value[id];
    } else {
      machinePoolValidation.value[id] = value;
    }
  }

  const machinePoolErrors = ref<Record<string, string[]>>({});

  /**
   * Merges in a newly reported machine pool error and returns every pool's errors, formatted as
   * one human-readable message per pool (e.g. "pool-a has invalid fields: quantity and roles").
   */
  function recordMachinePoolError(error: Record<string, string[]>): string[] {
    machinePoolErrors.value = merge(machinePoolErrors.value, error);

    return Object.entries(machinePoolErrors.value)
      .map(([poolName, fields]) => {
        if (!fields.length) {
          return undefined;
        }

        const formattedFields = (() => {
          switch (fields.length) {
          case 1:
            return fields[0];
          case 2:
            return `${ fields[0] } and ${ fields[1] }`;
          default: {
            const [head, ...rest] = fields;

            return `${ rest.join(', ') }, and ${ head }`;
          }
          }
        })();

        return t('cluster.banner.machinePoolError', {
          count: fields.length, pool_name: poolName, fields: formattedFields
        }, true);
      })
      .filter((x): x is string => !!x);
  }

  return {
    machinePools,
    machinePoolValidation,
    unremovedMachinePools,
    hasOnlyIpv6Pools,
    hasDualStackPools,
    nodeTotals,
    hasRequiredNodes,
    removeMachinePool,
    machinePoolValidationChanged,
    recordMachinePoolError,
  };
}

/**
 * Resolves a single machine pool's config against the latest server state before it's saved,
 * surfacing a conflict as a thrown error (which the save flow uses to abort and show the user).
 *
 * `initialMachinePoolsValues` is keyed by machine config id, holding a snapshot taken when the
 * pool was first loaded/created - used as the merge base for `handleConflict`.
 */
export async function syncMachineConfigWithLatest(
  store: Store<any>,
  initialMachinePoolsValues: Record<string, any>,
  machinePool: any
) {
  if (machinePool?.config?.id) {
    // Use management/request instead of management/find to avoid overwriting the current machine pool in the store
    const _latestConfig = await store.dispatch('management/request', { url: `/v1/${ machinePool.config.type }s/${ machinePool.config.id }` });
    const latestConfig = await store.dispatch('management/create', _latestConfig);

    const _initialMachinePoolValue = initialMachinePoolsValues[machinePool?.config?.id] || {};
    const initialMachinePoolValue = await store.dispatch('management/create', _initialMachinePoolValue);

    // if there's the initial machine pool config, we are in a good position to apply the handleConflict function
    // to deal with out-of-sync data between machinePools configs. This also mutates the data inside machinePool.config through object reference
    const conflict = await handleConflict(
      initialMachinePoolValue,
      machinePool.config,
      latestConfig,
      {
        dispatch: store.dispatch,
        getters:  store.getters
      },
      'management'
    );

    // if there's conflicts, throw Error stops save process and surfaces error to user
    if (conflict) {
      // handleConflict resolves an array of conflict errors (or false); Error() stringifies
      // whatever it's given, same as it did when this ran as untyped JS in rke2.vue.
      throw Error(conflict as any);
    }
  }
}
