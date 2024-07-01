import { VuexStoreGetters } from '@shell/types/store/vuex';
import { COUNT } from '@shell/config/types';
import { ActionFindAllArgs } from '@shell/types/store/dashboard-store.types';

type conditionalDepaginateArgs ={
  ctx: { rootGetters: VuexStoreGetters},
  args: { type: string, opt: ActionFindAllArgs},
};
type conditionalDepaginateFn = (args: conditionalDepaginateArgs) => boolean

/**
 * Conditionally determine if a resource should use naive kube pagination api to fetch all results
 * (not just first page)
 */
export const conditionalDepaginate = (
  depaginate?: conditionalDepaginateFn | boolean,
  depaginateArgs?: conditionalDepaginateArgs
): boolean => {
  if (typeof depaginate === 'function') {
    return !!depaginateArgs ? depaginate(depaginateArgs) : false;
  }

  return depaginate as boolean;
};

/**
 * Setup a function that will determine if a resource should use native kube pagination api to fetch all resources
 * (not just the first page)
 */
export const configureConditionalDepaginate = (
  { maxResourceCount, isNorman = false }: { maxResourceCount: number, isNorman: boolean },
): conditionalDepaginateFn => {
  return (fnArgs: conditionalDepaginateArgs ): boolean => {
    const { rootGetters } = fnArgs.ctx;
    const { type } = fnArgs.args;
    const safeType = isNorman ? `management.cattle.io.${ type }` : type;

    const inStore = rootGetters['currentStore'](safeType);
    const resourceCounts = rootGetters[`${ inStore }/all`](COUNT)[0]?.counts[safeType];
    const resourceCount = resourceCounts?.summary?.count;

    return resourceCount !== undefined ? resourceCount < maxResourceCount : false;
  };
};
