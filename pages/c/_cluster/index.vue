<script>
// import { isEmpty } from 'lodash';
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
  TYPE,
} from '@/config/table-headers';
import { DESCRIPTION } from '@/config/labels-annotations';
import { findAllConstraints } from '@/utils/gatekeeper/util';
import { MANAGEMENT, EVENT, NODE, METRIC } from '@/config/types';
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
        name:  'Violations',
        label: 'Violations',
        value: 'status.totalViolations',
        sort:  'status.totalViolations',
        width: 65
      },
      STATE,
    ];

    const reason = { ...REASON, ...{ width: 100 } };
    const type = { ...TYPE, ...{ width: 100 } };
    const eventHeaders = [
      NAMESPACE_NAME,
      type,
      reason,
      {
        name:  'Object',
        label: 'Object',
        value: 'involvedObject.kind',
        sort:  'involvedObject.kind',
        width: 100
      },
      MESSAGE,
      {
        name:      'Last Seen',
        label:     'Last Seen',
        value:     'lastTimestamp',
        sort:      'lastTimestamp',
        formatter: 'Date',
        width:     125
      },
    ];

    const nodeHeaders = [
      NAMESPACE_NAME,
      ROLES,
      STATE,
    ];

    return {
      pollingTimeoutId: null,
      constraintHeaders,
      eventHeaders,
      nodeHeaders,
    };
  },

  async asyncData(ctx) {
    const { route, store } = ctx;
    const id = get(route, 'params.cluster');

    const cluster = await store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id });

    return {
      constraints:       [],
      nodes:             [],
      events:            [],
      nodeMetrics:       [],
      pollingErrorCount: 0,
      cluster,
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
    this.pollMetrics();
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
      try {
        const resources = await this.$store.dispatch('cluster/findAll', { type, opt });

        return resources;
      } catch (err) {
        console.error(`Failed fetching cluster resource ${ type } with error:`, err);

        return [];
      }
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
          @click="showActions"
        >
          <i class="icon icon-actions" />
        </button>
      </div>
    </header>
    <InfoBoxCluster
      :cluster="cluster"
      :metrics="nodeMetrics"
    />
    <div class="row">
      <div class="col span-6">
        <InfoBox>
          <label>
            <t k="clusterIndexPage.sections.nodes.label" />
          </label>
          <div class="row mt-10">
            <SortableTable
              :rows="nodes"
              :headers="nodeHeaders"
              key-field="id"
              :search="false"
              :table-actions="false"
              :row-actions="false"
            />
          </div>
        </InfoBox>
      </div>
      <div class="col span-6">
        <InfoBox>
          <label>
            <t k="clusterIndexPage.sections.gatekeeper.label" />
          </label>
          <div class="row mt-10">
            <SortableTable
              :rows="constraints"
              :headers="constraintHeaders"
              key-field="id"
              :search="false"
              :table-actions="false"
              :row-actions="false"
            />
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
            />
          </div>
        </InfoBox>
      </div>
    </div>
  </section>
</template>
