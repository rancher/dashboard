<script>
import Loading from '@shell/components/Loading';
import { Banner } from '@components/Banner';
import { computeDashboardUrl } from '@shell/utils/grafana';
import { CATALOG } from '@shell/config/types';

export default {
  components: { Banner, Loading },
  props:      {
    url: {
      type:     String,
      required: true,
    },
    vars: {
      type:    Object,
      default: () => ({})
    },
    range: {
      type:    String,
      default: null
    },
    refreshRate: {
      type:    String,
      default: null
    },
    // change the grafana url prefix for local clusters in certain monitoring versions
    // project monitoring (projectHelmCharts) supply a grafana url that never needs to be modified in this way
    modifyPrefix: {
      type:    Boolean,
      default: true
    },
    backgroundColor: {
      type:    String,
      default: '#1b1c21'
    },
    theme: {
      type:    String,
      default: 'dark'
    }
  },
  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    if (this.$store.getters[`${ inStore }/canList`](CATALOG.APP)) {
      try {
        const res = await this.$store.dispatch(`${ inStore }/find`, { type: CATALOG.APP, id: 'cattle-monitoring-system/rancher-monitoring' });

        this.monitoringVersion = res?.currentVersion;
      } catch (err) {}
    }
  },
  data() {
    return {
      loading: false, error: false, interval: null, errorTimer: null, monitoringVersion: ''
    };
  },
  computed: {
    currentUrl() {
      return this.computeUrl();
    },
    grafanaUrl() {
      return this.currentUrl.replace('&kiosk', '');
    },
    graphWindow() {
      return this.$refs.frame?.contentWindow;
    },
    graphHistory() {
      return this.graphWindow?.history;
    },
    graphDocument() {
      return this.graphWindow?.document;
    }
  },
  watch: {
    currentUrl(neu) {
      // Should consider changing `this.graphWindow?.angular` to something like `!loaded && !error`
      // https://github.com/rancher/dashboard/pull/5802
      if (this.graphHistory && this.graphWindow?.angular) {
        this.graphWindow.location.replace(neu);
      }
    },

    error(neu) {
      if (neu) {
        this.errorTimer = setInterval(() => {
          this.reload();
        }, 45000);
      } else {
        clearInterval(this.errorTimer);
        this.errorTimer = null;
      }
    }
  },
  mounted() {
    this.$refs.frame.onload = this.inject;
    this.poll();
  },
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    if (this.errorTimer) {
      clearInterval(this.errorTimer);
    }
  },
  methods: {
    poll() {
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }

      this.interval = setInterval(() => {
        try {
          const graphWindow = this.$refs.frame?.contentWindow;

          // Note. getElementsByClassName won't work, following a grafana bump class names are now unique - for example css-2qng6u-panel-container
          const errorElements = graphWindow.document.querySelectorAll('[class$="alert-error');
          const errorCornerElements = graphWindow.document.querySelectorAll('[class$="panel-info-corner--error');
          const panelInFullScreenElements = graphWindow.document.querySelectorAll('[class$="panel-in-fullscreen');
          const panelContainerElements = graphWindow.document.querySelectorAll('[class$="panel-container');
          const error = errorElements.length > 0 || errorCornerElements.length > 0;
          const loaded = panelInFullScreenElements.length > 0 || panelContainerElements.length > 0;
          const errorMessageElms = graphWindow.document.getElementsByTagName('pre');
          const errorMessage = errorMessageElms.length > 0 ? errorMessageElms[0].innerText : '';
          const isFailure = errorMessage.includes('"status": "Failure"');

          if (error) {
            throw new Error('An error was detected in the iframe');
          }

          this['loading'] = !loaded;
          this['error'] = isFailure;
        } catch (ex) {
          this['error'] = true;
          this['loading'] = false;
          clearInterval(this.interval);
          this.interval = null;
        }
      }, 100);
    },
    computeFromTo() {
      return {
        from: `now-${ this.range }`,
        to:   `now`
      };
    },
    computeUrl() {
      const embedUrl = this.url;
      const clusterId = this.$store.getters['currentCluster'].id;
      const params = this.computeParams();

      return computeDashboardUrl(this.monitoringVersion, embedUrl, clusterId, params, this.modifyPrefix);
    },
    computeParams() {
      const params = {};
      const fromTo = this.computeFromTo();

      if (fromTo.from) {
        params.from = fromTo.from;
      }

      if (fromTo.to) {
        params.to = fromTo.to;
      }

      if (this.refreshRate) {
        params.refresh = this.refreshRate;
      }

      if (Object.keys(this.vars).length > 0) {
        Object.entries(this.vars).forEach((entry) => {
          const paramName = `var-${ entry[0] }`;

          params[paramName] = entry[1];
        });
      }

      params.theme = this.theme;

      return params;
    },
    reload(ev) {
      ev && ev.preventDefault();
      this.$refs.frame.contentWindow.location.reload();
      this.poll();
    },
    injectCss() {
      const style = document.createElement('style');

      style.innerHTML = `
        body .grafana-app .dashboard-content {
          background: ${ this.backgroundColor };
          padding: 0;
        }

        body .grafana-app .layout {
          background: ${ this.backgroundColor };
        }


        body .grafana-app .dashboard-content .panel-container {
          background-color: initial;
          border: none;
        }

        body .grafana-app .dashboard-content .panel-wrapper {
          height: 100%;
        }

        body .grafana-app .panel-menu-container {
          display: none;
        }

        body .grafana-app .panel-title {
          cursor: default;
        }

        body .grafana-app .panel-title .panel-title-text div {
          display: none;
        }
      `;

      const graphWindow = this.$refs.frame?.contentWindow;
      const graphDocument = graphWindow?.document;

      if (graphDocument.head) {
        graphDocument.head.appendChild(style);
      }
    },

    inject() {
      this.injectCss();
    }
  }
};
</script>

<template>
  <div class="grafana-graph">
    <Banner
      v-if="error"
      color="error"
      style="z-index: 1000"
    >
      <div class="text-center">
        {{ t('grafanaDashboard.failedToLoad') }} <a
          href="#"
          @click="reload"
        >{{ t('grafanaDashboard.reload') }}</a>
      </div>
    </Banner>
    <iframe
      v-show="!error"
      ref="frame"
      :class="{loading, frame: true}"
      :src="currentUrl"
      frameborder="0"
      scrolling="no"
    />
    <div v-if="loading">
      <Loading />
    </div>
    <div
      v-if="!loading && !error"
      class="external-link"
    >
      <!-- https://github.com/harvester/harvester-installer/pull/512/files -->
      <!-- It is necessary to include the parameter referer when accessing the Grafana page. -->
      <!-- This parameter is required by the backend to identify the origin of the request from which cluster -->
      <!-- The matching mechanism as follows: -->
      <!-- ~.*/k8s/clusters/(c-m-.+)/.* -->
      <!-- ~.*/dashboard/harvester/c/(c-m-.+)/.* -->
      <a
        :href="grafanaUrl"
        target="_blank"
        rel="noopener nofollow"
      >{{ t('grafanaDashboard.grafana') }} <i class="icon icon-external-link" /></a>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.grafana-graph {
  position: relative;
  min-height: 100%;
  min-width: 100%;

  & :deep() .content {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0;
  }

  & :deep() .overlay {
    position: static;
    background-color: initial;
  }

  iframe {
    position: absolute;
    left: 0;
    right: 0;
    top: 20px;
    bottom: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;

    &.loading {
      visibility: hidden;
    }
  }
}
</style>
