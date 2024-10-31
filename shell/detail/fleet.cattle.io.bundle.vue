<script>
import FleetBundleResources from '@shell/components/fleet/FleetBundleResources.vue';

export default {
  name: 'FleetBundleDetail',

  components: { FleetBundleResources },
  props:      {
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    bundleResources() {
      return this.value?.status?.resourceKey || [];
    },
    resourceCount() {
      return this.value.status?.summary?.desiredReady || 0;
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
