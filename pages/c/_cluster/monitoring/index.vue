<script>
import { mapGetters } from 'vuex';

import InstallRedirect from '@/utils/install-redirect';

import { NAME, CHART_NAME } from '@/config/product/monitoring';
import { MONITORING } from '@/config/types';

import LazyImage from '@/components/LazyImage';
import ResourceGauge from '@/pages/c/_cluster/explorer/ResourceGauge';

export default {
  components: {
    LazyImage,
    ResourceGauge,
  },

  middleware: InstallRedirect(NAME, CHART_NAME),

  async fetch() {
    const resources = [];

    for ( const resource of this.resources ) {
      const schema = this.$store.getters['cluster/schemaFor'](resource);

      if (schema) {
        resources.push(this.$store.dispatch('cluster/findAll', { type: resource }));
      }
    }

    await Promise.all(resources);
  },

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

    resourceGauges() {
      const gauges = this.resources
        .map((resource, i) => {
          const schema = this.$store.getters['cluster/schemaFor'](resource);

          if (!schema) {
            return null;
          }
          const all = this.$store.getters['cluster/all'](resource);
          const resourceCounts = this.createResourceCounts(all);
          const name = this.$store.getters['type-map/labelFor'](
            schema,
            resourceCounts.useful
          );

          const location = {
            name:   `c-cluster-monitoring-${ resource.split('.').pop() }`,
            params: { resource },
          };

          return {
            name,
            location,
            primaryColorVar: `--sizzle-${ i }`,
            ...resourceCounts,
          };
        })
        .filter(r => r);

      return gauges;
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

  methods: {
    createResourceCounts(resources) {
      const errorCount = resources.filter(
        resource => resource.stateBackground === 'bg-error'
      ).length;
      const notSuccessCount = resources.filter(
        resource => resource.stateBackground !== 'bg-success'
      ).length;
      const warningCount = notSuccessCount - errorCount;

      return {
        total:  resources.length,
        useful: resources.length - notSuccessCount,
        warningCount,
        errorCount,
      };
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
      <ResourceGauge
        v-for="resourceGauge in resourceGauges"
        :key="resourceGauge.name"
        v-bind="resourceGauge"
      />
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
