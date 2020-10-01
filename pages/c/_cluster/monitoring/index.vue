<script>
import { mapGetters } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import InstallRedirect from '@/utils/install-redirect';

import { NAME, CHART_NAME } from '@/config/product/monitoring';
import { ENDPOINTS, MONITORING, WORKLOAD_TYPES } from '@/config/types';
import { allHash } from '@/utils/promise';
import { findBy } from '@/utils/array';

import LazyImage from '@/components/LazyImage';
import Banner from '@/components/Banner';

const CATTLE_MONITORING_NAMESPACE = 'cattle-monitoring-system';

export default {
  components: { Banner, LazyImage },

  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    return {
      availableLinks: {
        alertmanager: false,
        grafana:      false,
        prometheus:   false,
      },
      externalLinks: [],
      grafanaSrc:    require('~/assets/images/logo-color-grafana.svg'),
      prometheusSrc: require('~/assets/images/logo-color-prometheus.svg'),
      resources:     [MONITORING.ALERTMANAGER, MONITORING.PROMETHEUS],
      v1Installed:   false,
    };
  },

  computed: { ...mapGetters(['currentCluster']) },

  mounted() {
    this.externalLinks = [
      {
        enabled:     false,
        group:       'alertmanager',
        iconSrc:     this.prometheusSrc,
        label:       'monitoring.overview.linkedList.alertManager.label',
        description: 'monitoring.overview.linkedList.alertManager.description',
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-alertmanager:9093/proxy`,
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
        description: 'monitoring.overview.linkedList.prometheusPromQl.description',
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/graph`,
      },
      {
        enabled:     false,
        group:       'prometheus',
        iconSrc:     this.prometheusSrc,
        label:       'monitoring.overview.linkedList.prometheusRules.label',
        description: 'monitoring.overview.linkedList.prometheusRules.description',
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/rules`,
      },
      {
        enabled:     false,
        group:       'prometheus',
        iconSrc:     this.prometheusSrc,
        label:       'monitoring.overview.linkedList.prometheusTargets.label',
        description: 'monitoring.overview.linkedList.prometheusTargets.description',
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-monitoring-system/services/http:rancher-monitoring-prometheus:9090/proxy/targets`,
      },
    ];

    this.fetchDeps();
  },

  methods: {
    async fetchDeps() {
      const { $store, externalLinks } = this;

      const workloads = await Promise.all(Object.values(WORKLOAD_TYPES).map(type => this.$store.dispatch('cluster/findAll', { type })));

      workloads.flat().forEach((workload) => {
        if (
          !isEmpty(workload?.spec?.template?.spec?.containers) &&
          (workload.spec.template.spec.containers.find(c => c.image.includes('quay.io/coreos/prometheus-operator') ||
            c.image.includes('rancher/coreos-prometheus-operator'))
          )
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
      <Banner v-if="v1Installed" color="warning">
        <template #default>
          <t k="monitoring.overview.v1Warning" :raw="true" />
        </template>
      </Banner>
      <div v-for="fel in externalLinks" :key="fel.label" class="link-container">
        <a v-if="fel.enabled" :href="fel.link" target="_blank" rel="noopener noreferrer">
          <div class="link-logo">
            <LazyImage :src="fel.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="fel.label" />
            <i class="icon icon-external-link pull-right" />
            <hr />
            <div class="description"><t :k="fel.description" /></div>
          </div>
        </a>
        <a v-else v-tooltip="t('monitoring.overview.linkedList.na')" href="javascript:void(0)" :disabled="!fel.enabled">
          <div class="link-logo">
            <LazyImage :src="fel.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="fel.label" />
            <i class="icon icon-external-link pull-right" />
            <hr />
            <div class="description"><t :k="fel.description" /></div>
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
    border-left: solid 10px var(--primary);

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

      .link-logo {
        text-align: center;
        // position: absolute;
        // left: 25px;
        // top: 25px;
        width: 60px;
        height: 60px;
        border-radius: calc(2 * var(--border-radius));
        background-color: white;

        img {
          width: 56px;
          height: 56px;
          -o-object-fit: contain;
          object-fit: contain;
          position: relative;
          top: 2px;
        }
      }

      .link-content {
        width: 100%;
        margin-left: 10px;
      }

      .description {
        margin-top: 10px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        text-overflow: ellipsis;
        color: var(--secondary);
      }
    }
  }
}
</style>
