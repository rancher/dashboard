<script>
import Loading from '@shell/components/Loading';
import Banner from '@shell/components/Banner';
import { computeDashboardUrl } from '@shell/utils/grafana';

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
    backgroundColor: {
      type:    String,
      default: '#1b1c21'
    },
    theme: {
      type:    String,
      default: 'dark'
    }
  },
  data() {
    return {
      loading: false, error: false, interval: null, initialUrl: this.computeUrl()
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
    currentUrl() {
      if (this.graphHistory) {
        const angularElement = this.graphWindow.angular.element(this.graphDocument.querySelector('.grafana-app'));
        const injector = angularElement.injector();

        this.graphHistory.pushState({}, '', this.currentUrl);
        injector.get('$route').updateParams(this.computeParams());
        injector.get('$route').reload();
      }
    }
  },
  mounted() {
    this.$refs.frame.onload = this.inject;
    this.poll();
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
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
          const errorElements = this.$refs.frame.contentWindow.document.getElementsByClassName('alert-error');
          const errorCornerElements = this.$refs.frame.contentWindow.document.getElementsByClassName('panel-info-corner--error');
          const panelInFullScreenElements = this.$refs.frame.contentWindow.document.getElementsByClassName('panel-in-fullscreen');
          const panelContainerElements = this.$refs.frame.contentWindow.document.getElementsByClassName('panel-container');
          const error = errorElements.length > 0 || errorCornerElements.length > 0;
          const loaded = panelInFullScreenElements.length > 0 || panelContainerElements.length > 0;

          if (error) {
            throw new Error('An error was detected in the iframe');
          }

          this.$set(this, 'loading', !loaded);
        } catch (ex) {
          this.$set(this, 'error', true);
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

      return computeDashboardUrl(embedUrl, clusterId, params);
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
      ev.preventDefault();
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

      this.graphDocument.head.appendChild(style);
    },

    inject() {
      this.injectCss();
    }
  }
};
</script>

<template>
  <div class="grafana-graph">
    <Banner v-if="error" color="error" style="z-index: 1000">
      <div class="text-center">
        {{ t('grafanaDashboard.failedToLoad') }} <a href="#" @click="reload">{{ t('grafanaDashboard.reload') }}</a>
      </div>
    </Banner>
    <iframe
      v-show="!error"
      ref="frame"
      :class="{loading, frame: true}"
      :src="initialUrl"
      frameborder="0"
      scrolling="no"
    ></iframe>
    <div v-if="loading">
      <Loading />
    </div>
    <div v-if="!loading && !error" class="external-link">
      <a :href="grafanaUrl" target="_blank" rel="noopener noreferrer nofollow">{{ t('grafanaDashboard.grafana') }} <i class="icon icon-external-link" /></a>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.grafana-graph {
  position: relative;
  min-height: 100%;
  min-width: 100%;

  & ::v-deep .content {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 0;
  }

  & ::v-deep .overlay {
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
