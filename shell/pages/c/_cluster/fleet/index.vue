<script>
import { mapState } from 'vuex';
import { FLEET } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import { STATES_ENUM, STATES, getStateLabel } from '@shell//plugins/core-store/resource-class';
import { allHash } from '@shell/utils/promise';
import Loading from '@shell/components/Loading';
import CollapsibleCard from '@shell/components/CollapsibleCard.vue';
import ResourceTable from '@shell/components/ResourceTable';

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

    // init cards collapse flags
    const workspaces = this.fleetWorkspaces.filter(ws => ws.repos.length);

    if (workspaces.length) {
      workspaces.forEach((ws) => {
        this.$set(this.isCollapsed, ws.id, false);
      });
    }
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
    ...mapState(['workspace']),
    workspacesData() {
      return this.fleetWorkspaces.filter(ws => ws.repos.length);
    },
    emptyWorkspaces() {
      return this.fleetWorkspaces.filter(ws => !ws.repos || !ws.repos.length);
    },
    areAllCardsExpanded() {
      return Object.keys(this.isCollapsed).every(key => !this.isCollapsed[key]);
    }
  },
  methods: {
    setWorkspaceFilterAndLinkToGitRepo(value) {
      this.$store.commit('updateWorkspace', { value });
      this.$store.dispatch('prefs/set', { key: WORKSPACE, value });

      this.$router.push({
        name:   'c-cluster-product-resource',
        params: {
          product:  'fleet',
          resource: FLEET.GIT_REPO
        },
      });
    },
    getStatusInfo(area, row) {
      // classes are defined in the themes SASS files...
      switch (area) {
      case 'clusters':
        if (row.clusterInfo?.ready === row.clusterInfo?.total && row.clusterInfo?.ready) {
          return {
            badgeClass: `bg-${ STATES[STATES_ENUM.ACTIVE].color }`,
            icon:       'checkmark'
          };
        }

        return {
          badgeClass: `bg-${ STATES[STATES_ENUM.NOT_READY].color } badge-class-area-clusters`,
          icon:       'warning'
        };
      case 'bundles':
        if (row.bundles?.length && row.bundles?.every(bundle => bundle.state?.toLowerCase() === STATES_ENUM.ACTIVE)) {
          return {
            badgeClass: STATES[STATES_ENUM.ACTIVE].color ? `bg-${ STATES[STATES_ENUM.ACTIVE].color }` : `bg-${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       'checkmark'
          };
        }
        if (row.bundles?.length && row.bundles?.some(bundle => bundle.state?.toLowerCase() === STATES_ENUM.ERR_APPLIED)) {
          return {
            badgeClass: STATES[STATES_ENUM.ERR_APPLIED].color ? `bg-${ STATES[STATES_ENUM.ERR_APPLIED].color }` : `bg-${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       'error'
          };
        }
        if (row.bundles?.length && row.bundles?.some(bundle => bundle.state?.toLowerCase() === STATES_ENUM.NOT_READY)) {
          return {
            badgeClass: STATES[STATES_ENUM.NOT_READY].color ? `bg-${ STATES[STATES_ENUM.NOT_READY].color }` : `bg-${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       'warning'
          };
        }

        if (row.bundlesReady?.length === row.bundles?.length && row.bundlesReady && row.bundles?.length) {
          return {
            badgeClass: `bg-${ STATES[STATES_ENUM.ACTIVE].color }`,
            icon:       'checkmark'
          };
        }

        return {
          badgeClass: `bg-${ STATES[STATES_ENUM.NOT_READY].color } badge-class-area-bundles`,
          icon:       'warning'
        };
      case 'resources':
        if (row.status?.resources?.length && row.status?.resources?.every(resource => resource.state?.toLowerCase() === STATES_ENUM.ACTIVE)) {
          return {
            badgeClass: STATES[STATES_ENUM.ACTIVE].color ? `bg-${ STATES[STATES_ENUM.ACTIVE].color }` : `bg-${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       'checkmark'
          };
        }
        if (row.status?.resources?.length && row.status?.resources?.some(resource => resource.state?.toLowerCase() === STATES_ENUM.ERR_APPLIED)) {
          return {
            badgeClass: STATES[STATES_ENUM.ERR_APPLIED].color ? `bg-${ STATES[STATES_ENUM.ERR_APPLIED].color }` : `bg-${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       'error'
          };
        }
        if (row.status?.resources?.length && row.status?.resources?.some(resource => resource.state?.toLowerCase() === STATES_ENUM.NOT_READY)) {
          return {
            badgeClass: STATES[STATES_ENUM.NOT_READY].color ? `bg-${ STATES[STATES_ENUM.NOT_READY].color }` : `bg-${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       'warning'
          };
        }

        if (row.status?.resourceCounts?.desiredReady === row.status?.resourceCounts?.ready && row.status?.resourceCounts?.desiredReady) {
          return {
            badgeClass: `bg-${ STATES[STATES_ENUM.ACTIVE].color }`,
            icon:       'checkmark'
          };
        }

        return {
          badgeClass: `bg-${ STATES[STATES_ENUM.NOT_READY].color } badge-class-area-resources`,
          icon:       'warning'
        };
      default:
        return {
          badgeClass: `bg-${ STATES[STATES_ENUM.NOT_READY].color } badge-class-default`,
          icon:       'warning'
        };
      }
    },
    getTooltipInfo(area, row) {
      switch (area) {
      case 'clusters':
        if (row.clusterInfo?.total) {
          return `Ready: ${ row.clusterInfo?.ready }<br>Total: ${ row.clusterInfo?.total }`;
        }

        return '';
      case 'bundles':
        if (row.bundles?.length) {
          return this.generateTooltipData(row.bundles);
        }

        return '';
      case 'resources':
        if (row.status?.resources?.length) {
          return this.generateTooltipData(row.status?.resources);
        }

        return '';
      default:
        return {};
      }
    },
    generateTooltipData(data) {
      const infoObj = {};
      let tooltipData = '';

      data.forEach((item) => {
        if (!infoObj[item.state]) {
          infoObj[item.state] = 0;
        }

        infoObj[item.state]++;
      });

      Object.keys(infoObj).forEach((key) => {
        tooltipData += `${ getStateLabel(key) }: ${ infoObj[key] }<br>`;
      });

      return tooltipData;
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
    <!-- no git repos -->
    <div
      v-else-if="!gitRepos.length"
      class="fleet-empty-dashboard"
    >
      <i class="icon-fleet mb-30" />
      <h1>{{ t('fleet.dashboard.welcome') }}</h1>
      <p class="mb-30">
        <span>{{ t('fleet.dashboard.gitOpsScale') }}</span>
        <a :href="t('fleet.dashboard.learnMoreLink')" target="_blank" rel="noopener noreferrer nofollow">
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
    <!-- fleet dashboard with repos -->
    <div
      v-else
      class="fleet-dashboard-data"
    >
      <div class="title">
        <h1>
          <t k="fleet.dashboard.pageTitle" />
        </h1>
        <div>
          <p
            v-if="areAllCardsExpanded"
            @click="toggleAll('collapse')"
          >
            {{ t('fleet.dashboard.collapseAll') }}
          </p>
          <p
            v-else
            @click="toggleAll('expand')"
          >
            {{ t('fleet.dashboard.expandAll') }}
          </p>
        </div>
      </div>
      <div
        v-if="emptyWorkspaces.length"
        class="title-footnote"
      >
        <p>{{ t('fleet.dashboard.thereIsMore', { count: emptyWorkspaces.length }) }}:&nbsp;</p>
        <p v-for="(ews, i) in emptyWorkspaces" :key="i">
          {{ ews.nameDisplay }}<span v-if="i != (emptyWorkspaces.length - 1)">,&nbsp;</span>
        </p>
      </div>
      <CollapsibleCard
        v-for="ws in workspacesData"
        :key="ws.id"
        class="mt-20 mb-40"
        :title="`${t('resourceDetail.masthead.workspace')}: ${ws.nameDisplay}`"
        :is-collapsed="isCollapsed[ws.id]"
        :is-title-clickable="true"
        @toggleCollapse="toggleCollapse($event, ws.id)"
        @titleClick="setWorkspaceFilterAndLinkToGitRepo(ws.id)"
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
              <div
                v-tooltip.bottom="getTooltipInfo('clusters', row)"
                class="cluster-count-info"
                :class="getStatusInfo('clusters', row).badgeClass"
              >
                <i :class="`icon-${getStatusInfo('clusters', row).icon}`" />
                <span>{{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}</span>
              </div>
            </template>
            <template #cell:bundlesReady="{row}">
              <div
                v-tooltip.bottom="getTooltipInfo('bundles', row)"
                class="cluster-count-info"
                :class="getStatusInfo('bundles', row).badgeClass"
              >
                <i :class="`icon-${getStatusInfo('bundles', row).icon}`" />
                <span>{{ row.bundlesReady.length || 0 }}/{{ row.bundles.length }}</span>
              </div>
            </template>
            <template #cell:resourcesReady="{row}">
              <div
                v-tooltip.bottom="getTooltipInfo('resources', row)"
                class="cluster-count-info"
                :class="getStatusInfo('resources', row).badgeClass"
              >
                <i :class="`icon-${getStatusInfo('resources', row).icon}`" />
                <span>{{ row.status.resourceCounts.ready }}/{{ row.status.resourceCounts.desiredReady }}</span>
              </div>
            </template>

            <template #cell:target="{row}">
              {{ row.targetInfo.modeDisplay }}
            </template>
          </ResourceTable>
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

      p{
        color: var(--primary);

        &:hover {
          text-decoration: underline;
          cursor: pointer;
        }
      }
    }
  }

  .title-footnote {
    display: flex;
    align-items: center;
    color: var(--darker);
  }

  .cluster-count-info {
    padding: 4px 12px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    width: fit-content;
    cursor: default;

    i {
      font-size: 16px;
      margin-right: 6px;
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
}
</style>
