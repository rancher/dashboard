<script>
import { MANAGEMENT, CATALOG } from '@shell/config/types';
import LazyImage from '@shell/components/LazyImage';
import { SETTING, getGlobalMonitoringV2Setting } from '@shell/config/settings';
import { compare } from '@shell/utils/version';

const APP_NAME = 'global-monitoring';
const APP_NAMESPACE = 'cattle-global-monitoring';

export default {
  components: { LazyImage },

  async fetch() {
    try {
      this.app = await this.$store.dispatch(`${ this.inStore }/find`, {
        type: CATALOG.APP,
        id:   `${ APP_NAMESPACE }/${ APP_NAME }`
      });
    } catch (error) {}

    const monitoringSettings = getGlobalMonitoringV2Setting(this.$store.getters);
    const currentClusterId = monitoringSettings.clusterId || this.$route.params.cluster;
    const currentCluster = this.$store.getters['management/byId'](MANAGEMENT.CLUSTER, currentClusterId);

    this.currentCluster = currentCluster;
    this.monitoringSettings = monitoringSettings;
  },

  data() {
    return {
      app:            null,
      availableLinks: {
        alertmanager: false,
        grafana:      false,
        prometheus:   false,
      },
      monitoringSettings: {},
      currentCluster:     {},
    };
  },

  computed: {
    appVersion() {
      return this.app?.versionDisplay;
    },

    externalLinks() {
      const globalMonitoringSrc = require('~shell/assets/images/providers/global-monitoring.svg');
      const grafanaSrc = require('~shell/assets/images/providers/grafana.svg');
      const thanosSrc = require('~shell/assets/images/providers/thanos.svg');
      const { clusterId, enabled } = this.monitoringSettings;
      const serverUrlSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL) || {};
      let thanosUrl = `${ serverUrlSetting.value }/k8s/clusters/${ clusterId }/api/v1/namespaces/cattle-global-monitoring/services/http:access-thanos:80/proxy/`;

      if (compare(this.appVersion, '0.0.2') > 0) {
        thanosUrl = '/global-monitoring/v2/graph';
      }

      return [
        {
          enabled:     clusterId && enabled,
          group:       'globalMonitoring',
          iconSrc:     globalMonitoringSrc,
          label:       'globalMonitoringDashboard.globalMonitoring.label',
          description: 'globalMonitoringDashboard.globalMonitoring.description',
          link:        `${ serverUrlSetting.value }/k8s/clusters/${ clusterId }/api/v1/namespaces/cattle-global-monitoring/services/http:access-dashboard:80/proxy/`,
        },
        {
          enabled:     clusterId && enabled,
          group:       'grafana',
          iconSrc:     grafanaSrc,
          label:       'globalMonitoringDashboard.grafana.label',
          description: 'globalMonitoringDashboard.grafana.description',
          link:        `${ serverUrlSetting.value }/k8s/clusters/${ clusterId }/api/v1/namespaces/cattle-global-monitoring/services/http:access-grafana:80/proxy/`,
        },
        {
          enabled:     clusterId && enabled,
          group:       'thanos',
          iconSrc:     thanosSrc,
          label:       'globalMonitoringDashboard.thanos.label',
          description: 'globalMonitoringDashboard.thanos.description',
          link:        thanosUrl,
        },
      ];
    },

    inStore() {
      const currentCluster = this.currentCluster;

      if (currentCluster && currentCluster.id !== 'local') {
        return 'cluster';
      } else {
        return 'management';
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
                <div class="subtype-logo logo-image">
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
  </section>
</template>

<style lang="scss" scoped>
  .create-resource-container{
    .logo-image{
      width: 50px;
      height: 50px;
      margin-right: 10px;

      img{
        width: 50px;
      }
    }
  }
</style>
