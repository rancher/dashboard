import { computed, ComputedRef, inject } from 'vue';
import { useRoute } from 'vue-router';

import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { Card, CardLocation, ExtensionPoint } from '@shell/core/types';

/**
 * Cards registered by extensions for the given location that apply to the current route.
 *
 * The Options API equivalent is a `getApplicableExtensionEnhancements(this, ...)` call - this is
 * the same thing for components using the composition API.
 *
 * Cards are sorted by `weight`, highest first. Cards of equal weight keep the order they were
 * registered in. Resolving `labelKey` into a title is left to the caller.
 */
export const useExtensionCards = (location: CardLocation): ComputedRef<Card[]> => {
  const route = useRoute();
  // Provided by `initUiApis` (shell/apis/impl/apis.ts). Absent in contexts that don't boot the
  // extension manager, in which case there's nothing for an extension to have registered
  const extension = inject<any>('$extension', undefined);

  return computed(() => {
    if (!route || !extension) {
      return [];
    }

    const cards = getApplicableExtensionEnhancements<Card>(
      { $extension: extension } as any,
      ExtensionPoint.CARD,
      location,
      route as any
    );

    return [...cards].sort((a, b) => (b.weight || 0) - (a.weight || 0));
  });
};
