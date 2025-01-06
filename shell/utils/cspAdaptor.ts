// For testing these could be changed to something like...

import { CATALOG } from '@shell/config/types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';

const cspAdaptorApp = ['rancher-csp-adapter', 'rancher-csp-billing-adapter'];
// For testing above line could be replaced with below line...
// const cspAdaptorApp = ['rancher-webhooka', 'rancher-webhook'];

/**
 * Helpers in order to
 */
class CspAdapterUtils {
  static canPagination($store: VuexStore): boolean {
    return $store.getters[`management/paginationEnabled`]({ id: CATALOG.APP, context: 'branding' });
  }

  static fetchCspAdaptorApp($store: VuexStore): Promise<any> {
    // For the login page, the schemas won't be loaded - we don't need the apps in this case
    if ($store.getters['management/canList'](CATALOG.APP)) {
      if (CspAdapterUtils.canPagination($store)) {
        // Restrict the amount of apps we need to fetch
        return $store.dispatch('management/findPage', {
          type: CATALOG.APP,
          opt:  { // Of type ActionFindPageArgs
            pagination: new FilterArgs({
              filters: PaginationParamFilter.createMultipleFields(cspAdaptorApp.map(
                (t) => new PaginationFilterField({
                  field: 'metadata.name',
                  value: t,
                })
              )),
            })
          }
        });
      }

      return $store.dispatch('management/findAll', { type: CATALOG.APP });
    }

    return Promise.resolve([]);
  }

  static hasCspAdapter({ $store, apps }: { $store: VuexStore, apps: any[]}): Object {
    // In theory this should contain the filtered apps when pagination is on, and all apps when off. Keep filtering though in both cases just in case
    return !!apps?.find((a) => cspAdaptorApp.includes(a.metadata?.name));
  }
}

export default CspAdapterUtils;
