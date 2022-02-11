<script>
import Loading from '@/components/Loading';
import { FLEET } from '@/config/types';
import { allHash } from '@/utils/promise';
import CollapsibleCard from '@/components/CollapsibleCard.vue';
import ResourceTable from '@/components/ResourceTable';

export default {
  name:       'ListGitRepo',
  components: {
    Loading,
    ResourceTable,
    CollapsibleCard,
  },

  async fetch() {
    const hash = await allHash({
      allBundles:      this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE }),
      gitRepos:        this.$store.dispatch('management/findAll', { type: FLEET.GIT_REPO }),
      fleetWorkspaces: this.$store.dispatch('management/findAll', { type: FLEET.WORKSPACE }),
    });

    this.allBundles = hash.allBundles;
    this.gitRepos = hash.gitRepos;
    this.fleetWorkspaces = hash.fleetWorkspaces;

    const workspaces = this.fleetWorkspaces.filter(ws => ws.repos.length);

    if (workspaces.length) {
      workspaces.forEach((ws) => {
        console.log('TYPE', ws.type);
        this.$set(this.isCollapsed, ws.id, false);
      });
    }

    console.log('WORKSPACES', workspaces);
  },

  data() {
    return {
      headers: [
        {
          name:          'name',
          labelKey:      'tableHeaders.repoName',
          value:         'nameDisplay',
          sort:          ['nameSort'],
          formatter:     'LinkDetail',
          canBeVariable: true,
        },
        {
          name:      'clustersReady',
          labelKey:  'tableHeaders.clustersReady',
          value:     'status.readyClusters',
          sort:      'status.readyClusters',
          search:    false,
        },
        {
          name:      'bundlesReady',
          labelKey:  'tableHeaders.bundlesReady',
          value:     'status.readyClusters',
          sort:      'status.readyClusters',
          search:    false,
        },
        {
          name:     'resourcesReady',
          labelKey: 'tableHeaders.resourcesReady',
          value:    'status.resourceCounts.ready',
          sort:     'status.resourceCounts.ready',
        }
      ],
      schema:          {},
      allBundles:      null,
      gitRepos:        null,
      fleetWorkspaces: null,
      isCollapsed:     {},
      getStartedLink:  {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  'fleet',
          resource: FLEET.GIT_REPO
        },
      }
    };
  },
  computed: {
    workspacesData() {
      return this.fleetWorkspaces.filter(ws => ws.repos.length);
    },
    emptyWorkspaces() {
      return this.fleetWorkspaces.filter(ws => !ws.repos || !ws.repos.length);
    }
  },
  methods: {
    parseTargetMode(row) {
      return row.targetInfo?.mode === 'clusterGroup' ? this.t('fleet.gitRepo.warningTooltip.clusterGroup') : this.t('fleet.gitRepo.warningTooltip.cluster');
    },
    badgeClass(area, row) {
      switch (area) {
      case 'clusters':
        if (row.clusterInfo?.ready === row.clusterInfo?.total && row.clusterInfo?.ready) {
          return 'green-badge';
        }

        return 'red-badge';
      case 'bundles':
        if (row.bundlesReady?.length === row.bundles.length && row.bundlesReady?.length) {
          return 'green-badge';
        }

        return 'red-badge';
      case 'resources':
        if (row.status?.resourceCounts?.desiredReady === row.status?.resourceCounts?.ready && row.status?.resourceCounts?.desiredReady) {
          return 'green-badge';
        }

        return 'red-badge';
      default:
        return {};
      }
    },
    toggleCollapse(val, key) {
      this.$set(this.isCollapsed, key, val);
    },
    toggleAll(action) {
      const val = action !== 'expand';

      Object.keys(this.isCollapsed).forEach((key) => {
        this.$set(this.isCollapsed, key, val);
      });
    }
  },
};
</script>

<template>
  <div class="fleet-dashboard">
    <Loading v-if="$fetchState.pending" />
    <div
      v-else-if="!gitRepos.length"
      class="fleet-empty-dashboard"
    >
      <i class="icon-fleet mb-30" />
      <h1>{{ t('fleet.dashboard.welcome') }}</h1>
      <p class="mb-30">
        <span>{{ t('fleet.dashboard.gitOpsScale') }}</span>
        <a href="https://rancher.com/support-maintenance-terms" target="_blank" rel="noopener noreferrer nofollow">
          {{ t('fleet.dashboard.learnMore') }} <i class="icon icon-external-link" />
        </a>
      </p>
      <h3 class="mb-30">
        {{ t('fleet.dashboard.noRepo', null, true) }}
      </h3>
      <n-link
        :to="getStartedLink"
        class="btn role-secondary"
      >
        {{ t('fleet.dashboard.getStarted') }}
      </n-link>
    </div>
    <div
      v-else
      class="fleet-dashboard-data"
    >
      <div class="title mb-20">
        <h1>
          <t k="fleet.dashboard.pageTitle" />
        </h1>
        <div>
          <button
            v-tooltip.bottom="'expand all cards'"
            type="button"
            class="btn role-primary"
            @click="toggleAll('expand')"
          >
            <i class="icon-chevron-down" />
            <i class="icon-chevron-down" />
          </button>
          <button
            v-tooltip.bottom="'collapse all cards'"
            type="button"
            class="btn role-primary"
            @click="toggleAll('collapse')"
          >
            <i class="icon-chevron-up" />
            <i class="icon-chevron-up" />
          </button>
        </div>
      </div>
      <CollapsibleCard
        v-for="(ws, index) in workspacesData"
        :key="ws.id"
        class="mb-40"
        :title="`${t('resourceDetail.masthead.workspace')}: ${ws.nameDisplay}`"
        :is-collapsed="isCollapsed[ws.id]"
        :fav-resource="ws.type"
        @toggleCollapse="toggleCollapse($event, ws.id)"
      >
        <template v-slot:header-right>
          <div class="header-icons">
            <p>
              <i class="icon icon-repository" />
              <span>{{ t('tableHeaders.repositories') }}: <span>{{ ws.counts.gitRepos }}</span></span>
            </p>
            <p>
              <i class="icon icon-storage" />
              <span>{{ t('tableHeaders.clusters') }}: <span>{{ ws.counts.clusters }}</span></span>
            </p>
            <p>
              <i class="icon icon-folder" />
              <span>{{ t('tableHeaders.clusterGroups') }}: <span>{{ ws.counts.clusterGroups }}</span></span>
            </p>
          </div>
        </template>
        <template v-slot:content>
          <ResourceTable
            v-bind="$attrs"
            :schema="schema"
            :headers="headers"
            :rows="ws.repos"
            key-field="_key"
            :search="false"
            :table-actions="false"
            v-on="$listeners"
          >
            <template #cell:clustersReady="{row}">
              <span
                class="cluster-count-info"
                :class="badgeClass('clusters', row)"
              >
                {{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}
              </span>
            </template>
            <template #cell:bundlesReady="{row}">
              <span
                class="cluster-count-info"
                :class="badgeClass('bundles', row)"
              >
                {{ row.bundlesReady.length }}/{{ row.bundles.length }}
              </span>
            </template>
            <template #cell:resourcesReady="{row}">
              <span
                class="cluster-count-info"
                :class="badgeClass('resources', row)"
              >
                {{ row.status.resourceCounts.ready }}/{{ row.status.resourceCounts.desiredReady }}
              </span>
            </template>

            <template #cell:target="{row}">
              {{ row.targetInfo.modeDisplay }}
            </template>
          </ResourceTable>
          <div
            v-if="(index === (workspacesData.length - 1) && emptyWorkspaces.length)"
            class="mt-20"
          >
            <div class="show-more-workspaces mb-20">
              <span>{{ t('fleet.dashboard.showMore', { count: emptyWorkspaces.length }) }}</span>
              <i class="icon-chevron-down" />
            </div>
            <div class="empty-workspaces-list">
              <p>{{ t('fleet.dashboard.thereIsMore', { count: emptyWorkspaces.length }) }}:&nbsp;</p>
              <p v-for="(ews, i) in emptyWorkspaces" :key="i">
                {{ ews.nameDisplay }}<span v-if="i != (emptyWorkspaces.length - 1)">,&nbsp;</span>
              </p>
            </div>
          </div>
        </template>
      </CollapsibleCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fleet-empty-dashboard {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100%;

  .icon-fleet {
    font-size: 100px;
    color: var(--disabled-text);
  }

  > p > span {
    color: var(--disabled-text);
  }
}

.fleet-dashboard-data {
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;

    > div {
      display: flex;
      align-items: center;
    }

    button {
      position: relative;

      &:last-child {
        margin-left: 10px;
      }

      i {
        position: absolute;
        left: 0;
        right: 0;

        &:first-child {
          top: 30%;
        }

        &:last-child {
          top: 40%;
        }
      }
    }
  }

  .cluster-count-info {
    padding: 4px 16px;
    border-radius: 16px;
    display: inline-block;
    color: var(--primary-text);

    &.red-badge {
      background-color: var(--error);
    }
    &.green-badge {
      background-color: var(--success);
    }
  }

  .header-icons {
    display: flex;
    align-items: center;

    p {
      margin-right: 30px;
      display: flex;
      align-items: center;

      > span {
        color: var(--disabled-text);

        > span {
          color: var(--body-text);
        }
      }

      i {
        color: var(--disabled-text);
        font-size: 20px;
        margin-right: 10px;
      }
    }
  }

  .show-more-workspaces {
    display: flex;
    align-items: center;
    color: var(--primary);

    i {
      margin-left: 8px;
    }
  }

  .empty-workspaces-list {
    display: flex;
    align-items: center;
    color: var(--darker);
  }
}
</style>
