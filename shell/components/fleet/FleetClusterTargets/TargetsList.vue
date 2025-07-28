<script lang="ts">
import { PropType } from 'vue';
import { Cluster } from '@shell/components/fleet/FleetClusterTargets/index.vue';

export default {
  name: 'FleetTargetsList',

  props: {
    clusters: {
      type:    Array as PropType<Cluster[]>,
      default: () => [],
    },

    emptyLabel: {
      type:    String,
      default: ''
    }
  },

  computed: {
    names() {
      const names = this.clusters.map(({ nameDisplay, name }) => nameDisplay || name);
      const max = 10;

      const remaining = names.length - max;

      if (remaining > 0) {
        return [
          ...names.filter((_, i) => i < max),
          this.t('fleet.clusterTargets.rules.matching.plusMore', { n: remaining }, true),
        ];
      }

      return names;
    }
  }
};
</script>

<template>
  <div class="targets-list">
    <h3>{{ t('fleet.clusterTargets.rules.matching.title') }}</h3>
    <span
      v-for="(name, i) in names"
      :key="i"
      class="row mt-5"
    >
      {{ name }}
    </span>
    <span
      v-if="!names.length"
      class="text-label"
    >
      {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
  .targets-list {
    height: 100%;
    border-radius: 4px;
    padding: 16px;
    background-color: var(--tabbed-sidebar-bg);
  }
</style>
