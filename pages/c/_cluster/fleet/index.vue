<script>
import Loading from '@/components/Loading';
import { FLEET } from '@/config/types';
import ResourceTable from '@/components/ResourceTable';
import Link from '@/components/formatter/Link';
import Shortened from '@/components/formatter/Shortened';
import {
  AGE,
  STATE,
  NAME,
  FLEET_SUMMARY
} from '@/config/table-headers';

export default {
  name:       'ListGitRepo',
  components: {
    Loading, ResourceTable, Link, Shortened
  },

  async fetch() {
    const store = this.$store;

    this.gitRepos = await store.dispatch(`management/findAll`, { type: FLEET.GIT_REPO });
    this.fleetWorkspaces = await store.dispatch(`management/findAll`, { type: FLEET.WORKSPACE });
  },

  data() {
    return {
      schema:          {},
      gitRepos:        null,
      fleetWorkspaces: null
    };
  },
  computed: {
    dashboardData() {
      const finalData = {};

      this.fleetWorkspaces.forEach((ws) => {
        const repos = this.gitRepos.filter(rep => rep.namespace === ws.id);

        if (repos.length) {
          if (!finalData[ws.id]) {
            finalData[ws.id] = [];
          }

          finalData[ws.id] = repos;
        }
      });

      return finalData;
    },
    headers() {
      const out = [
        STATE,
        NAME,
        {
          name:     'repo',
          labelKey: 'tableHeaders.repo',
          value:    'repoDisplay',
          sort:     'repoDisplay',
          search:   ['spec.repo', 'status.commit'],
        },
        {
          name:     'target',
          labelKey: 'tableHeaders.target',
          value:    'targetInfo.modeDisplay',
          sort:     ['targetInfo.modeDisplay', 'targetInfo.cluster', 'targetInfo.clusterGroup'],
        },
        {
          name:      'clustersReady',
          labelKey:  'tableHeaders.clustersReady',
          value:     'status.readyClusters',
          sort:      'status.readyClusters',
          search:    false,
        },
        FLEET_SUMMARY,
        AGE
      ];

      return out;
    },
  },
  methods: {
    parseTargetMode(row) {
      return row.targetInfo?.mode === 'clusterGroup' ? this.t('fleet.gitRepo.warningTooltip.clusterGroup') : this.t('fleet.gitRepo.warningTooltip.cluster');
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
      <ul>
        <li v-for="(ws, wsKey) in dashboardData" :key="wsKey">
          {{ wsKey }}
          <ul>
            <li v-for="(repo, ri) in ws" :key="ri">
              {{ repo.nameDisplay }}
            </li>
            <ResourceTable
              v-bind="$attrs"
              :schema="schema"
              :headers="headers"
              :rows="ws"
              key-field="_key"
              v-on="$listeners"
            >
              <template #cell:repo="{row}">
                <Link
                  :row="row"
                  :value="row.spec.repo"
                  label-key="repoDisplay"
                  before-icon-key="repoIcon"
                  url-key="spec.repo"
                />
                <template v-if="row.commitDisplay">
                  <div class="text-muted">
                    <Shortened long-value-key="status.commit" :row="row" :value="row.commitDisplay" />
                  </div>
                </template>
              </template>

              <template #cell:clustersReady="{row}">
                <span v-if="!row.clusterInfo" class="text-muted">&mdash;</span>
                <span v-else-if="row.clusterInfo.unready" class="text-warning">{{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}</span>
                <span v-else class="cluster-count-info">
                  {{ row.clusterInfo.ready }}/{{ row.clusterInfo.total }}
                  <i
                    v-if="!row.clusterInfo.total"
                    v-tooltip.bottom="parseTargetMode(row)"
                    class="icon icon-warning"
                  />
                </span>
              </template>

              <template #cell:target="{row}">
                {{ row.targetInfo.modeDisplay }}
              </template>
            </ResourceTable>
          </ul>
        </li>
      </ul>
    </section>
  </div>
</template>

<style lang="scss">
.cluster-count-info {
  display: flex;
  align-items: center;

  i {
    margin-left: 5px;
    font-size: 22px;
    color: var(--warning);
  }
}
</style>
