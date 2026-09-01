<script>
import isEmpty from 'lodash/isEmpty';
import Poller from '@shell/utils/poller';
import SortableTable from '@shell/components/SortableTable';
import { ENDPOINTS } from '@shell/config/types';
import { mapGetters } from 'vuex';
const ALERTMANAGER_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  components: { SortableTable },

  props: {
    monitoringNamespace: {
      type:    String,
      default: 'cattle-monitoring-system'
    },
    alertServiceEndpoint: {
      type:    String,
      default: 'rancher-monitoring-alertmanager'
    },
  },

  data() {
    const eventHeaders = [
      {
        name:     'severity',
        label:    'Severity',
        labelKey: 'monitoring.overview.alertsList.severity.label',
        value:    'labels.severity',
        sort:     ['labels.severity', 'labels.alertname'],
        width:    125,
      },
      {
        name:     'name',
        label:    'Name',
        labelKey: 'generic.name',
        value:    'labels.alertname',
        sort:     ['labels.alertname', 'labels.severity'],
      },
      {
        name:      'message',
        label:     'message',
        labelKey:  'monitoring.overview.alertsList.message.label',
        value:     'annotations',
        formatter: 'RunBookLink',
        sort:      ['annotations.message', 'labels.alertname', 'labels.severity'],
      },
    ];

    return {
      inStore:            this.$store.getters['currentProduct'].inStore,
      alertManagerPoller: new Poller(
        this.loadAlertManagerEvents,
        ALERTMANAGER_POLL_RATE_MS,
        MAX_FAILURES
      ),
      allAlerts: [],
      eventHeaders
    };
  },
  computed: { ...mapGetters(['currentCluster']) },

  mounted() {
    this.fetchDeps();
  },

  beforeUnmount() {
    this.alertManagerPoller.stop();
  },

  methods: {
    async fetchAlertManagerEvents(version) {
      return await this.$store.dispatch(
        `${ this.inStore }/request`,
        { url: `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/${ this.monitoringNamespace }/services/http:${ this.alertServiceEndpoint }:9093/proxy/api/${ version }/alerts` }
      );
    },

    async loadAlertManagerEvents() {
      let alertEvents;

      try {
        alertEvents = await this.fetchAlertManagerEvents('v2');
      } catch (err) {
        alertEvents = await this.fetchAlertManagerEvents('v1').then((res) => res?.data);
      }

      if (alertEvents) {
        this.allAlerts = alertEvents;
      }
    },

    async fetchDeps() {
      if (this.$store.getters['cluster/canList'](ENDPOINTS)) {
        try {
          const am = await this.$store.dispatch('cluster/find', { type: ENDPOINTS, id: `${ this.monitoringNamespace }/${ this.alertServiceEndpoint }` });

          if (!isEmpty(am) && !isEmpty(am.subsets)) {
            this.alertManagerPoller.start();
          }
        } catch {

        }
      }
    },
  }
};
</script>

<template>
  <SortableTable
    :rows="allAlerts"
    :headers="eventHeaders"
    :search="false"
    :table-actions="false"
    :row-actions="false"
    :paging="true"
    :rows-per-page="10"
    default-sort-by="name"
    key-field="id"
  />
</template>
