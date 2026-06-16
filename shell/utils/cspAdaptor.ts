// For testing these could be changed to something like...

import { CATALOG } from '@shell/config/types';
import { ActionFindPageArgs, ActionFindPageTransientResponse } from '@shell/types/store/dashboard-store.types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';

const CSP_ADAPTER_APPS = ['rancher-csp-adapter', 'rancher-csp-billing-adapter'];
// For testing above line could be replaced with below line...
// const CSP_ADAPTER_APPS = ['rancher-webhooka', 'rancher-webhook'];

/**
 * Helpers in order to
 */
class CspAdapterUtils {
  static canPagination($store: VuexStore): boolean {
    return $store.getters[`management/paginationEnabled`]({ id: CATALOG.APP, context: 'branding' });
  }

  private static apps?: any[] = undefined;
  public static resetState() {
    this.apps = undefined;
  }

  static async fetchCspAdaptorApp($store: VuexStore): Promise<any> {
    if (this.apps) {
      return this.apps;
    }

    // For the login page, the schemas won't be loaded - we don't need the apps in this case
    if ($store.getters['management/canList'](CATALOG.APP)) {
      if (CspAdapterUtils.canPagination($store)) {
        // Restrict the amount of apps we need to fetch
        const opt: ActionFindPageArgs = {
          pagination: new FilterArgs({
            filters: PaginationParamFilter.createMultipleFields(CSP_ADAPTER_APPS.map(
              (t) => new PaginationFilterField({
                field: 'metadata.name',
                value: t,
              })
            )),
          }),
          watch:     false,
          transient: true
        };

        const resp: ActionFindPageTransientResponse = await $store.dispatch('management/findPage', {
          type: CATALOG.APP,
          opt
        });

        this.apps = resp.data;
      } else {
        this.apps = await $store.dispatch('management/findAll', { type: CATALOG.APP });
      }

      return this.apps;
    }

    return Promise.resolve([]);
  }

  static hasCspAdapter({ $store, apps }: { $store: VuexStore, apps: any[]}): Object {
    // In theory this should contain the filtered apps when pagination is on, and all apps when off. Keep filtering though in both cases just in case
    return apps?.find((a) => CSP_ADAPTER_APPS.includes(a.metadata?.name));
  }
}

export default CspAdapterUtils;
