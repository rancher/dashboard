<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import InstallRedirect from '@/utils/install-redirect';

import { NAME, CHART_NAME } from '@/config/product/monitoring';
import { ENDPOINTS, MONITORING } from '@/config/types';
import { allHash } from '@/utils/promise';
import { findBy } from '@/utils/array';

import Banner from '@/components/Banner';
import LazyImage from '@/components/LazyImage';
import ResourceGauge from '@/components/ResourceGauge';

const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

export default {
  components: {
    Banner,
    LazyImage,
    ResourceGauge,
  },

  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    return {
      externalLinks:  [],
      grafanaSrc:     require('~/assets/images/white-grafana.svg'),
      prometheusSrc:  require('~/assets/images/white-prometheus.svg'),
      resources:      [MONITORING.ALERTMANAGER, MONITORING.PROMETHEUSE],
      availableLinks: {
        alertmanager: false,
        grafana:      false,
        prometheus:   false,
      }
    };
  },

  computed: { ...mapGetters(['currentCluster']) },

  mounted() {
    this.externalLinks = [
      {
        enabled: false,
        group:   'alertmanager',
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.alertManager.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy`,
      },
      {
        enabled: false,
        group:   'grafana',
        iconSrc: this.grafanaSrc,
        label:   'monitoring.overview.linkedList.grafana.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy`,
      },
      {
        enabled: false,
        group:   'prometheus',
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.prometheusPromQl.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/graph`,
      },
      {
        enabled: false,
        group:   'prometheus',
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.prometheusRules.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/rules`,
      },
      {
        enabled: false,
        group:   'prometheus',
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.prometheusTargets.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/targets`,
      },
    ];

    this.fetchDeps();
  },

  methods: {
    async fetchDeps() {
      const { $store, externalLinks } = this;
      const hash = await allHash({ endpoints: $store.dispatch('cluster/findAll', { type: ENDPOINTS }) });

      if (!isEmpty(hash.endpoints)) {
        const amMatch = findBy(externalLinks, 'group', 'alertmanager');
        const grafanaMatch = findBy(externalLinks, 'group', 'grafana');
        const promeMatch = externalLinks.filter(el => el.group === 'prometheus');
        const alertmanager = findBy(hash.endpoints, 'id', `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-alertmanager`);
        const grafana = findBy(hash.endpoints, 'id', `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-grafana`);
        const prometheus = findBy(hash.endpoints, 'id', `${ CATTLE_MONITORING_NAMESPACE }/rancher-monitoring-prometheus`);

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
      }
    },
  }
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
    <div class="links">
      <div v-for="fel in externalLinks" :key="fel.label" class="link-container">
        <a v-if="fel.enabled" :href="fel.link" target="_blank" rel="noopener noreferrer">
          <div class="link-logo">
            <LazyImage class="round-image" :src="fel.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="fel.label" />
            <i class="icon icon-external-link pull-right" />
          </div>
        </a>
        <a v-else v-tooltip="t('monitoring.overview.linkedList.na')" href="javascript:void(0)" :disabled="!fel.enabled">
          <div class="link-logo">
            <LazyImage class="round-image" :src="fel.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="fel.label" />
            <i class="icon icon-external-link pull-right" />
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<style lang="scss">
.links {
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  .link-container {
    background-color: var(--input-bg);
    border-radius: var(--border-radius);
    border: solid 1px var(--input-border);
    display: flex;
    flex-basis: 40%;
    margin: 0 10px 10px 0;
    max-width: 325px;
    min-height: 100px;

    a[disabled] {
      cursor: not-allowed;
      background-color: var(---disabled-bg);
    }

    &:hover {
      box-shadow: 0px 0px 1px var(--outline-width) var(--outline);
    }

    > a {
      align-items: center;
      display: flex;
      flex: 1 0;
      padding: 10px;

      .link-logo,
      .link-content {
        display: inline-block;
      }

      .link-content {
        width: 100%;
      }
    }

    .round-image {
      border-radius: 50%;
      height: 50px;
      margin: 10px;
      min-width: 50px;
      overflow: hidden;
    }
  }
}
</style>
