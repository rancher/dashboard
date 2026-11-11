import { defineAsyncComponent, markRaw } from 'vue';
import AsyncFallback from '@shell/components/Drawer/ResourceDetailDrawer/AsyncFallback.vue';

/**
 * The drawer reaches the YAML editor, and through it CodeMirror, the diff viewer and the syntax
 * highlighter. Loading it on demand keeps all of that out of the initial bundle - and out of every
 * extension's bundle, since each one compiles its own copy of the resource class that opens it.
 */
const loadResourceDetailDrawer = () => import(
  /* webpackChunkName: "resource-detail-drawer" */ '@shell/components/Drawer/ResourceDetailDrawer/index.vue'
);

/**
 * Start loading the drawer before it is asked for, from somewhere the user has shown they may be
 * about to open it - opening an action menu, or landing on a detail page that offers the action.
 *
 * Deliberately not done on app start: in an extension this chunk also carries that extension's own
 * copy of CodeMirror, so warming it for everyone would hand back most of what deferring it saved.
 */
export function preloadResourceDetailDrawer(): void {
  loadResourceDetailDrawer().catch(() => {
    // A failed warm-up is not worth reporting. The user has not asked for the drawer, and opening
    // it will retry and surface the failure then.
  });
}

/**
 * The drawer, loaded on demand. Defined once rather than per call, so re-opening it reuses the
 * resolved component instead of remounting.
 */
export const ResourceDetailDrawerAsync = markRaw(defineAsyncComponent({
  loader:           loadResourceDetailDrawer,
  loadingComponent: AsyncFallback,
  errorComponent:   AsyncFallback,
}));
