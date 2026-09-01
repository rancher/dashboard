import { RouterLinkStub } from '@vue/test-utils';
import { NavigationFailure, RouteLocationNormalized } from 'vue-router';

/**
 * See {@link RouterLinkSlotArgument} in vue-router
 */
export interface RouterLinkSlotArgumentOptional {
    href?: string;
    route?: RouteLocationNormalized;
    navigate?: (e?: MouseEvent) => Promise<undefined | NavigationFailure>;
    isActive?: boolean;
    isExactActive?: boolean;
}

/**
 * This is a workaround because VueUtils RouterLinkStub doesn't currently support the slot api.
 *
 * See @link https://github.com/vuejs/vue-test-utils/issues/1803#issuecomment-940884170
 *
 * @param slotProps Provide arguments that you want passed to the child rendered by router-link
 * @returns A stub
 */
export function createChildRenderingRouterLinkStub(slotProps?: RouterLinkSlotArgumentOptional): typeof RouterLinkStub | any {
  return {
    ...RouterLinkStub,
    render() {
      return this.$slots.default({
        href:          slotProps?.href || '',
        route:         slotProps?.route || undefined,
        navigate:      slotProps?.navigate || (() => {}),
        isActive:      slotProps?.isActive || false,
        isExactActive: slotProps?.isExactActive || false,
      });
    }
  };
}
