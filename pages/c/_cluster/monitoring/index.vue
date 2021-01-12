<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import InstallRedirect from '@/utils/install-redirect';

import { NAME, CHART_NAME } from '@/config/product/monitoring';
import { ENDPOINTS, MONITORING, WORKLOAD_TYPES } from '@/config/types';
import { allHash } from '@/utils/promise';
import { findBy } from '@/utils/array';
import Poller from '@/utils/poller';

import Banner from '@/components/Banner';
import LazyImage from '@/components/LazyImage';
import SimpleBox from '@/components/SimpleBox';
import SortableTable from '@/components/SortableTable';

const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';
const ALERTMANAGER_POLL_RATE_MS = 30000;
const MAX_FAILURES = 2;

export default {
  components: {
    Banner,
    LazyImage,
    SimpleBox,
    SortableTable,
  },

  middleware: InstallRedirect(NAME, CHART_NAME),

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
      eventHeaders,
      alertManagerPoller: new Poller(
        this.loadAlertManagerEvents,
        ALERTMANAGER_POLL_RATE_MS,
        MAX_FAILURES
      ),
      allAlerts:      [],
      availableLinks: {
        alertmanager: false,
        grafana:      false,
        prometheus:   false,
      },
      grafanaSrc:    require('~/assets/images/vendor/grafana.svg'),
      prometheusSrc: require('~/assets/images/vendor/prometheus.svg'),
      resources:     [MONITORING.ALERTMANAGER, MONITORING.PROMETHEUS],
      v1Installed:   false,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    externalLinks() {
      return [
        {
          enabled:     false,
          group:       'alertmanager',
          iconSrc:     this.prometheusSrc,
          label:       'monitoring.overview.linkedList.alertManager.label',
          description:
            'monitoring.overview.linkedList.alertManager.description',
          link: `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy`,
        },
        {
          enabled:     false,
          group:       'grafana',
          iconSrc:     this.grafanaSrc,
          label:       'monitoring.overview.linkedList.grafana.label',
          description: 'monitoring.overview.linkedList.grafana.description',
          link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy`,
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     this.prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusPromQl.label',
          description:
            'monitoring.overview.linkedList.prometheusPromQl.description',
          link: `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/graph`,
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     this.prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusRules.label',
          description:
            'monitoring.overview.linkedList.prometheusRules.description',
          link: `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/rules`,
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     this.prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusTargets.label',
          description:
            'monitoring.overview.linkedList.prometheusTargets.description',
          link: `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/targets`,
        },
      ];
    },
  },

  mounted() {
    this.fetchDeps();
  },

  beforeDestroy() {
    this.alertManagerPoller.stop();
  },

  methods: {
    async loadAlertManagerEvents() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const alertsEvents = await this.$store.dispatch(`${ inStore }/request`, { url: `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy/api/v1/alerts` });

      if (alertsEvents.data) {
        this.allAlerts = alertsEvents.data;
      }
    },
    async fetchDeps() {
      const { $store, externalLinks } = this;

      const workloads = await Promise.all(
        Object.values(WORKLOAD_TYPES).map(type => this.$store.dispatch('cluster/findAll', { type })
        )
      );

      workloads.flat().forEach((workload) => {
        if (
          !isEmpty(workload?.spec?.template?.spec?.containers) &&
          workload.spec.template.spec.containers.find(
            c => c.image.includes('quay.io/coreos/prometheus-operator') ||
              c.image.includes('rancher/coreos-prometheus-operator')
          ) &&
          workload?.metadata?.namespace !== CATTLE_MONITORING_NAMESPACE
        ) {
          if (!this.v1Installed) {
            this.v1Installed = true;
          }
        }
      });

      const hash = await allHash({ endpoints: $store.dispatch('cluster/findAll', { type: ENDPOINTS }) });

      if (!isEmpty(hash.endpoints)) {
        const amMatch = findBy(externalLinks, 'group', 'alertmanager');
        const grafanaMatch = findBy(externalLinks, 'group', 'grafana');
        const promeMatch = externalLinks.filter(
          el => el.group === 'prometheus'
        );
        const alertmanager = findBy(
          hash.endpoints,
          'id',
          `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-alertmanager`
        );
        const grafana = findBy(
          hash.endpoints,
          'id',
          `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`
        );
        const prometheus = findBy(
          hash.endpoints,
          'id',
          `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-prometheus`
        );

        if (!isEmpty(alertmanager) && !isEmpty(alertmanager.subsets)) {
          amMatch.enabled = true;
        }
        if (!isEmpty(grafana) && !isEmpty(grafana.subsets)) {
          grafanaMatch.enabled = true;
        }
        if (!isEmpty(prometheus) && !isEmpty(prometheus.subsets)) {
          promeMatch.forEach((match) => {
            match.enabled = true;
          });
        }

        if (amMatch.enabled) {
          this.alertManagerPoller.start();
        }
      }
    },
  },
};
</script>

<template>
  <section>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="monitoring.overview.title" />
        </h1>
        <div>
          <t k="monitoring.overview.subtitle" :raw="true" />
        </div>
      </div>
    </header>
    <div>
      <Banner v-if="v1Installed" color="warning">
        <template #default>
          <t k="monitoring.v1Warning" :raw="true" />
        </template>
      </Banner>
      <div class="create-resource-container">
        <div class="subtypes-container">
          <a
            v-for="fel in externalLinks"
            :key="fel.label"
            v-tooltip="
              !fel.enabled ? t('monitoring.overview.linkedList.na') : undefined
            "
            :href="fel.enabled ? fel.link : void 0"
            :disabled="!fel.enabled"
            target="_blank"
            rel="noopener noreferrer"
            :class="{ 'subtype-banner': true, disabled: !fel.enabled }"
          >
            <div class="subtype-content">
              <div class="title">
                <div class="subtype-logo round-image">
                  <LazyImage :src="fel.iconSrc" />
                </div>
                <h5>
                  <span>
                    <t :k="fel.label" />
                  </span>
                </h5>
                <div class="flex-right">
                  <i class="icon icon-external-link" />
                </div>
              </div>
              <hr />
              <div class="description">
                <span>
                  <t :k="fel.description" />
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
    <div>
      <SimpleBox
        class="mt-30"
        :title="t('monitoring.overview.alertsList.label')"
      >
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
      </SimpleBox>
    </div>
  </section>
</template>
