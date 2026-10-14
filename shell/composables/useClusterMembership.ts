import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { canViewClusterMembershipEditor } from '@shell/components/form/Members/ClusterMembershipEditor.vue';

export interface MembershipUpdate {
  save?: (parentId: string) => Promise<void>;
  [key: string]: any;
}

/**
 * Backs the `ClusterMembershipEditor` used on every cluster create/edit form (RKE2, AKS, EKS, GKE,
 * Imported, Harvester): whether the current user is allowed to manage members, and staging the
 * pending membership change until the form's save-hook flow commits it via `saveRoleBindings` below.
 *
 * `saveRoleBindings` is deliberately NOT part of this composable's returned object: consuming
 * components need to keep their own `saveRoleBindings` Options API method (its bound reference is
 * what gets passed to `registerAfterHook`), and a same-named property returned from setup() would
 * collide with that method on the component instance. Exporting it as a plain function alongside
 * the composable avoids the collision - the consuming method just forwards to it.
 */
export function useClusterMembership() {
  const store = useStore();

  const membershipUpdate = ref<MembershipUpdate>({});

  // Guards against `store` being unavailable, matching useI18n's own fallback for the same
  // situation: some existing test suites for the consuming components only mock `this.$store`
  // (the Options API surface) without installing a real Vuex store, so `useStore()`'s inject()
  // finds nothing there. Production always has a real store via `app.use(store)`.
  const canManageMembers = computed(() => !!store && canViewClusterMembershipEditor(store));

  function onMembershipUpdate(update: MembershipUpdate) {
    membershipUpdate.value = update;
  }

  return {
    membershipUpdate,
    canManageMembers,
    onMembershipUpdate,
  };
}

/**
 * Committing the staged membership change needs the cluster's management-cluster id, which each
 * provider resolves differently (some read it straight off an already-present `normanCluster`,
 * RKE2 has to await the management cluster coming into existence first) - so this takes the
 * already-resolved id as a parameter rather than trying to resolve it itself.
 */
export async function saveRoleBindings(membershipUpdate: MembershipUpdate, parentId: string) {
  if (membershipUpdate.save) {
    await membershipUpdate.save(parentId);
  }
}
