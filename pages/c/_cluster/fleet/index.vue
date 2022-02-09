<script>
import Loading from '@/components/Loading';
import { FLEET } from '@/config/types';
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
    const store = this.$store;

    this.allBundles = await this.$store.dispatch('management/findAll', { type: FLEET.BUNDLE });
    this.gitRepos = await store.dispatch(`management/findAll`, { type: FLEET.GIT_REPO });
    this.fleetWorkspaces = await store.dispatch(`management/findAll`, { type: FLEET.WORKSPACE });
  },

  data() {
    return {
      schema:          {},
      allBundles:      null,
      gitRepos:        null,
      fleetWorkspaces: null,
    };
  },
  computed: {
    workspacesData() {
      const finalData = {};

      this.fleetWorkspaces.forEach((ws) => {
        finalData[ws.id] = {
          workspace: ws,
          repos:     []
        };

        const repos = this.gitRepos.filter(rep => rep.namespace === ws.id);

        if (repos.length) {
          repos.forEach((repo, i) => {
            const bundles = this.allBundles.filter(bundle => bundle.nameDisplay.includes(repo.nameDisplay));

            repos[i].bundles = bundles;
            repos[i].bundlesReady = bundles.filter(bundle => bundle.state === 'active');
          });

          finalData[ws.id].repos = repos;
        }
      });

      console.log('FINALDATA', finalData);

      return finalData;
    },
    headers() {
      const out = [
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
      ];

      return out;
    },
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
    }
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <section v-else class="fleet-dashboard">
      <header>
        <div class="title">
          <h1>
            <t k="fleet.dashboard.pageTitle" />
          </h1>
        </div>
      </header>
      <CollapsibleCard
        v-for="(ws, wsKey) in workspacesData"
        :key="wsKey"
        class="mb-40"
        :title="`${t('resourceDetail.masthead.workspace')}: ${wsKey}`"
      >
        <template v-slot:header-right>
          <div class="header-icons">
            <p>
              <i class="icon-repository" />
              <span>{{ t('tableHeaders.repositories') }}: <span>{{ ws.workspace.counts.gitRepos }}</span></span>
            </p>
            <p>
              <i class="icon-storage" />
              <span>{{ t('tableHeaders.clusters') }}: <span>{{ ws.workspace.counts.clusters }}</span></span>
            </p>
            <p>
              <i class="icon-folder" />
              <span>{{ t('tableHeaders.clusterGroups') }}: <span>{{ ws.workspace.counts.clusterGroups }}</span></span>
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
        </template>
      </CollapsibleCard>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.cluster-count-info {
  padding: 5px 20px;
  border-radius: 20px;
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
</style>
