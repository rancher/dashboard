<script>
import { COUNT } from '@shell/config/types';

/**
 * Loading Indicator for resources - used when we are loading resources incrementally, by page
 */
export default {

  name: 'ResourceLoadingIndicator',

  props: {
    resources: {
      type:     Array,
      required: true,
    },
    indeterminate: {
      type:    Boolean,
      default: false,
    },
  },

  data() {
    const inStore = this.$store.getters['currentStore'](this.resource);

    return { inStore };
  },

  computed: {
    // Count of rows - either from the data provided or from the rows for the first resource
    rowsCount() {
      if (this.resources.length > 0) {
        const existingData = this.$store.getters[`${ this.inStore }/all`](this.resources[0]) || [];

        return (existingData || []).length;
      }

      return 0;
    },

    // Have we loaded all resources for the types that are needed
    haveAll() {
      return this.resources.reduce((acc, r) => {
        return acc && this.$store.getters[`${ this.inStore }/haveAll`](r);
      }, true);
    },

    // Total of all counts of all resources for all of the resources being loaded
    total() {
      const clusterCounts = this.$store.getters[`${ this.inStore }/all`](COUNT);

      return this.resources.reduce((acc, r) => {
        const resourceCounts = clusterCounts?.[0]?.counts?.[r];
        const resourceCount = resourceCounts?.summary?.count;
        const count = resourceCount || 0;

        return acc + count;
      }, 0);
    },

    // Total count of all of the resources for all of the resources being loaded
    count() {
      return this.resources.reduce((acc, r) => {
        return acc + (this.$store.getters[`${ this.inStore }/all`](r) || []).length;
      }, 0);
    },

    // Width style to enable the progress bar style presentation
    width() {
      const progress = Math.ceil(100 * (this.count / this.total));

      return `${ progress }%`;
    }
  },
};
</script>

<template>
  <div
    v-if="count && !haveAll"
    class="ml-10 resource-loading-indicator"
  >
    <div class="inner">
      <div class="resource-loader">
        <div class="rl-bg">
          <i class="icon icon-spinner icon-spin" /><span>{{ t( 'resourceLoadingIndicator.loading' ) }} <span v-if="!indeterminate">{{ count }} / {{ total }}</span></span>
        </div>
      </div>
      <div
        class="resource-loader"
        :style="{width}"
      >
        <div class="rl-fg">
          <i class="icon icon-spinner icon-spin" /><span>{{ t( 'resourceLoadingIndicator.loading' ) }} <span v-if="!indeterminate">{{ count }} / {{ total }}</span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .resource-loading-indicator {
    border: 1px solid var(--link);
    border-radius: 10px;
    position: relative;
    width: min-content;
    overflow: hidden;

    .resource-loader:last-child {
      position: absolute;
      top: 0;

      background-color: var(--link);
      color: var(--link-text);
      overflow: hidden;
      white-space: nowrap;
    }

    .resource-loader {
      padding: 1px 10px;
      width: max-content;

      .rl-fg, .rl-bg {
        align-content: center;
        display: flex;

        > i {
          font-size: 18px;
          line-height: 18px;
        }

        > span {
          margin-left: 5px;
        }
      }
    }
  }
</style>
