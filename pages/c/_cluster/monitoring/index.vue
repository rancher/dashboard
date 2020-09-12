<script>
import { mapGetters } from 'vuex';

import InstallRedirect from '@/utils/install-redirect';

import { NAME, CHART_NAME } from '@/config/product/monitoring';
import { MONITORING } from '@/config/types';

import LazyImage from '@/components/LazyImage';
import ResourceGauge from '@/components/ResourceGauge';

export default {
  components: {
    LazyImage,
    ResourceGauge,
  },

  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    return {
      externalLinks: [],
      grafanaSrc:    require('~/assets/images/white-grafana.svg'),
      prometheusSrc: require('~/assets/images/white-prometheus.svg'),
      resources:     [MONITORING.ALERTMANAGER, MONITORING.PROMETHEUSE],
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    accessibleResources() {
      return this.resources.filter(resource => this.$store.getters['cluster/schemaFor'](resource));
    },
  },

  mounted() {
    this.externalLinks = [
      {
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.alertManager.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy`,
        tooltip: 'monitoring.overview.linkedList.alertManager.tooltip',
      },
      {
        iconSrc: this.grafanaSrc,
        label:   'monitoring.overview.linkedList.grafana.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-grafana:80/proxy`,
        tooltip: 'monitoring.overview.linkedList.grafana.tooltip',
      },
      {
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.prometheusPromQl.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/graph`,
        tooltip: 'monitoring.overview.linkedList.prometheusPromQl.tooltip',
      },
      {
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.prometheusRules.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/rules`,
        tooltip: 'monitoring.overview.linkedList.prometheusRules.tooltip',
      },
      {
        iconSrc: this.prometheusSrc,
        label:   'monitoring.overview.linkedList.prometheusTargets.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/targets`,
        tooltip: 'monitoring.overview.linkedList.prometheusTargets.tooltip',
      },
    ];
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
    <div class="links">
      <div v-for="el in externalLinks" :key="el.label" class="link-container">
        <a v-tooltip="t(el.tooltip)" :href="el.link" target="_blank" rel="noopener noreferrer">
          <div class="link-logo">
            <LazyImage class="round-image" :src="el.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="el.label" />
            <i class="icon icon-external-link pull-right" />
          </div>
        </a>
      </div>
    </div>
    <div class="resource-gauges">
      <ResourceGauge v-for="(resource, i) in accessibleResources" :key="resource" :resource="resource" :primary-color-var="`--sizzle-${i}`" />
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
