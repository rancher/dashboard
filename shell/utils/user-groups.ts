import type { Store } from 'vuex';
import { MANAGEMENT } from '@shell/config/types';

interface GroupPrincipal {
  metadata?: { name?: string };
  displayName?: string;
  loginName?: string;
}

/**
 * The groups a user was in when they last logged in (or their memberships were refreshed), from their UserAttribute.
 * Roles bound to these groups apply to the user too.
 *
 * @returns map of group principal id to the group's display name. Empty if the viewer can't see UserAttributes or the user has none
 */
export async function fetchUserGroupPrincipals(store: Store<unknown>, userId: string): Promise<Record<string, string>> {
  if (!userId || !store.getters['management/schemaFor'](MANAGEMENT.USER_ATTRIBUTE)) {
    return {};
  }

  try {
    const userAttribute = await store.dispatch('management/find', { type: MANAGEMENT.USER_ATTRIBUTE, id: userId });
    const providers: { Items?: GroupPrincipal[] | null }[] = Object.values(userAttribute?.GroupPrincipals || {});

    return providers
      .flatMap((provider) => provider?.Items || [])
      .reduce((out: Record<string, string>, group) => {
        const id = group?.metadata?.name;

        if (id) {
          out[id] = group.displayName || group.loginName || id;
        }

        return out;
      }, {});
  } catch (e) {
    // A user that has never logged in has no UserAttribute
    return {};
  }
}
