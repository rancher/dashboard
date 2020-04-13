<script>
import { isEmpty } from 'lodash';
import { get } from '@/utils/object';
import InfoBoxCluster from '@/components/InfoBoxCluster';
import InfoBox from '@/components/InfoBox';
import SortableTable from '@/components/SortableTable';
import {
  MESSAGE,
  NAME,
  NAMESPACE_NAME,
  REASON,
  ROLES,
  STATE,
} from '@/config/table-headers';
import { DESCRIPTION } from '@/config/labels-annotations';
import { findAllConstraints } from '@/utils/gatekeeper/util';
import {
  MANAGEMENT,
  EVENT,
  NODE,
  METRIC,
  EXTERNAL,
  GATEKEEPER,
  SYSTEM_PROJECT_LABEL,
} from '@/config/types';
import { allHash } from '@/utils/promise';

export default {
  components: {
    InfoBox,
    InfoBoxCluster,
    SortableTable
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
      pollingTimeoutId:  null,
      gatekeeperEnabled: false,
      constraintHeaders,
      eventHeaders,
      nodeHeaders,
    };
  },

  computed: {
    filteredNodes() {
      const allNodes = ( this.nodes || [] ).slice();

      return allNodes.filter(node => !node.state.includes('healthy') && !node.state.includes('active'));
    },
    filteredConstraints() {
      const allConstraints = ( this.constraints || [] ).slice();

      return allConstraints.filter(constraint => constraint?.status?.totalViolations > 0);
    },
  },

  async asyncData(ctx) {
    const { route, store } = ctx;
    const id = get(route, 'params.cluster');
    let gatekeeper = null;
    let gatekeeperEnabled = false;

    const projects = await store.dispatch('clusterExternal/findAll', { type: EXTERNAL.PROJECT });
    const targetSystemProject = projects.find(( proj ) => {
      const labels = proj.metadata?.labels || {};

      if ( labels[SYSTEM_PROJECT_LABEL] === 'true' ) {
        return true;
      }
    });

    if (!isEmpty(targetSystemProject)) {
      const systemNamespace = targetSystemProject.metadata.name;

      try {
        gatekeeper = await store.dispatch('clusterExternal/find', {
          type: EXTERNAL.APP,
          id:   `${ systemNamespace }/${ GATEKEEPER.APP_ID }`,
        });
        if (!isEmpty(gatekeeper)) {
          gatekeeperEnabled = true;
        }
      } catch (err) {
        gatekeeperEnabled = false;
      }
    }

    const cluster = await store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id });

    return {
      constraints:       [],
      nodes:             [],
      events:            [],
      nodeMetrics:       [],
      pollingErrorCount: 0,
      cluster,
      gatekeeperEnabled,
    };
  },

  async created() {
    const resourcesHash = await allHash({
      allNodes:       this.fetchClusterResources(NODE),
      allEvents:      this.fetchClusterResources(EVENT),
      rawConstraints: this.fetchConstraints(),
    });

    this.constraints = resourcesHash.rawConstraints;
    this.events = resourcesHash.allEvents;
    this.nodes = resourcesHash.allNodes;
  },

  mounted() {
    const schema = this.$store.getters['cluster/schemaFor'](METRIC.NODE);

    if (schema) {
      this.pollMetrics();
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
        console.error(`Failed to fetch constraints:`, err);

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
          console.error(`Failed fetching cluster resource ${ type } with error:`, err);

          return [];
        }
      }

      return [];
    },

    async pollMetrics() {
      let errCount = this.pollingErrorCount;

      try {
        const metrics = await this.fetchClusterResources(METRIC.NODE, { force: true } );

        this.nodeMetrics = metrics;
        this.pollingTimeoutId = setTimeout(this.pollMetrics, 30000);
      } catch (err) {
        console.error(`Error polling metrics`, err);

        if (errCount < 3) {
          this.pollingErrorCount = errCount++;
          this.pollingTimeoutId = setTimeout(this.pollMetrics, 30000);
        } else {
          this.pollingErrorCount = 0;
        }
      }
    },
  },

  beforeRouteLeave(to, from, next) {
    if (this.pollingTimeoutId) {
      clearTimeout(this.pollingTimeoutId);
    }
    next();
  },
};
</script>

<template>
  <section>
    <header>
      <h1>
        <t k="clusterIndexPage.header" :name="cluster.nameDisplay" />
      </h1>
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
    </header>
    <InfoBoxCluster
      :cluster="cluster"
      :metrics="nodeMetrics"
      :nodes="nodes"
    />
    <div class="row">
      <div class="col span-6 equal-height">
        <InfoBox>
          <label>
            <t k="clusterIndexPage.sections.nodes.label" />
          </label>
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
          <label>
            <t k="clusterIndexPage.sections.gatekeeper.label" />
          </label>
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
          <label>
            <t k="clusterIndexPage.sections.events.label" />
          </label>
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
