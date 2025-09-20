import { canViewResource } from '@shell/utils/auth';
import { getResourceFromRoute } from '@shell/utils/router';
import { RouteLocation } from 'vue-router';
import { Store } from 'vuex';

/**
 * Check that the resource is valid, if not redirect to fail whale
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

  // Unknown resource, redirect to fail whale

  const error = new Error(store.getters['i18n/t']('nav.failWhale.resourceNotFound', { resource }, true));

  store.dispatch('loadingError', error);

  throw error;
}
