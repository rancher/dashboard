<script>
import { MANAGEMENT } from '@shell/config/types';
import FleetBundleResources from '@shell/components/fleet/FleetBundleResources.vue';
import FleetUtils from '@shell/utils/fleet';

export default {
  name: 'FleetBundleDetail',

  components: { FleetBundleResources },
  props:      {
    value: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    if (this.value.authorId && this.$store.getters['management/schemaFor'](MANAGEMENT.USER)) {
      await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }, { root: true });
    }
  },

  computed: {
    bundleResources() {
      return FleetUtils.resourcesFromBundleStatus(this.value?.status);
    },
    resourceCount() {
      return this.bundleResources.length;
    },
  }
};

</script>

<template>
  <div>
    <div class="bundle-title mt-20 mb-20">
      <h2>{{ t('fleet.bundles.resources') }}</h2>
      <span>{{ resourceCount }}</span>
    </div>
    <FleetBundleResources
      :value="bundleResources"
    />
  </div>
</template>

<style lang="scss" scoped>
.bundle-title {
  display: flex;
  align-items: center;

  h2 {
    margin: 0 10px 0 0;
  }

  span {
    background-color: var(--darker);
    color: var(--default);
    padding: 5px 10px;
    border-radius: 15px;
  }
}
</style>
