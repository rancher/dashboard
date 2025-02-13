import paginationUtils from '@shell/utils/pagination-utils';
import { PaginationArgs, PaginationResourceContext, StorePagination } from '@shell/types/store/pagination.types';
import { VuexStore } from '@shell/types/store/vuex';
import { ActionFindPageArgs } from '@shell/types/store/dashboard-store.types';

interface Result<T> {
  data: Array<T>
  pagination: StorePagination
}

/**
 * This is a helper class that will assist in fetching a resource
 * - Handle if the resource can be fetched by the new pagination api
 * - Make a request to get a page (including classify)
 * - Provide updates when the resource changes
 *
 * This is designed to work in places where we don't/can't store the resource in the store
 * - There already exists a resource we don't want to overwrite
 * - We're transient and want something nicer than just `cluster/request` + all the trimmings
 */
class PaginationWrapper<T = any> {
    private $store: VuexStore;
    private enabledFor: PaginationResourceContext;
    private onChange: () => void;

    public isEnabled: boolean;

    constructor({
      $store,
      enabledFor,
      onChange,
    }: {
        $store: VuexStore,
        onChange: () => void,
        enabledFor: PaginationResourceContext,
        classify?: boolean,
    }) {
      this.$store = $store;
      this.isEnabled = paginationUtils.isEnabled({ rootGetters: $store.getters }, enabledFor);
      this.enabledFor = enabledFor;
      this.onChange = onChange;
    }

    async request(args: {
        pagination: PaginationArgs,
        classify?: boolean,
    }): Promise<Result<T>> {
      if (!this.isEnabled) {
        throw new Error(`Wrapper for type '${ this.enabledFor.store }/${ this.enabledFor.resource?.id }' in context '${ this.enabledFor.resource?.context }' not supported`);
      }
      const { pagination, classify: doClassify } = args;
      const opt: ActionFindPageArgs = {
        transient: {
          id:       'abs', // TODO: RC
          listener: () => this.onChange(),
        },
        watch: true,
        pagination,
      };

      // TODO: RC what happens if re-sub -- too old -- force update here??
      const out: Result<T> = await this.$store.dispatch(`${ this.enabledFor.store }/findPage`, { opt, type: this.enabledFor.resource?.id });

      if (doClassify) {
        for (let i = 0; i < out.data.length; i++) {
          out.data[i] = await this.$store.dispatch(`${ this.enabledFor.store }/create`, out.data[i]);
        }
      }

      return out;
    }
}

export default PaginationWrapper;
