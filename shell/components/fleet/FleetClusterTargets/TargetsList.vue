<script lang="ts">
import { PropType } from 'vue';

export default {
  name: 'FleetTargetsList',

  props: {
    clusters: {
      type:    Array as PropType<{ name: string }[]>,
      default: () => [],
    },
  },

  computed: {
    names() {
      const names = this.clusters.map(({ name }) => name);
      const max = 10;

      const remaining = names.length - max;

      if (remaining > 0) {
        return [
          ...names.filter((_, i) => i < max),
          `... and ${ remaining } other clusters`
        ];
      }

      return names;
    }
  }
};
</script>

<template>
  <div class="targets-list">
    <h3>{{ t('fleet.clusterTargets.rules.matching') }}</h3>
    <span
      v-for="(name, i) in names"
      :key="i"
      class="row"
    >
      {{ name }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
  .targets-list {
    border: 1px solid var(--border);
    padding: 15px;
    border-radius: 5px;
    height: 100%;
  }
</style>
