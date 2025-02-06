import { PaginationSettings, PaginationSettingsStore } from '@shell/types/resources/settings';
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
import { PaginationArgs, PaginationResourceContext, PaginationParam, PaginationSort } from '@shell/types/store/pagination.types';
import { sameArrayObjects } from '@shell/utils/array';
import { isEqual } from '@shell/utils/object';
import { STEVE_CACHE } from '@shell/store/features';
import { getPerformanceSetting } from '@shell/utils/settings';
import { PAGINATION_SETTINGS_STORE_DEFAULTS } from '@shell/plugins/steve/steve-pagination-utils';

/**
 * Helper functions for server side pagination
 */
class PaginationUtils {
  /**
   * When a ns filter isn't one or more projects/namespaces... what are the valid values?
   *
   * This basically blocks 'Not in a Project'.. which would involve a projectsornamespaces param with every ns not in a project.
   */
  validNsProjectFilters = [ALL, ALL_SYSTEM, ALL_USER, ALL_SYSTEM, NAMESPACE_FILTER_KINDS.NAMESPACE, NAMESPACE_FILTER_KINDS.PROJECT, NAMESPACED_YES, NAMESPACED_NO];

  private getSettings({ rootGetters }: any): PaginationSettings {
    const perf = getPerformanceSetting(rootGetters);

    return perf.serverPagination;
  }

  public getStoreSettings(ctx: any): PaginationSettingsStore
  public getStoreSettings(serverPagination: PaginationSettings): PaginationSettingsStore
  public getStoreSettings(arg: any | PaginationSettings): PaginationSettingsStore {
    const serverPagination: PaginationSettings = arg?.rootGetters !== undefined ? this.getSettings(arg) : arg;

    return serverPagination?.useDefaultStores ? this.getStoreDefault() : serverPagination?.stores || this.getStoreDefault();
  }

  public getStoreDefault(): PaginationSettingsStore {
    return PAGINATION_SETTINGS_STORE_DEFAULTS;
  }

  isSteveCacheEnabled({ rootGetters }: any): boolean {
    // We always get Feature flags as part of start up (see `dispatch('features/loadServer')` in loadManagement)
    return rootGetters['features/get']?.(STEVE_CACHE);
  }

  /**
   * Is pagination enabled at a global level or for a specific resource
   */
  isEnabled({ rootGetters }: any, enabledFor: PaginationResourceContext) {
    // Cache must be enabled to support pagination api
    if (!this.isSteveCacheEnabled({ rootGetters })) {
      return false;
    }

    const settings = this.getSettings({ rootGetters });

    // No setting, not enabled
    if (!settings?.enabled) {
      return false;
    }

    // Missing required params, not enabled
    if (!enabledFor) {
      return false;
    }

    const storeSettings = this.getStoreSettings(settings)?.[enabledFor.store];

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

    if (storeSettings.resources.enableSome.enabled.find((setting) => {
      if (typeof setting === 'string') {
        return setting === enabledFor.resource?.id;
      }

      if (setting.resource === enabledFor.resource?.id) {
        if (!!setting.context) {
          return enabledFor.resource?.context ? setting.context.includes(enabledFor.resource.context) : false;
        }

        return true;
      }

      return false;
    })) {
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

  paginationFilterEqual(a: PaginationParam, b: PaginationParam): boolean {
    if (a.param !== b.param || a.equals !== b.equals) {
      return false;
    }

    return sameArrayObjects(a.fields, b.fields, true);
  }

  paginationFiltersEqual(a: PaginationParam[], b: PaginationParam[]): boolean {
    if (!!a && a?.length !== b?.length) {
      return false;
    }

    for (let i = 0; i < a.length; i++) {
      if (!this.paginationFilterEqual(a[i], b[i])) {
        return false;
      }
    }

    return true;
  }

  paginationEqual(a?: PaginationArgs, b?: PaginationArgs): boolean {
    const {
      filters: aFilter = [], sort: aSort = [], projectsOrNamespaces: aPN = [], ...aPrimitiveTypes
    } = a || {};
    const {
      filters: bFilter = [], sort: bSort = [], projectsOrNamespaces: bPN = [], ...bPrimitiveTypes
    } = b || {};

    return isEqual(aPrimitiveTypes, bPrimitiveTypes) &&
      this.paginationFiltersEqual(aFilter, bFilter) &&
      this.paginationFiltersEqual(aPN, bPN) &&
      sameArrayObjects<PaginationSort>(aSort, bSort, true);
  }
}

export default new PaginationUtils();
