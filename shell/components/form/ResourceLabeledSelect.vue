<script lang="ts">
import { PropType, defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { labelSelectPaginationFunction, LabelSelectPaginationFunctionOptions } from '@shell/components/form/labeled-select-utils/labeled-select.utils';
import { LabelSelectPaginateFn, LabelSelectPaginateFnOptions, LabelSelectPaginateFnResponse } from '@shell/types/components/labeledSelect';

type PaginateTypeOverridesFn = (opts: LabelSelectPaginationFunctionOptions) => LabelSelectPaginationFunctionOptions;

interface SharedSettings {
  /**
   * Provide specific LabelSelect options for this mode (paginated / not paginated)
   */
  labelSelectOptions?: { [key: string]: any },
  /**
   * Map the resources shown in LabelSelect
   */
  mapResult?: (resources: any[]) => any[]
}

/**
 * Settings to use when the LabelSelect is paginating
 */
export interface ResourceLabeledSelectPaginateSettings extends SharedSettings {
  /**
   * Override the convience function which fetches a page of results
   */
  overrideRequest?: LabelSelectPaginateFn,
  /**
   * Override the default settings used in the convience function to fetch a page of results
   */
  requestSettings?: PaginateTypeOverridesFn,
}

/**
 * Settings to use when the LabelSelect is fetching all resources (not paginating)
 */
export type ResourceLabeledSelectSettings = SharedSettings

/**
 * Force a specific mode
 */
export enum RESOURCE_LABEL_SELECT_MODE {
  /**
   * Fetch all resources
   */
  ALL_RESOURCES = 'ALL', // eslint-disable-line no-unused-vars
  /**
   * Determine if all resources are fetched given system settings
   */
  DYNAMIC = 'DYNAMIC', // eslint-disable-line no-unused-vars
}

/**
 * Convience wrapper around the LabelSelect component to support pagination
 *
 * Handles
 *
 * 1) Conditionally enabling the pagination feature given system settings
 * 2) Helper function to fetch the pagination result
 *
 * A number of ways can be provided to override the convienences (see props)
 */
export default defineComponent({
  name: 'ResourceLabeledSelect',

  components: { LabeledSelect },

  props: {
    /**
     * Resource to show
     */
    resourceType: {
      type:     String,
      required: true
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    /**
     * Determine if pagination is used via settings (DYNAMIC) or hardcode off
     */
    paginateMode: {
      type:    String as PropType<RESOURCE_LABEL_SELECT_MODE>,
      default: RESOURCE_LABEL_SELECT_MODE.DYNAMIC,
    },

    /**
     * Specific settings to use when we're showing all results
     */
    allResourcesSettings: {
      type:    Object as PropType<ResourceLabeledSelectSettings>,
      default: null,
    },

    /**
     * Specific settings to use when we're showing paginated results
     */
    paginatedResourceSettings: {
      type:    Object as PropType<ResourceLabeledSelectPaginateSettings>,
      default: null,
    },
  },

  data() {
    return { paginate: false };
  },

  async fetch() {
    switch (this.paginateMode) {
    case RESOURCE_LABEL_SELECT_MODE.ALL_RESOURCES:
      this.paginate = false;
      break;
    case RESOURCE_LABEL_SELECT_MODE.DYNAMIC:
      this.paginate = this.$store.getters[`${ this.inStore }/paginationEnabled`](this.resourceType);
      break;
    }

    if (!this.paginate) {
      await this.$store.dispatch(`${ this.inStore }/findAll`, { type: this.resourceType });
    }
  },

  computed: {
    labelSelectAttributes() {
      return this.paginate ? {
        ...this.$attrs,
        ...this.paginatedResourceSettings?.labelSelectOptions || {}
      } : {
        ...this.$attrs,
        ...this.allResourcesSettings?.labelSelectOptions || {}
      };
    },

    allOfType() {
      if (this.$fetchState.pending || this.paginate) {
        return [];
      }

      const all = this.$store.getters[`${ this.inStore }/all`](this.resourceType);

      return this.allResourcesSettings?.mapResult ? this.allResourcesSettings.mapResult(all) : all;
    }
  },

  methods: {
    /**
     * Typeof LabelSelectPaginateFn
     */
    async paginateType(opts: LabelSelectPaginateFnOptions): Promise<LabelSelectPaginateFnResponse> {
      if (this.paginatedResourceSettings?.overrideRequest) {
        return await this.paginatedResourceSettings.overrideRequest(opts);
      }

      const { filter } = opts;
      const filters = !!filter ? [PaginationParamFilter.createSingleField({ field: 'metadata.name', value: filter })] : [];
      const defaultOptions: LabelSelectPaginationFunctionOptions = {
        opts,
        filters,
        type: this.resourceType,
        ctx:  { getters: this.$store.getters, dispatch: this.$store.dispatch },
        sort: [{ asc: true, field: 'metadata.name' }],
      };
      const options = this.paginatedResourceSettings?.requestSettings ? this.paginatedResourceSettings.requestSettings(defaultOptions) : defaultOptions;
      const res = await labelSelectPaginationFunction(options);

      return this.paginatedResourceSettings?.mapResult ? {
        ...res,
        page: this.paginatedResourceSettings.mapResult(res.page)
      } : res;
    },
  },
});
</script>

<template>
  <LabeledSelect
    v-bind="labelSelectAttributes"
    :loading="$fetchState.pending"
    :options="allOfType"
    :paginate="paginateType"
    v-on="$listeners"
  />
</template>
