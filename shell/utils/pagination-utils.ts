import { PaginationSettings } from '@shell/types/resources/settings';
import {
  NAMESPACE_FILTER_ALL_USER as ALL_USER,
  NAMESPACE_FILTER_ALL as ALL,
  NAMESPACE_FILTER_ALL_SYSTEM as ALL_SYSTEM,
  NAMESPACE_FILTER_NAMESPACED_YES as NAMESPACED_YES,
  NAMESPACE_FILTER_NAMESPACED_NO as NAMESPACED_NO,
  NAMESPACE_FILTER_KINDS,
  NAMESPACE_FILTER_NS_FULL_PREFIX,
  NAMESPACE_FILTER_P_FULL_PREFIX,
} from '@shell/utils/namespace-filter';

// This are hardcoded atm, but will be changed via the `Performance` settings
const settings: PaginationSettings = {
  enabled: false,
  stores:  {
    cluster: {
      resources: {
        enableAll:  false,
        enableSome: {
          enabled: ['configmap', 'secret', 'pod'],
          generic: true,
        }
      }
    }
  }
};

/**
 * Helper functions for server side pagination
 */
class PaginationUtils {
  validNsProjectFilters = [ALL, ALL_SYSTEM, ALL_USER, ALL_SYSTEM, NAMESPACE_FILTER_KINDS.NAMESPACE, NAMESPACE_FILTER_KINDS.PROJECT, NAMESPACED_YES, NAMESPACED_NO];

  /**
   * Is pagination enabled at a global level or for a specific resource
   */
  isEnabled({ rootGetters }: any, enabledFor: {
    store: string,
    resource?: {
      id: string,
    }
  }) {
    // No setting, not enabled
    if (!settings?.enabled) {
      return false;
    }

    // Missing required params, not enabled
    if (!enabledFor) {
      return false;
    }

    const storeSettings = settings.stores?.[enabledFor.store];

    // No pagination setting for target store, not enabled
    if (!storeSettings) {
      return false;
    }

    // Not interested in a resource, so just top level settings are checked
    if (!enabledFor.resource) {
      return true;
    }

    // Store says all resources are enabled
    if (storeSettings.resources.enableAll) {
      return true;
    }

    // given a resource... but no id... invalid
    if (!enabledFor.resource.id) {
      return false;
    }

    // Store says only some (those that have pagination columns not from schema and no custom list)
    const isGeneric =
      !rootGetters['type-map/configuredHeaders'](enabledFor.resource.id) &&
      !rootGetters['type-map/configuredPaginationHeaders'](enabledFor.resource.id) &&
      !rootGetters['type-map/hasCustomList'](enabledFor.resource.id);

    if (storeSettings.resources.enableSome.generic && isGeneric) {
      return true;
    }

    if (storeSettings.resources.enableSome.enabled.includes(enabledFor.resource.id)) {
      return true;
    }

    return false;
  }

  validateNsProjectFilters(nsProjectFilters: string[]) {
    return nsProjectFilters?.every((f) => this.validateNsProjectFilter(f));
  }

  validateNsProjectFilter(nsProjectFilter: string) {
    if (nsProjectFilter.startsWith(NAMESPACE_FILTER_NS_FULL_PREFIX) || nsProjectFilter.startsWith(NAMESPACE_FILTER_P_FULL_PREFIX)) {
      return true;
    }

    return this.validNsProjectFilters.includes(nsProjectFilter);
  }
}

export default new PaginationUtils();
