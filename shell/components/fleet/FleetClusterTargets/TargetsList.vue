<script lang="ts">
import { PropType } from 'vue';
import { Cluster } from '@shell/components/fleet/FleetClusterTargets/index.vue';
import { RcTag, RcCounterBadge } from '@components/Pill';
import { FLEET } from '@shell/config/types';

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
      default: ''
    },

    isAll: {
      type:    Boolean,
      default: false
    },

    compact: {
      type:    Boolean,
      default: false
    },

    namespace: {
      type:    String,
      default: ''
    },
  },

  data() {
    return { showAllClusters: false };
  },

  computed: {
    clustersRenderList() {
      return this.clusters.map(({ nameDisplay, name, detailLocation }) => ({
        name: nameDisplay || name,
        detailLocation,
      }));
    },

    workspaceRoute() {
      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  '_',
          product:  'fleet',
          resource: FLEET.WORKSPACE,
          id:       this.namespace,
        },
      };
    },
  },
};
</script>

<template>
  <div
    class="targets-list-main"
    :class="{ 'compact': compact, 'compact-bg': compact && !isAll, 'is-all': isAll }"
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
        :class="{ 'badge-white': isAll }"
        type="inactive"
      />
    </div>

    <template v-if="isAll && compact">
      <a
        v-if="!showAllClusters"
        href="#"
        class="view-all-link"
        @click.prevent="showAllClusters = true"
      >
        {{ t('fleet.clusterTargets.rules.matching.viewAllClusters') }}
      </a>
      <div
        v-else
        class="targets-list-chips"
      >
        <RcTag
          v-for="(cluster, i) in clustersRenderList"
          :key="i"
          type="active"
        >
          <router-link
            :to="cluster.detailLocation"
            target="_blank"
            class="chip-link"
          >
            {{ cluster.name }}&nbsp;<i class="icon icon-external-link chip-icon" />
          </router-link>
        </RcTag>
        <span
          v-if="!clustersRenderList.length"
          class="text-label"
        >
          {{ emptyLabel || t('fleet.clusterTargets.rules.matching.empty') }}
        </span>
      </div>
      <a
        v-if="showAllClusters"
        href="#"
        class="view-all-link"
        @click.prevent="showAllClusters = false"
      >
        {{ t('fleet.clusterTargets.rules.matching.hideAllClusters') }}
      </a>
      <div class="workspace-footer">
        <span class="workspace-label">{{ t('fleet.clusterTargets.rules.matching.workspace') }}</span>
        <router-link
          :to="workspaceRoute"
          target="_blank"
          class="link-main"
        >
          {{ namespace }}&nbsp;<i class="link-icon icon icon-external-link" />
        </router-link>
      </div>
    </template>

    <template v-else-if="compact">
      <div class="targets-list-chips">
        <RcTag
          v-for="(cluster, i) in clustersRenderList"
          :key="i"
          type="active"
        >
          <router-link
            :to="cluster.detailLocation"
            target="_blank"
            class="chip-link"
          >
            {{ cluster.name }}&nbsp;<i class="icon icon-external-link chip-icon" />
          </router-link>
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
          v-for="(cluster, i) in clustersRenderList"
          :key="i"
          class="row"
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
    gap: 16px;
    max-height: 320px;

    &.is-all {
      max-height: 500px;

      .workspace-footer {
        line-height: 20px;

        .workspace-label {
          margin-right: 4px;
        }
      }
    }

    &.compact-bg {
      background-color: var(--body-bg);
      min-height: 500px;
      max-height: none;
    }

    &.compact {
      .targets-list-content {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

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
      gap: 8px;

      h3 {
        margin: 0;
      }

      :deep(.badge-white.rc-counter-badge) {
        background: var(--body-bg);
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
    gap: 8px;
    align-items: flex-start;
    max-height: 90vh;
    overflow: auto;

    :deep(.rc-tag) {
      flex-shrink: 0;
    }
  }

  .chip-icon {
    font-size: 11px;
    display: none;
  }
  .chip-link:hover .chip-icon {
    display: inline;
  }
  .chip-link {
    text-decoration: none;
    color: inherit;
  }

  .view-all-link {
    margin-top: 8px;
  }
</style>
