<script>
import AlertTable from '@shell/components/AlertTable';
import { MONITORING } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { findBy } from '@shell/utils/array';
import { buildMonitoringUrl, getClusterPrefix } from '@shell/utils/grafana';
import LazyImage from '@shell/components/LazyImage';
import SimpleBox from '@shell/components/SimpleBox';
import {
  canViewAlertManagerLink,
  canViewGrafanaLink,
  canViewPrometheusLink,
  getClusterMonitoringDashboardValues,
  getMonitoringApp,
  hasAlertManagerEndpoint,
} from '@shell/utils/monitoring';
import Loading from '@shell/components/Loading';
import grafanaSrc from '~shell/assets/images/vendor/grafana.svg';
import prometheusSrc from '~shell/assets/images/vendor/prometheus.svg';

export default {
  components: {
    LazyImage,
    SimpleBox,
    AlertTable,
    Loading
  },

  async fetch() {
    await this.fetchDeps();
  },

  data() {
    const currentCluster = this.$store.getters['currentCluster'];

    return {
      availableLinks: {
        alertmanager: false,
        grafana:      false,
        prometheus:   false,
      },
      showAlertTable: false,
      resources:      [MONITORING.ALERTMANAGER, MONITORING.PROMETHEUS],
      externalLinks:  [
        {
          enabled:     false,
          group:       'alertmanager',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.alertManager.label',
          description:
            'monitoring.overview.linkedList.alertManager.description',
          link: `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy`,
        },
        {
          enabled:     false,
          group:       'grafana',
          iconSrc:     grafanaSrc,
          label:       'monitoring.overview.linkedList.grafana.label',
          description: 'monitoring.overview.linkedList.grafana.description',
          link:        '',
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusPromQl.label',
          description:
            'monitoring.overview.linkedList.prometheusPromQl.description',
          link: `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/graph`,
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusRules.label',
          description:
            'monitoring.overview.linkedList.prometheusRules.description',
          link: `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/rules`,
        },
        {
          enabled:     false,
          group:       'prometheus',
          iconSrc:     prometheusSrc,
          label:       'monitoring.overview.linkedList.prometheusTargets.label',
          description:
            'monitoring.overview.linkedList.prometheusTargets.description',
          link: `/k8s/clusters/${ currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/targets`,
        },
      ]
    };
  },

  methods: {
    async fetchDeps() {
      const { $store, externalLinks } = this;
      const hash = {
        dashboardValues: getClusterMonitoringDashboardValues($store),
        monitoringApp:   getMonitoringApp($store)
      };
      const res = await allHash(hash);

      const rancherMonitoring = res.monitoringApp;
      const dashboardValues = res.dashboardValues || {};
      const canViewAlertManager = await canViewAlertManagerLink(this.$store, dashboardValues);
      const canViewGrafana = await canViewGrafanaLink(this.$store, dashboardValues);
      const canViewPrometheus = await canViewPrometheusLink(this.$store, dashboardValues);
      const canViewAlertTable = await hasAlertManagerEndpoint(this.$store);
      const alertmanagerMatch = findBy(externalLinks, 'group', 'alertmanager');
      const grafanaMatch = findBy(externalLinks, 'group', 'grafana');
      const prometheusMatches = externalLinks.filter((el) => el.group === 'prometheus');

      this.showAlertTable = canViewAlertTable;

      if (dashboardValues.alertmanagerURL) {
        alertmanagerMatch.link = dashboardValues.alertmanagerURL;
        alertmanagerMatch.enabled = true;
      } else if (canViewAlertManager) {
        alertmanagerMatch.enabled = true;
      }

      if (dashboardValues.grafanaURL) {
        grafanaMatch.link = dashboardValues.grafanaURL;
        grafanaMatch.enabled = true;
      } else if (canViewGrafana) {
        const currentCluster = this.$store.getters['currentCluster'];
        const clusterPrefix = getClusterPrefix(rancherMonitoring?.currentVersion || '', currentCluster.id);

        grafanaMatch.link = `${ clusterPrefix }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/`;
        grafanaMatch.enabled = true;
      }

      if (dashboardValues.prometheusURL) {
        const prometheusLinks = ['/graph', '/rules', '/targets'];

        prometheusMatches.forEach((match, index) => {
          match.link = buildMonitoringUrl(dashboardValues.prometheusURL, prometheusLinks[index]);
          match.enabled = true;
        });
      } else if (canViewPrometheus) {
        prometheusMatches.forEach((match) => {
          match.enabled = true;
        });
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="monitoring.overview.title" />
        </h1>
        <div>
          <t
            k="monitoring.overview.subtitle"
            :raw="true"
          />
        </div>
      </div>
    </header>
    <div>
      <div class="create-resource-container">
        <div class="subtypes-container">
          <a
            v-for="(fel, i) in externalLinks"
            :key="i"
            v-clean-tooltip="
              !fel.enabled ? t('monitoring.overview.linkedList.na') : undefined
            "
            :href="fel.enabled ? fel.link : void 0"
            :disabled="!fel.enabled ? true : null"
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
              <hr role="none">
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
        v-if="showAlertTable"
        class="mt-30"
        :title="t('monitoring.overview.alertsList.label')"
      >
        <AlertTable />
      </SimpleBox>
    </div>
  </section>
</template>

<style lang="scss" scoped>
  .create-resource-container .subtype-banner {
    min-height: 80px;
    padding: 10px;
  }
</style>
