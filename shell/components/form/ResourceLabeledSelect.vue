<script lang="ts">
import { PropType, defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { labelSelectPaginationFunction, LabelSelectPaginationFunctionOptions } from '@shell/components/form/labeled-select-utils/labeled-select.utils';
import { LabelSelectPaginateFnOptions, LabelSelectPaginateFnResponse } from '@shell/types/components/labeledSelect';
import { RESOURCE_LABEL_SELECT_MODE, ResourceLabeledSelectPaginateSettings, ResourceLabeledSelectSettings } from '@shell/types/components/resourceLabeledSelect';

/**
 * Convenience  wrapper around the LabelSelect component to support pagination
 *
 * Handles
 *
 * 1) Conditionally enabling the pagination feature given system settings
 * 2) Helper function to fetch the pagination result
 *
 * A number of ways can be provided to override the conveniences (see props)
 */
export default defineComponent({
  name: 'ResourceLabeledSelect',

  components: { LabeledSelect },

  emits: ['update:value'],

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
     * Specific settings to use when we're showing all results in the drop down
     */
    allResourcesSettings: {
      type:    Object as PropType<ResourceLabeledSelectSettings>,
      default: null,
    },

    /**
     * Specific settings to use when we're showing paginated results in the drop down
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
      // The resource won't be paginated and component expects everything up front
      await this.$store.dispatch(`${ this.inStore }/findAll`, { type: this.resourceType });
    }
  },

  computed: {
    labelSelectAttributes() {
      // This component is a wrapper for LabelSelect, so pass through everything
      const allAttrs = {
        ...this.$attrs, // Attributes (other than props)
        ...this.$props, // Attributes that are props
      };

      return this.paginate ? {
        ...allAttrs,
        ...this.paginatedResourceSettings?.labelSelectOptions || {}
      } : {
        ...allAttrs,
        ...this.allResourcesSettings?.labelSelectOptions || {}
      };
    },

    allOfType() {
      if (this.$fetchState.pending || this.paginate) {
        return [];
      }

      const all = this.$store.getters[`${ this.inStore }/all`](this.resourceType);

      return this.allResourcesSettings?.updateResources ? this.allResourcesSettings.updateResources(all) : all;
    }
  },

  methods: {
    /**
     * Make the request to fetch the resource given the state of the label select (filter, page, page size, etc see LabelSelectPaginateFn)
     * opts: Typeof LabelSelectPaginateFn
     */
    async paginateType(opts: LabelSelectPaginateFnOptions): Promise<LabelSelectPaginateFnResponse> {
      if (this.paginatedResourceSettings?.overrideRequest) {
        return await this.paginatedResourceSettings.overrideRequest(opts);
      }

      const { filter } = opts;
      const filters = !!filter ? [PaginationParamFilter.createSingleField({
        field: 'metadata.name', value: filter, exact: false
      })] : [];
      const defaultOptions: LabelSelectPaginationFunctionOptions = {
        opts,
        filters,
        type: this.resourceType,
        ctx:  { getters: this.$store.getters, dispatch: this.$store.dispatch },
        sort: [{ asc: true, field: 'metadata.name' }],
      };
      const options = this.paginatedResourceSettings?.requestSettings ? this.paginatedResourceSettings.requestSettings(defaultOptions) : defaultOptions;
      const res = await labelSelectPaginationFunction(options);

      return this.paginatedResourceSettings?.updateResources ? {
        ...res,
        page: this.paginatedResourceSettings.updateResources(res.page)
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
    @update:value="$emit('update:value', $event)"
  />
</template>
