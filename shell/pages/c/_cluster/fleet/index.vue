<script>
import { mapState } from 'vuex';
import { FLEET } from '@shell/config/types';
import { WORKSPACE } from '@shell/store/prefs';
import {
  getStateLabel,
  primaryDisplayStatusFromCount,
  STATES,
  STATES_ENUM,
} from '@shell/plugins/dashboard-store/resource-class';
import Loading from '@shell/components/Loading';
import CollapsibleCard from '@shell/components/CollapsibleCard.vue';
import ResourceTable from '@shell/components/ResourceTable';
import CompoundStatusBadge from '@shell/components/CompoundStatusBadge';
import { checkPermissions, checkSchemasForFindAllHash } from '@shell/utils/auth';
import { WORKSPACE_ANNOTATION } from '@shell/config/labels-annotations';
import { filterBy } from '@shell/utils/array';
import FleetNoWorkspaces from '@shell/components/fleet/FleetNoWorkspaces.vue';
import { NAME } from '@shell/config/product/fleet';
import { xOfy } from '@shell/utils/string';

export default {
  name:       'FleetDashboard',
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
      clusterGroups: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER_GROUP
      },
      allBundles: {
        inStoreType: 'management',
        type:        FLEET.BUNDLE,
        opt:         { excludeFields: ['metadata.managedFields', 'spec.resources'] },
      },
      gitRepos: {
        inStoreType: 'management',
        type:        FLEET.GIT_REPO,
      },
      fleetClusters: {
        inStoreType: 'management',
        type:        FLEET.CLUSTER,
      }
    }, this.$store);

    this.gitRepos = hash.gitRepos;
    this.fleetWorkspacesData = hash.fleetWorkspaces || [];

    try {
      const permissions = await checkPermissions({ workspaces: { type: FLEET.WORKSPACE }, gitRepos: { type: FLEET.GIT_REPO, schemaValidator: (schema) => schema.resourceMethods.includes('PUT') } }, this.$store.getters);

      this.permissions = permissions;
    } catch (e) {
      console.error(e); // eslint-disable-line no-console
    }
  },

  data() {
    return {
      admissableAreas: ['clusters', 'bundles', 'resources'],
      headers:         [
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
      return this.fleetWorkspaces.filter((ws) => ws.counts.gitRepos > 0);
    },
    emptyWorkspaces() {
      return this.fleetWorkspaces.filter((ws) => ws.counts.gitRepos === 0);
    },
    areAllCardsExpanded() {
      return Object.keys(this.isCollapsed).every((key) => !this.isCollapsed[key]);
    },
    gitReposCounts() {
      return this.gitRepos.reduce((prev, gitRepo) => {
        prev[gitRepo.id] = {
          bundles:   gitRepo.allBundlesStatuses,
          resources: gitRepo.allResourceStatuses,
        };

        return prev;
      }, {});
    },
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
    getStatusInfo(area, row, rowCounts) {
      const defaultStatusInfo = {
        badgeClass: `${ STATES[STATES_ENUM.NOT_READY].color } badge-class-default`,
        icon:       STATES[STATES_ENUM.NOT_READY].compoundIcon
      };

      // classes are defined in the themes SASS files...
      return this.getBadgeClassAndIcon(area, row, rowCounts) || defaultStatusInfo;
    },
    getBadgeClassAndIcon(area, row, rowCounts) {
      if (!this.admissableAreas.includes(area)) {
        return false;
      }

      let group;

      if (area === 'clusters') {
        const clusterInfo = row.clusterInfo;
        const state = clusterInfo.ready === clusterInfo.total ? STATES_ENUM.ACTIVE : STATES_ENUM.NOT_READY;

        return {
          badgeClass: `${ STATES[state].color } badge-class-area-${ area }`,
          icon:       STATES[state].compoundIcon
        };
      } else if (area === 'bundles') {
        group = rowCounts[row.id].bundles;
      } else if (area === 'resources') {
        group = rowCounts[row.id].resources;
      } else {
        // unreachable
        return false;
      }

      if (group.total === group.states.ready) {
        return {
          badgeClass: STATES[STATES_ENUM.ACTIVE].color,
          icon:       STATES[STATES_ENUM.ACTIVE].compoundIcon,
        };
      }
      const state = primaryDisplayStatusFromCount(group.states);

      return {
        badgeClass: STATES[state].color ? STATES[state].color : `${ STATES[STATES_ENUM.UNKNOWN].color } bg-unmapped-state`,
        icon:       STATES[state].compoundIcon ? STATES[state].compoundIcon : `${ STATES[STATES_ENUM.UNKNOWN].compoundIcon } unmapped-icon`
      };
    },
    getTooltipInfo(area, row, rowCounts) {
      if (!this.admissableAreas.includes(area)) {
        return {};
      }

      if (area === 'bundles') {
        return this.generateTooltipData(rowCounts[row.id].bundles.states);
      } else if (area === 'resources') {
        return this.generateTooltipData(rowCounts[row.id].resources.states);
      }

      return '';
    },
    generateTooltipData(infoObj) {
      return Object.keys(infoObj)
        .filter((key) => infoObj[key] > 0) // filter zero values
        .map((key) => `${ getStateLabel(key) }: ${ infoObj[key] }<br>`).join('');
    },
    getBadgeValue(area, row, rowCounts) {
      let value;

      if (!this.admissableAreas.includes(area)) {
        return 'N/A';
      }

      if (area === 'clusters') {
        value = `${ row.clusterInfo.ready }/${ row.clusterInfo.total }`;
      } else if (area === 'bundles') {
        const bundles = rowCounts[row.id].bundles;

        value = xOfy(bundles.states.ready || 0, bundles.total);
      } else if (area === 'resources') {
        const resources = rowCounts[row.id].resources;

        value = xOfy(resources.states.ready || 0, resources.total);
      }

      return value;
    },
    toggleCollapse(val, key) {
      this.isCollapsed[key] = val;
    },
    toggleAll(action) {
      const val = action !== 'expand';

      Object.keys(this.isCollapsed).forEach((key) => {
        this.isCollapsed[key] = val;
      });
    }
  },

  watch: {
    fleetWorkspaces(value) {
      value?.filter((ws) => ws.repos?.length).forEach((ws) => {
        this.isCollapsed[ws.id] = false;
      });
    }
  }
};
</script>

<template>
  <div>
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
      <template v-if="permissions.gitRepos">
        <h3 class="mb-30">
          {{ t('fleet.dashboard.noRepo', null, true) }}
        </h3>
        <router-link
          :to="getStartedLink"
          class="btn role-secondary"
        >
          {{ t('fleet.dashboard.getStarted') }}
        </router-link>
      </template>
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
        v-for="(ws, i) in workspacesData"
        :key="i"
        class="mt-20 mb-40"
        :title="`${t('resourceDetail.masthead.workspace')}: ${ws.nameDisplay}`"
        :is-collapsed="isCollapsed[ws.id]"
        :is-title-clickable="true"
        :data-testid="`collapsible-card-${ ws.id }`"
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
            :schema="schema"
            :headers="headers"
            :rows="ws.repos"
            key-field="_key"
            :search="false"
            :table-actions="false"
          >
            <template #cell:clustersReady="{row}">
              <span v-if="ws.type === 'namespace'"> - </span>
              <CompoundStatusBadge
                v-else
                data-testid="clusters-ready"
                :tooltip-text="getTooltipInfo('clusters', row, gitReposCounts)"
                :badge-class="getStatusInfo('clusters', row, gitReposCounts).badgeClass"
                :icon="getStatusInfo('clusters', row, gitReposCounts).icon"
                :value="getBadgeValue('clusters', row, gitReposCounts)"
              />
            </template>
            <template #cell:bundlesReady="{row}">
              <span v-if="ws.type === 'namespace'"> - </span>
              <CompoundStatusBadge
                v-else
                data-testid="bundles-ready"
                :tooltip-text="getTooltipInfo('bundles', row, gitReposCounts)"
                :badge-class="getStatusInfo('bundles', row, gitReposCounts).badgeClass"
                :icon="getStatusInfo('bundles', row, gitReposCounts).icon"
                :value="getBadgeValue('bundles', row, gitReposCounts)"
              />
            </template>
            <template #cell:resourcesReady="{row}">
              <CompoundStatusBadge
                data-testid="resources-ready"
                :tooltip-text="getTooltipInfo('resources', row, gitReposCounts)"
                :badge-class="getStatusInfo('resources', row, gitReposCounts).badgeClass"
                :icon="getStatusInfo('resources', row, gitReposCounts).icon"
                :value="getBadgeValue('resources', row, gitReposCounts)"
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
