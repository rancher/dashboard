<script>
import { COUNT } from '@shell/config/types';

/**
 * Loading Indicator for resources - used when we are loading resources incrementally, by page
 */
export default {

  name: 'ResourceLoadingIndicator',

  props: {
    resource: {
      type:     String,
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
    haveAll() {
      return this.$store.getters[`${ this.inStore }/haveAll`](this.resource);
    },

    total() {
      const clusterCounts = this.$store.getters[`${ this.inStore }/all`](COUNT);

      return clusterCounts?.[0]?.counts?.[this.resource]?.summary?.count;
    },

    count() {
      const existingData = this.$store.getters[`${ this.inStore }/all`](this.resource) || [];

      return (existingData || []).length;
    },

    width() {
      const progress = Math.ceil(100 * (this.count / this.total));

      return `${ progress }%`;
    }
  },
};
</script>

<template>
  <div v-if="count && !haveAll" class="ml-10 resource-loading-indicator">
    <div class="inner">
      <div class="resource-loader">
        <div class="rl-bg">
          <i class="icon icon-spinner icon-spin" /><span>Loading {{ count }}<span v-if="!indeterminate"> / {{ total }}</span></span>
        </div>
      </div>
      <div class="resource-loader" :style="{width}">
        <div class="rl-fg">
          <i class="icon icon-spinner icon-spin" /><span>Loading {{ count }}<span v-if="!indeterminate"> / {{ total }}</span></span>
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
      color: #fff;
      overflow: hidden;
      white-space: nowrap;
    }

    .resource-loader:first-child {
      background-color: var(--border);
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
