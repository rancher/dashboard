<script>
import isEmpty from 'lodash/isEmpty';
import AlertTable from '@shell/components/AlertTable';
import { CATALOG, MONITORING } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { findBy } from '@shell/utils/array';
import { getClusterPrefix } from '@shell/utils/grafana';
import LazyImage from '@shell/components/LazyImage';
import SimpleBox from '@shell/components/SimpleBox';
import { canViewAlertManagerLink, canViewGrafanaLink, canViewPrometheusLink } from '@shell/utils/monitoring';
import Loading from '@shell/components/Loading';

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
      externalLinks: [
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
      const hash = {};

      if ($store.getters['cluster/canList'](CATALOG.APP)) {
        hash.apps = $store.dispatch('cluster/findAll', { type: CATALOG.APP });
      }
      const res = await allHash(hash);

      const canViewAlertManager = await canViewAlertManagerLink(this.$store);
      const canViewGrafana = await canViewGrafanaLink(this.$store);
      const canViewPrometheus = await canViewPrometheusLink(this.$store);

      if (canViewAlertManager) {
        const amMatch = findBy(externalLinks, 'group', 'alertmanager');

        amMatch.enabled = true;
      }
      if (canViewGrafana) {
        const grafanaMatch = findBy(externalLinks, 'group', 'grafana');
        // Generate Grafana link
        const currentCluster = this.$store.getters['currentCluster'];
        const rancherMonitoring = !isEmpty(res.apps) ? findBy(res.apps, 'id', 'cattle-monitoring-system/rancher-monitoring') : '';
        const clusterPrefix = getClusterPrefix(rancherMonitoring?.currentVersion || '', currentCluster.id);

        grafanaMatch.link = `${ clusterPrefix }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy/`;
        grafanaMatch.enabled = true;
      }

      if (canViewPrometheus) {
        const promeMatch = externalLinks.filter(
          (el) => el.group === 'prometheus'
        );

        promeMatch.forEach((match) => {
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
              <hr>
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

<style lang="scss" scoped>
  .create-resource-container .subtype-banner {
    min-height: 80px;
    padding: 10px;
  }
</style>
