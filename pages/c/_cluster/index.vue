<script>
import { isEmpty } from 'lodash';
import { get } from '@/utils/object';
import InfoBoxCluster from '@/components/InfoBoxCluster';
import InfoBox from '@/components/InfoBox';
import SortableTable from '@/components/SortableTable';
import DetailTop from '@/components/DetailTop';
import ClusterDisplayProvider from '@/components/ClusterDisplayProvider';
import { APP_ID as GATEKEEPER_APP_ID } from '@/config/chart/gatekeeper';
import { allHash } from '@/utils/promise';
import Poller from '@/utils/poller';
import {
  MESSAGE,
  NAME,
  NAMESPACE_NAME,
  REASON,
  ROLES,
  STATE,
} from '@/config/table-headers';
import { DESCRIPTION, SYSTEM_PROJECT } from '@/config/labels-annotations';
import { findAllConstraints } from '@/utils/gatekeeper/util';
import {
  EXTERNAL,
  EVENT,
  MANAGEMENT,
  METRIC,
  NODE,
  STEVE,
} from '@/config/types';

const METRICS_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  components: {
    DetailTop,
    ClusterDisplayProvider,
    InfoBox,
    InfoBoxCluster,
    SortableTable
  },

  async asyncData(ctx) {
    const { route, store } = ctx;
    const id = get(route, 'params.cluster');
    let gatekeeper = null;
    let gatekeeperEnabled = false;
    let cluster = null;

    if ( store.getters['isRancher'] ) {
      const projects = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.PROJECT });
      const targetSystemProject = projects.find(( proj ) => {
        const labels = proj.metadata?.labels || {};

        if ( labels[SYSTEM_PROJECT] === 'true' ) {
          return true;
        }
      });

      if (!isEmpty(targetSystemProject)) {
        const systemNamespace = targetSystemProject.metadata.name;

        try {
          gatekeeper = await store.dispatch('clusterExternal/find', {
            type: EXTERNAL.APP,
            id:   `${ systemNamespace }/${ GATEKEEPER_APP_ID }`,
          });
          if (!isEmpty(gatekeeper)) {
            gatekeeperEnabled = true;
          }
        } catch (err) {
          gatekeeperEnabled = false;
        }
      }

      cluster = await store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id });
    } else {
      cluster = await store.dispatch('management/find', { type: STEVE.CLUSTER, id });
    }

    return {
      constraints:       [],
      events:            [],
      nodeMetrics:       [],
      haveNodes:         !!store.getters['cluster/schemaFor'](NODE),
      haveNodeTemplates: !!store.getters['management/schemaFor'](MANAGEMENT.NODE_TEMPLATE),
      haveNodePools:     !!store.getters['management/schemaFor'](MANAGEMENT.NODE_POOL),
      nodePools:         [],
      nodeTemplates:     [],
      nodes:             [],
      cluster,
      gatekeeperEnabled,
    };
  },

  data() {
    const constraintHeaders = [
      NAME,
      {
        name:  'violations',
        label: 'Violations',
        value: 'status.totalViolations',
        sort:  'status.totalViolations',
        width: 65
      },
      STATE,
    ];

    const reason = { ...REASON, ...{ canBeVariable: true } };
    const message = { ...MESSAGE, ...{ canBeVariable: true } };
    const eventHeaders = [
      reason,
      {
        name:          'object',
        label:         'Object',
        value:         'displayInvolvedObject',
        sort:          ['involvedObject.kind', 'involvedObject.name'],
        canBeVariable: true,
        formatter:     'LinkDetail',
      },
      message,
      {
        align:         'center',
        name:          'date',
        label:         'Date',
        value:         'lastTimestamp',
        sort:          'lastTimestamp',
        formatter:     'LiveDate',
        formatterOpts: { addSuffix: true },
        width:         125
      },
    ];

    const nodeHeaders = [
      NAMESPACE_NAME,
      ROLES,
      STATE,
    ];

    return {
      metricPoller:      new Poller(this.loadMetrics, METRICS_POLL_RATE_MS, MAX_FAILURES),
      gatekeeperEnabled: false,
      constraintHeaders,
      eventHeaders,
      nodeHeaders,
    };
  },

  computed: {
    detailTopColumns() {
      const out = [];

      if ( this.haveNodeTemplates && this.haveNodePools ) {
        out.push({
          title:   this.$store.getters['i18n/t']('infoBoxCluster.provider'),
          name:    'cluster-provider',
        });
      }

      out.push({
        title:   this.$store.getters['i18n/t']('infoBoxCluster.version'),
        content: this.cluster.kubernetesVersion
      });

      if ( this.haveNodes ) {
        out.push({
          title:   this.$store.getters['i18n/t']('infoBoxCluster.nodes.total.label'),
          content: ( this.nodes || [] ).length
        });
      }

      out.push({
        title:   this.$store.getters['i18n/t']('infoBoxCluster.created'),
        name:    'live-date',
      });

      return out;
    },

    filteredNodes() {
      const allNodes = this.nodes || [];

      return allNodes.filter(node => !node.state.includes('healthy') && !node.state.includes('active'));
    },

    filteredConstraints() {
      const allConstraints = this.constraints || [];

      return allConstraints.filter(constraint => constraint?.status?.totalViolations > 0);
    },
  },

  mounted() {
    this.metricPoller.start();
  },

  async created() {
    const hash = {
      nodes:         this.fetchClusterResources(NODE),
      events:        this.fetchClusterResources(EVENT),
      constraints:   this.fetchConstraints(),
    };

    if ( this.haveNodeTemplates ) {
      hash.nodeTemplates = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_TEMPLATE });
    }

    if ( this.haveNodePools ) {
      hash.nodePools = this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE_POOL });
    }

    const res = await allHash(hash);

    for ( const k in res ) {
      this[k] = res[k];
    }
  },

  methods: {
    showActions() {
      this.$store.commit('action-menu/show', {
        resources: this.cluster,
        elem:      this.$refs['cluster-actions'],
      });
    },

    async fetchConstraints() {
      try {
        const rawConstraints = await findAllConstraints(this.$store);

        return rawConstraints
          .flat()
          .map((constraint) => {
            constraint.description = constraint.metadata.annotations[DESCRIPTION];

            return constraint;
          });
      } catch (err) {
        console.error(`Failed to fetch constraints:`, err); // eslint-disable-line no-console

        return [];
      }
    },

    async fetchClusterResources(type, opt = {}) {
      const schema = this.$store.getters['cluster/schemaFor'](type);

      if (schema) {
        try {
          const resources = await this.$store.dispatch('cluster/findAll', { type, opt });

          return resources;
        } catch (err) {
          console.error(`Failed fetching cluster resource ${ type } with error:`, err); // eslint-disable-line no-console

          return [];
        }
      }

      return [];
    },

    async loadMetrics() {
      this.nodeMetrics = await this.fetchClusterResources(METRIC.NODE, { force: true } );
    },
  },

  beforeRouteLeave(to, from, next) {
    this.metricPoller.stop();
    next();
  }
};
</script>

<template>
  <section>
    <header class="row">
      <div class="span-11">
        <h1>
          <t k="clusterIndexPage.header" :name="cluster.nameDisplay" />
        </h1>
        <div>
          <span v-if="cluster.spec.description">{{ cluster.spec.description }}</span>
        </div>
      </div>
      <div class="span-1 actions-span">
        <div class="actions">
          <button
            ref="cluster-actions"
            type="button"
            class="btn btn-sm role-multi-action actions"
            aria-haspopup="true"
            aria-expanded="false"
            @click="showActions"
          >
            <i class="icon icon-actions" />
          </button>
        </div>
      </div>
    </header>
    <DetailTop :columns="detailTopColumns" class="mb-20">
      <template v-slot:cluster-provider>
        <ClusterDisplayProvider :cluster="cluster" :node-templates="nodeTemplates" :node-pools="nodePools" />
      </template>
      <template v-slot:live-date>
        <LiveDate :value="cluster.metadata.creationTimestamp" :add-suffix="true" />
      </template>
    </DetailTop>
    <InfoBoxCluster
      :cluster="cluster"
      :metrics="nodeMetrics"
      :nodes="nodes"
      :node-templates="nodeTemplates"
      :node-pools="nodePools"
    />
    <div class="row">
      <div class="col span-6 equal-height">
        <InfoBox>
          <h5>
            <t k="clusterIndexPage.sections.nodes.label" />
          </h5>
          <div class="row mt-10">
            <SortableTable
              :rows="filteredNodes"
              :headers="nodeHeaders"
              :search="false"
              :table-actions="false"
              :row-actions="false"
              no-rows-key="clusterIndexPage.sections.nodes.noRows"
              key-field="id"
            />
          </div>
        </InfoBox>
      </div>
      <div class="col span-6 equal-height">
        <InfoBox>
          <h5>
            <t k="clusterIndexPage.sections.gatekeeper.label" />
          </h5>
          <div v-if="gatekeeperEnabled">
            <div class="row mt-10">
              <SortableTable
                :rows="filteredConstraints"
                :headers="constraintHeaders"
                :search="false"
                :table-actions="false"
                :row-actions="false"
                key-field="id"
                no-rows-key="clusterIndexPage.sections.gatekeeper.noRows"
              />
            </div>
          </div>
          <div v-else>
            <hr class="mt-35 mb-10" />
            <div class="mt-35 mb-35 text-center">
              <div>
                <t k="clusterIndexPage.sections.gatekeeper.disabled" />
              </div>
              <n-link
                :to="{ name: 'c-cluster-gatekeeper' }"
                role="link"
                type="button"
                class="btn role-link"
              >
                <a>
                  <t k="clusterIndexPage.sections.gatekeeper.buttonText" />
                </a>
              </n-link>
            </div>
          </div>
        </InfoBox>
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <InfoBox>
          <h5>
            <t k="clusterIndexPage.sections.events.label" />
          </h5>
          <div class="row mt-10">
            <SortableTable
              :rows="events"
              :headers="eventHeaders"
              key-field="id"
              :search="false"
              :table-actions="false"
              :row-actions="false"
              :paging="true"
              :rows-per-page="10"
              default-sort-by="date"
            />
          </div>
        </InfoBox>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
  .actions-span {
    align-self: center;
  }
</style>
