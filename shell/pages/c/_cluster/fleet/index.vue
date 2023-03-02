<script>
import { mapState } from 'vuex';
import { FLEET } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import { STATES_ENUM, STATES, getStateLabel } from '@shell/plugins/dashboard-store/resource-class';
import Loading from '@shell/components/Loading';
import CollapsibleCard from '@shell/components/CollapsibleCard.vue';
import ResourceTable from '@shell/components/ResourceTable';
import CompoundStatusBadge from '@shell/components/CompoundStatusBadge';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import { filterBy } from '@shell/utils/array';
import FleetNoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import { NAME } from '@shell/config/product/fleet';

export default {
  name:       'ListGitRepo',
  components: {
    Loading,
    ResourceTable,
    CollapsibleCard,
    CompoundStatusBadge,
    FleetNoWorkspaces
  },

  async fetch() {
    const hash = await checkSchemasForFindAllHash({
      fleetWorkspaces: {
        inStoreType:     'management',
        type:            FLEET.WORKSPACE,
        schemaValidator: (schema) => {
          return !!schema?.links?.collection;
        }
      },
      allBundles: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE,
      },
      gitRepos: {
        inStoreType: 'management',
        type:        FLEET.GIT_REPO,
      }
    }, this.$store);

    this.gitRepos = hash.gitRepos;
    this.fleetWorkspacesData = hash.fleetWorkspaces || [];

    try {
      const permissions = await checkPermissions({ workspaces: { type: FLEET.WORKSPACE }, gitRepos: { type: FLEET.GIT_REPO } }, this.$store.getters);

      this.permissions = permissions;
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
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
          name:     'clustersReady',
          labelKey: 'tableHeaders.clustersReady',
          value:    'status.readyClusters',
          sort:     'status.readyClusters',
          search:   false,
        },
        {
          name:     'bundlesReady',
          labelKey: 'tableHeaders.bundlesReady',
          value:    'status.readyClusters',
          sort:     'status.readyClusters',
          search:   false,
        },
        {
          name:     'resourcesReady',
          labelKey: 'tableHeaders.resourcesReady',
          value:    'status.resourceCounts.ready',
          sort:     'status.resourceCounts.ready',
        }
      ],
      schema:              {},
      allBundles:          [],
      gitRepos:            [],
      fleetWorkspacesData: [],
      isCollapsed:         {},
      permissions:         {},
      getStartedLink:      {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  NAME,
          resource: FLEET.GIT_REPO
        },
      }
    };
  },
  computed: {
    ...mapState(['workspace', 'allNamespaces']),
    fleetWorkspaces() {
      if (this.fleetWorkspacesData?.length) {
        return this.fleetWorkspacesData;
      }

      // When user doesn't have access to the workspaces fall back to namespaces

      return this.allNamespaces.filter((item) => {
        return item.metadata.annotations[WORKSPACE_ANNOTATION] === WORKSPACE;
      }).map(( obj ) => {
        const repos = filterBy(this.gitRepos, 'metadata.namespace', obj.id);

        return {
          ...obj,
          counts: {
            clusters:      '-',
            clusterGroups: '-',
            gitRepos:      repos.length
          },
          repos,
          nameDisplay: obj.id
        };
      });
    },
    workspacesData() {
      return this.fleetWorkspaces.filter(ws => ws.repos && ws.repos.length);
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
      this.$store.commit('updateWorkspace', { value, getters: this.$store.getters } );
      this.$store.dispatch('prefs/set', { key: WORKSPACE, value });

      this.$router.push({
        name:   'c-cluster-product-resource',
        params: {
          product:  NAME,
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
            badgeClass: STATES[STATES_ENUM.ACTIVE].color,
            icon:       STATES[STATES_ENUM.ACTIVE].compoundIcon
          };
        }

        return {
          badgeClass: `${ STATES[STATES_ENUM.NOT_READY].color } badge-class-area-clusters`,
          icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon
        };
      case 'bundles':
        if (row.bundles?.length && row.bundles?.every(bundle => bundle.state?.toLowerCase() === STATES_ENUM.ACTIVE)) {
          return {
            badgeClass: STATES[STATES_ENUM.ACTIVE].color ? STATES[STATES_ENUM.ACTIVE].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       STATES[STATES_ENUM.ACTIVE].compoundIcon ? STATES[STATES_ENUM.ACTIVE].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
          };
        }
        if (row.bundles?.length && row.bundles?.some(bundle => bundle.state?.toLowerCase() === STATES_ENUM.ERR_APPLIED)) {
          return {
            badgeClass: STATES[STATES_ENUM.ERR_APPLIED].color ? STATES[STATES_ENUM.ERR_APPLIED].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       STATES[STATES_ENUM.ERR_APPLIED].compoundIcon ? STATES[STATES_ENUM.ERR_APPLIED].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
          };
        }
        if (row.bundles?.length && row.bundles?.some(bundle => bundle.state?.toLowerCase() === STATES_ENUM.NOT_READY)) {
          return {
            badgeClass: STATES[STATES_ENUM.NOT_READY].color ? STATES[STATES_ENUM.NOT_READY].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon ? STATES[STATES_ENUM.NOT_READY].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
          };
        }

        if (row.bundlesReady?.length === row.bundles?.length && row.bundlesReady && row.bundles?.length) {
          return {
            badgeClass: STATES[STATES_ENUM.ACTIVE].color,
            icon:       STATES[STATES_ENUM.ACTIVE].compoundIcon
          };
        }

        return {
          badgeClass: `${ STATES[STATES_ENUM.NOT_READY].color } badge-class-area-bundles`,
          icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon
        };
      case 'resources':
        if (row.status?.resources?.length && row.status?.resources?.every(resource => resource.state?.toLowerCase() === STATES_ENUM.ACTIVE)) {
          return {
            badgeClass: STATES[STATES_ENUM.ACTIVE].color ? STATES[STATES_ENUM.ACTIVE].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       STATES[STATES_ENUM.ACTIVE].compoundIcon ? STATES[STATES_ENUM.ACTIVE].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
          };
        }
        if (row.status?.resources?.length && row.status?.resources?.some(resource => resource.state?.toLowerCase() === STATES_ENUM.ERR_APPLIED)) {
          return {
            badgeClass: STATES[STATES_ENUM.ERR_APPLIED].color ? STATES[STATES_ENUM.ERR_APPLIED].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       STATES[STATES_ENUM.ERR_APPLIED].compoundIcon ? STATES[STATES_ENUM.ERR_APPLIED].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
          };
        }
        if (row.status?.resources?.length && row.status?.resources?.some(resource => resource.state?.toLowerCase() === STATES_ENUM.NOT_READY)) {
          return {
            badgeClass: STATES[STATES_ENUM.NOT_READY].color ? STATES[STATES_ENUM.NOT_READY].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
            icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon ? STATES[STATES_ENUM.NOT_READY].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
          };
        }

        if (row.status?.resourceCounts?.desiredReady === row.status?.resourceCounts?.ready && row.status?.resourceCounts?.desiredReady) {
          return {
            badgeClass: STATES[STATES_ENUM.ACTIVE].color,
            icon:       STATES[STATES_ENUM.ACTIVE].compoundIcon
          };
        }

        return {
          badgeClass: `${ STATES[STATES_ENUM.NOT_READY].color } badge-class-area-resources`,
          icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon
        };
      default:
        return {
          badgeClass: `${ STATES[STATES_ENUM.NOT_READY].color } badge-class-default`,
          icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon
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

  watch: {
    fleetWorkspaces(value) {
      value?.filter(ws => ws.repos?.length).forEach((ws) => {
        this.$set(this.isCollapsed, ws.id, false);
      });
    }
  }
};
</script>

<template>
  <div class="fleet-dashboard">
    <Loading v-if="$fetchState.pending" />
    <!-- no git repos -->
    <FleetNoWorkspaces
      v-else-if="!fleetWorkspacesData.length"
      :can-view="permissions.workspaces"
    />
    <div
      v-else-if="!gitRepos.length"
      class="fleet-empty-dashboard"
    >
      <i class="icon-fleet mb-30" />
      <h1>{{ t('fleet.dashboard.welcome') }}</h1>
      <p class="mb-30">
        <span>{{ t('fleet.dashboard.gitOpsScale') }}</span>
        <a
          :href="t('fleet.dashboard.learnMoreLink')"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
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
        <p
          v-for="(ews, i) in emptyWorkspaces"
          :key="i"
        >
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
              <span v-if="ws.type === 'namespace'"> - </span>
              <CompoundStatusBadge
                v-else
                :tooltip-text="getTooltipInfo('clusters', row)"
                :badge-class="getStatusInfo('clusters', row).badgeClass"
                :icon="getStatusInfo('clusters', row).icon"
                :value="`${ row.clusterInfo.ready }/${ row.clusterInfo.total }`"
              />
            </template>
            <template #cell:bundlesReady="{row}">
              <span v-if="ws.type === 'namespace'"> - </span>
              <CompoundStatusBadge
                v-else
                :tooltip-text="getTooltipInfo('bundles', row)"
                :badge-class="getStatusInfo('bundles', row).badgeClass"
                :icon="getStatusInfo('bundles', row).icon"
                :value="`${ row.bundlesReady.length || 0 }/${ row.bundles.length }`"
              />
            </template>
            <template #cell:resourcesReady="{row}">
              <CompoundStatusBadge
                :tooltip-text="getTooltipInfo('resources', row)"
                :badge-class="getStatusInfo('resources', row).badgeClass"
                :icon="getStatusInfo('resources', row).icon"
                :value="`${ row.status.resourceCounts.ready }/${ row.status.resourceCounts.desiredReady }`"
              />
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
.fleet-dashboard {
  min-height: 100vh;
}
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
