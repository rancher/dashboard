import { canViewResource } from '@shell/utils/auth';
import { getResourceFromRoute, findMeta } from '@shell/utils/router';
import { RouteLocation } from 'vue-router';
import { Store } from 'vuex';

/**
 * Route `meta` flag opting a route out of the global fail whale redirect for an unknown resource.
 *
 * When set (see `shell/config/router/routes.js`), navigation is allowed to continue so the error
 * can be shown in-context (in place of the route's content, see `ResourceList`) - retaining the
 * side menu and cluster context - rather than redirecting to the global fail whale page.
 */
export const INVALID_RESOURCE_IN_CONTEXT = 'invalidResourceInContext';

/**
 * Check that the resource is valid, if not redirect to fail whale
 *
 * The exception is routes flagged with the `invalidResourceInContext` meta - there we allow
 * navigation to continue so the error can be shown in-context (retaining the cluster explorer
 * context). See `ResourceList`.
 *
 * This requires that
 * - product is set
 * - product's store is set and setup (so we can check schema's within it)
 * - product's store has the schemaFor getter (extension stores might not have it)
 * - there's a resource associated with route (meta or param)
 */
export function validateResource(store: Store<any>, to: RouteLocation) {
  const product = store.getters['currentProduct'];
  const resource = getResourceFromRoute(to);

  // In order to check a resource is valid we need these
  if (!product || !resource) {
    return false;
  }

  if (canViewResource(store, resource)) {
    return false;
  }

  // Unknown resource.
  // If the route opts in via meta, let navigation continue so the error is rendered in-context
  // (in place of the route's content) - retaining the side menu and cluster context.
  // The page (e.g. `ResourceList`) detects the missing schema and renders the error itself.
  if (findMeta(to, INVALID_RESOURCE_IN_CONTEXT)) {
    return false;
  }

  // Otherwise redirect to fail whale

  const error = new Error(store.getters['i18n/t']('nav.failWhale.resourceNotFound', { resource }, true));

  store.dispatch('loadingError', error);

  throw error;
}
