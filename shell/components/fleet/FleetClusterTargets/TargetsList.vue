<script lang="ts">
import { PropType } from 'vue';
import { Cluster } from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { RcTag, RcCounterBadge } from '@components/Pill';

export default {
  name: 'FleetTargetsList',

  components: { RcTag, RcCounterBadge },

  props: {
    clusters: {
      type:    Array as PropType<Cluster[]>,
      default: () => [],
    },

    emptyLabel: {
      type:    String,
      default: '',
    },

    compact: {
      type:    Boolean,
      default: false
    },
  },

  computed: {
    clustersRenderList() {
      return this.clusters.map(({ nameDisplay, name, detailLocation }) => ({
        name: nameDisplay || name,
        detailLocation,
      }));
    },
  },
};
</script>

<template>
  <div
    class="targets-list-main"
    :class="{ 'compact': compact }"
  >
    <h3
      v-if="!compact"
      class="m-0"
    >
      {{ t('fleet.clusterTargets.rules.matching.title', { n: clustersRenderList.length }) }}
    </h3>
    <div
      v-else
      class="compact-title"
    >
      <h3>{{ t('fleet.clusterTargets.rules.matching.selectedClusters') }}</h3>
      <RcCounterBadge
        :count="clustersRenderList.length"
        type="inactive"
      />
    </div>

    <template v-if="compact">
      <div class="targets-list-chips">
        <RcTag
          v-for="cluster in clustersRenderList"
          :key="cluster.name"
          type="inactive"
          class="do-not-shrink"
        >
          {{ cluster.name }}
        </RcTag>
        <span
          v-if="!clustersRenderList.length"
          class="text-label"
        >
          {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
        </span>
      </div>
    </template>

    <template v-else>
      <div class="targets-list-list">
        <span
          v-for="cluster in clustersRenderList"
          :key="cluster.name"
          class="row"
        >
          <router-link
            :to="cluster.detailLocation"
            target="_blank"
            class="link-main"
          >
            {{ cluster.name }}&nbsp;<i
              class="link-icon icon icon-external-link"
              aria-hidden="true"
            />
          </router-link>
        </span>
        <span
          v-if="!clustersRenderList.length"
          class="text-label"
        >
          {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
        </span>
      </div>
    </template>
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
    gap: var(--gap-md);

    &.compact {
      background-color: var(--body-bg);
      max-height: none;

      .targets-list-list {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .row {
          line-height: 24px;
        }
      }
    }

    .compact-title {
      display: flex;
      align-items: center;
      gap: var(--gap);

      h3 {
        margin: 0;
      }
    }
  }
  .targets-list-list {
    overflow-y: auto;
  }
  .link-main{
    word-spacing: 15px;
    line-height: 17px;
  }
  .link-icon {
    margin-left: -14px;
    display: none;
  }
  .link-main:hover .link-icon {
    display: inline;
  }
  .targets-list-chips {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    align-items: flex-start;
    flex: 1;
    min-height: 0;
    overflow-y: auto;

    .do-not-shrink {
      flex-shrink: 0;
    }
  }

</style>
