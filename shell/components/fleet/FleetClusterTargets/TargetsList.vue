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
    clustersRenderList() {
      const clustersRenderList = this.clusters.map(({ nameDisplay, name, detailLocation }) => ({
        name: nameDisplay || name,
        detailLocation,
      }));

      return clustersRenderList;
    }
  }
};
</script>

<template>
  <div class="targets-list-main">
    <h3>{{ t('fleet.clusterTargets.rules.matching.title', { n: clustersRenderList.length }) }}</h3>
    <div class="targets-list-list">
      <span
        v-for="(cluster, i) in clustersRenderList"
        :key="i"
        class="row mt-5"
      >
        <router-link
          :to="cluster.detailLocation"
          target="_blank"
          class="link-main"
        >
          {{ cluster.name }}&nbsp;<i class="link-icon icon icon-external-link" />
        </router-link>
      </span>
      <span
        v-if="!clustersRenderList.length"
        class="text-label"
      >
        {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .targets-list-main {
    height: 100%;
    border-radius: 4px;
    padding: 16px;
    background-color: var(--tabbed-sidebar-bg);
    display: flex;
    flex-direction: column;
  }
  .targets-list-list {
    overflow-y: scroll;
  }
  .link-main{
    word-spacing: 22px;
  }
  .link-icon {
    position: absolute;
    margin-left: -14px; // Remove the space of the icon to make it float to accomodate the underline
    display: none; // Make the icon disappear by default
  }

  .link-main:hover .link-icon {
    display: inline; // Only appear when hovered
  }
</style>
