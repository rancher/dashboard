<script>
import isEmpty from 'lodash/isEmpty';

import InstallRedirect from '@shell/utils/install-redirect';
import AlertTable from '@shell/components/AlertTable';
import { NAME, CHART_NAME } from '@shell/config/product/monitoring';
import { ENDPOINTS, MONITORING } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { findBy } from '@shell/utils/array';

import { Banner } from '@components/Banner';
import LazyImage from '@shell/components/LazyImage';
import SimpleBox from '@shell/components/SimpleBox';
import { haveV1MonitoringWorkloads } from '@shell/utils/monitoring';

const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

// Added by Verrazzano Start
const VERRAZZANO_SYSTEM_NAMESPACE = 'verrazzano-system';
const VERRAZZANO_MONITORING_NAMESPACE = 'verrazzano-monitoring';
const VERRAZZANO = 'install.verrazzano.io.Verrazzano';
const PROMETHEUS_URL_PLACE_HOLDER = '##prometheusUrl##';
// Added by Verrazzano End

export default {
  components: {
    Banner,
    LazyImage,
    SimpleBox,
    AlertTable
  },

  middleware: InstallRedirect(NAME, CHART_NAME),

  async fetch() {
    await this.fetchDeps();
  },

  data() {
    const grafanaSrc = require('~shell/assets/images/vendor/grafana.svg');
    const prometheusSrc = require('~shell/assets/images/vendor/prometheus.svg');
    const currentCluster = this.$store.getters['currentCluster'];

    return {
      availableLinks: {
        alertmanager: false,
        grafana:      false,
        prometheus:   false,
      },
      resources:     [MONITORING.ALERTMANAGER, MONITORING.PROMETHEUS],
      v1Installed:   false,
      externalLinks: [
        {
          enabled:     false,
          group:       'alertmanager',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.alertManager.label',
          description:
            'monitoring.overview.linkedList.alertManager.description',
          link:   `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy`,
          // Added by Verrazzano Start
          vzlink: ``
          // Added by Verrazzano End
        },
        {
          enabled:     false,
          group:       'grafana',
          iconSrc:     grafanaSrc,
          label:       'monitoring.overview.linkedList.grafana.label',
          description: 'monitoring.overview.linkedList.grafana.description',
          link:        `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy`,
          // Added by Verrazzano Start
          vzlink:      ``
          // Added by Verrazzano End
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusPromQl.label',
          description:
            'monitoring.overview.linkedList.prometheusPromQl.description',
          link:   `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/graph`,
          // Added by Verrazzano Start
          vzlink: `${ PROMETHEUS_URL_PLACE_HOLDER }/graph`
          // Added by Verrazzano End
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusRules.label',
          description:
            'monitoring.overview.linkedList.prometheusRules.description',
          link:   `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/rules`,
          // Added by Verrazzano Start
          vzlink: `${ PROMETHEUS_URL_PLACE_HOLDER }/rules`
          // Added by Verrazzano End
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusTargets.label',
          description:
            'monitoring.overview.linkedList.prometheusTargets.description',
          link:   `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/targets`,
          // Added by Verrazzano Start
          vzlink: `${ PROMETHEUS_URL_PLACE_HOLDER }/targets`
          // Added by Verrazzano End
        },
      ],
      // Added by Verrazzano Start
      links: {}
      // Added by Verrazzano End
    };
  },

  methods: {
    async fetchDeps() {
      const { $store, externalLinks } = this;

      this.v1Installed = await haveV1MonitoringWorkloads($store);

      // Added by Verrazzano Start
      // const hash = await allHash({ endpoints: $store.dispatch('cluster/findAll', { type: ENDPOINTS }) });
      const hash = await allHash({
        endpoints:   this.$store.dispatch('cluster/findAll', { type: ENDPOINTS }),
        verrazzanos: this.$store.dispatch('cluster/findAll', { type: VERRAZZANO })
      });
      // Added by Verrazzano End

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

        // Added by Verrazzano Start
        const vzGrafana = findBy(
          hash.endpoints,
          'id',
          `${ VERRAZZANO_SYSTEM_NAMESPACE }/vmi-system-grafana`
        );
        const vzPrometheus = findBy(
          hash.endpoints,
          'id',
          `${ VERRAZZANO_MONITORING_NAMESPACE }/prometheus-operated`
        );

        if (hash.verrazzanos) {
          // There should really never be more than one of these so...
          this.links = { ...(hash.verrazzanos[0]?.status?.instance || {}) };
        }
        // Added by Verrazzano End

        if (!isEmpty(alertmanager) && !isEmpty(alertmanager.subsets)) {
          amMatch.enabled = true;
        }

        if (!isEmpty(grafana) && !isEmpty(grafana.subsets)) {
          grafanaMatch.enabled = true;
        // Added by Verrazzano Start
        } else if (!isEmpty(vzGrafana) && !isEmpty(vzGrafana.subsets)) {
          grafanaMatch.enabled = true;
          grafanaMatch.link = this.links['grafanaUrl'];
        // Added by Verrazzano End
        }

        if (!isEmpty(prometheus) && !isEmpty(prometheus.subsets)) {
          promeMatch.forEach((match) => {
            match.enabled = true;
          });
        // Added by Verrazzano Start
        } else if (!isEmpty(vzPrometheus) && !isEmpty(vzPrometheus.subsets)) {
          promeMatch.forEach((match) => {
            match.enabled = true;
            match.link = match.vzlink.replaceAll(PROMETHEUS_URL_PLACE_HOLDER, this.links['prometheusUrl']);
          });
        // Added by Verrazzano End
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
        <AlertTable />
      </SimpleBox>
    </div>
  </section>
</template>
