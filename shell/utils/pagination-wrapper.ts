import paginationUtils from '@shell/utils/pagination-utils';
import { PaginationArgs, PaginationResourceContext, StorePagination } from 'types/store/pagination.types';
import { VuexStore } from 'types/store/vuex';

interface Result<T> {
  data: Array<T>
  pagination: StorePagination
}

class PaginationWrapper<T = any> {
    private $store: VuexStore;
    private enabledFor: PaginationResourceContext;
    private onUpdate: (out: Result<T>) => void; // TODO: RC wire in to web socket (when new socket stuff is available)

    public isEnabled: boolean;

    constructor({
      $store,
      enabledFor,
      onUpdate,
    }: {
        $store: VuexStore,
        onUpdate: (res: Result<T>) => void,
        enabledFor: PaginationResourceContext,
    }) {
      this.$store = $store;
      this.isEnabled = paginationUtils.isEnabled({ rootGetters: $store.getters }, enabledFor);
      this.enabledFor = enabledFor;
      this.onUpdate = onUpdate;
    }

    async request(args: {
        pagination: PaginationArgs,
        classify?: boolean,
    }): Promise<Result<T>> {
      if (!this.isEnabled) {
        throw new Error(`Wrapper for type '${ this.enabledFor.store }/${ this.enabledFor.resource?.id }' in context '${ this.enabledFor.resource?.context }' not supported`);
      }
      const { pagination, classify: doClassify } = args;
      const opt = {
        transient: true,
        pagination
      };

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
