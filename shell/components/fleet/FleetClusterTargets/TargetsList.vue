<script lang="ts">
import { PropType } from 'vue';

export default {
  name: 'FleetTargetsList',

  props: {
    clusters: {
      type:    Array as PropType<{ name: string }[]>,
      default: () => [],
    },

    emptyLabel: {
      type:    String,
      default: ''
    }
  },

  computed: {
    names() {
      const names = this.clusters.map(({ name }) => name);
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
      class="text-muted"
    >
      {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
  .targets-list {
    height: 100%;
  }
</style>
