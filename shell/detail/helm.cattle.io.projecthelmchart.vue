<script>
import isEmpty from 'lodash/isEmpty';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import AlertTable from '@shell/components/AlertTable';
import { Banner } from '@components/Banner';
import { parse as parseUrl } from '@shell/utils/url';
import { ENDPOINTS } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  components: {
    Tabbed,
    Tab,
    DashboardMetrics,
    AlertTable,
    Banner
  },
  props: {
    value: {
      type:     Object,
      required: true,
    },
  },
  async fetch() {
    await this.fetchDeps();
  },
  data() {
    return {
      endpointsHash:    [],
      loadingEndpoints: true
    };
  },
  computed: {
    relativeDashboardValues() {
      const { alertmanagerURL, grafanaURL, prometheusURL } = this?.value?.status?.dashboardValues;

      return {
        alertmanagerURL: this.makeRelativeURL(alertmanagerURL),
        grafanaURL:      this.makeRelativeURL(grafanaURL),
        prometheusURL:   this.makeRelativeURL(prometheusURL)
      };
    },
    monitoringNamespace() {
      // arbitrarily picking the alertmanagerURL here, they're all going to be the same.
      return this.pullKeyFromUrl(this.relativeDashboardValues.alertmanagerURL, 'namespaces');
    },
    alertServiceEndpoint() {
      return this.pullServiceEndpointFromUrl(this.relativeDashboardValues.alertmanagerURL);
    },
    alertServiceEndpointEnabled() {
      return this.checkEndpointEnabled(this.alertServiceEndpoint);
    },
    grafanaServiceEndpoint() {
      return this.pullServiceEndpointFromUrl(this.relativeDashboardValues.grafanaURL);
    },
    grafanaServiceEndpointEnabled() {
      return this.checkEndpointEnabled(this.grafanaServiceEndpoint);
    },
    prometheusServiceEndpoint() {
      return this.pullServiceEndpointFromUrl(this.relativeDashboardValues.prometheusURL);
    },
    prometheusServiceEndpointEnabled() {
      return this.checkEndpointEnabled(this.prometheusServiceEndpoint);
    }
  },
  methods: {
    async fetchDeps() {
      const hash = await allHash({ endpoints: this.$store.dispatch('cluster/findAll', { type: ENDPOINTS }) });

      this.endpointsHash = hash.endpoints;

      this.loadingEndpoints = false;
    },
    checkEndpointEnabled(endpointString) {
      if (this.endpointsHash.length === 0) {
        return false;
      }
      const endpoint = this.endpointsHash.find((endpoint) => {
        return endpoint.id === `${ this.monitoringNamespace }/${ endpointString }`;
      });

      return !isEmpty(endpoint) && !isEmpty(endpoint?.subsets);
    },
    makeRelativeURL(url) {
      if (!url) {
        return '';
      }

      // most of the downstream components that use these URL expect the everything before and including the clusterid stripped out of the URL
      const parsedUrl = parseUrl(url);
      // we really just need the remaining bit of the url but the destructure makes it clear what we're leaving behind
      // eslint-disable-next-line no-unused-vars
      const [_empty, _k8s, _clusters, _clusterId, ...restUrl] = parsedUrl.relative.split('/');
      // the above processing strips out the leading '/' which we need
      const relativeUrl = `/${ restUrl.join('/') }`;

      return relativeUrl;
    },
    pullKeyFromUrl(url = '', key) {
      const splitUrl = url.split('/');
      const keyIndex = splitUrl.indexOf(key);

      // the value we're looking for is going to be at the index immediately after the key
      return splitUrl[keyIndex + 1];
    },
    pullServiceEndpointFromUrl(url = '') {
      const serviceString = this.pullKeyFromUrl(url, 'services');

      // string is going to come back as "<protocol>:<serviceEndPoint>:<port>", we don't need the protocol or the port
      return serviceString.split(':')[1];
    },
    showMenu(show) {
      if (this.$refs.popover) {
        if (show) {
          this.$refs.popover.show();
        } else {
          this.$refs.popover.hide();
        }
      }
    },
  }
};
</script>

<template>
  <div>
    <Tabbed
      v-if="value.status.dashboardValues"
      class="mt-30"
    >
      <Tab
        name="project-metrics"
        :label="t('monitoring.tabs.projectMetrics')"
        :weight="3"
      >
        <template #default="props">
          <DashboardMetrics
            v-if="props.active && grafanaServiceEndpointEnabled"
            :detail-url="`${relativeDashboardValues.grafanaURL}/d/rancher-pod-1/rancher-pod?orgId=1&kiosk`"
            :summary-url="`${relativeDashboardValues.grafanaURL}/d/rancher-workload-1/rancher-workload?orgId=1&kiosk`"
            graph-height="825px"
            project
          />
        </template>
      </Tab>
      <Tab
        name="active-alarms"
        :label="t('monitoring.overview.alertsList.label')"
        :weight="2"
      >
        <template>
          <AlertTable
            :monitoring-namespace="monitoringNamespace"
            :alert-service-endpoint="alertServiceEndpoint"
          />
        </template>
      </Tab>
      <template #tab-row-extras>
        <div class="tab-row-footer">
          <div
            class="resources-dropdown"
            :class="{disabled: !prometheusServiceEndpointEnabled}"
            tabindex="0"
            @blur="showMenu(false)"
            @click="showMenu(true)"
            @focus.capture="showMenu(true)"
          >
            <v-popover
              ref="popover"
              placement="bottom-end"
              offset="-10"
              trigger="manual"
              :delay="{show: 0, hide: 0}"
              :popper-options="{modifiers: { flip: { enabled: false } } }"
              :container="false"
            >
              <div class="meta-title">
                {{ t('monitoring.tabs.prometheus') }} <i class="icon icon-chevron-down" />
              </div>
              <template
                slot="popover"
                class="resources-status-list"
              >
                <ul
                  class="list-unstyled dropdown"
                  @click.stop="showMenu(false)"
                >
                  <li>
                    <a
                      :href="`${value.status.dashboardValues.prometheusURL}/graph`"
                      target="_blank"
                    >{{ t('monitoring.overview.linkedList.prometheusPromQl.label') }} <i class="icon icon-external-link" /></a>
                  </li>
                  <li>
                    <a
                      :href="`${value.status.dashboardValues.prometheusURL}/rules`"
                      target="_blank"
                    >{{ t('monitoring.overview.linkedList.prometheusRules.label') }} <i class="icon icon-external-link" /></a>
                  </li>
                  <li>
                    <a
                      :href="`${value.status.dashboardValues.prometheusURL}/targets`"
                      target="_blank"
                    >{{ t('monitoring.overview.linkedList.prometheusTargets.label') }} <i class="icon icon-external-link" /></a>
                  </li>
                </ul>
              </template>
            </v-popover>
          </div>
          <a
            :class="{disabled: !grafanaServiceEndpointEnabled}"
            :href="value.status.dashboardValues.grafanaURL"
            target="_blank"
          > {{ t('monitoring.overview.linkedList.grafana.label') }} <i class="icon icon-external-link" /></a>
          <a
            :class="{disabled: !alertServiceEndpointEnabled}"
            :href="value.status.dashboardValues.alertmanagerURL"
            target="_blank"
          > {{ t('monitoring.overview.linkedList.alertManager.label') }} <i class="icon icon-external-link" /></a>
        </div>
      </template>
    </Tabbed>
    <div v-else>
      <Banner color="error">
        {{ `${ t('monitoring.projectMonitoring.detail.error') }${ value.status.statusMessage || t('generic.unknown') }` }}
      </Banner>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .tab-row-footer {
    list-style: none;
    padding: 0;
    margin-left: auto;
    display: flex;
    flex-direction: row;

    A, .resources-dropdown {
      color: var(--link);
      display: flex;
      align-items: center;
      padding: 10px 15px;
      &.disabled {
        cursor: not-allowed;
        pointer-events: none;
        filter: grayscale(1);
        color: var(--muted);
      }
    }
  }
  .resources-dropdown {
      li {
          display: flex;
          justify-content: space-between;
          margin: 10px 5px;
      }

      .list-count {
          margin-left: 30px;
      }
  }
</style>
