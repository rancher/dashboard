<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import DashboardMetrics from '@/components/DashboardMetrics';
import AlertTable from '@/components/AlertTable';
import { parse as parseUrl } from '@/utils/url';

export default {
  components: {
    Tabbed,
    Tab,
    DashboardMetrics,
    AlertTable
  },
  props: {
    value: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    relativeDashboardValues() {
      const { alertmanagerURL, grafanaURL, prometheusURL } = this?.value?.status?.dashboardValues;

      return {
        alertmanagerURL: this.makeRelativeURL(alertmanagerURL),
        grafanaURL:      this.makeRelativeURL(grafanaURL),
        prometheusURL:      this.makeRelativeURL(prometheusURL)
      };
    }
  },
  methods: {
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
    <Tabbed v-if="true" class="mt-30">
      <Tab v-if="true" name="project-metrics" :label="t('monitoring.tabs.projectMetrics')" :weight="3">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="`${relativeDashboardValues.grafanaURL}/d/rancher-pod-1/rancher-pod?orgId=1&kiosk`"
            :summary-url="`${relativeDashboardValues.grafanaURL}/d/rancher-workload-1/rancher-workload?orgId=1&kiosk`"
            graph-height="825px"
            project
          >
          </DashboardMetrics>
        </template>
      </Tab>
      <Tab v-if="true" name="active-alarms" :label="t('monitoring.overview.alertsList.label')" :weight="2">
        <template>
          <AlertTable :alert-manager-url="relativeDashboardValues.alertmanagerURL" />
        </template>
      </Tab>
      <template #tab-row-extras>
        <div class="tab-row-footer">
          <div
            class="resources-dropdown"
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
              <template slot="popover" class="resources-status-list">
                <ul class="list-unstyled dropdown" @click.stop="showMenu(false)">
                  <li>
                    <a :href="`${value.status.dashboardValues.prometheusURL}/graph`" target="_blank">{{ t('monitoring.overview.linkedList.prometheusPromQl.label') }} <i class="icon icon-external-link" /></a>
                  </li>
                  <li>
                    <a :href="`${value.status.dashboardValues.prometheusURL}/rules`" target="_blank">{{ t('monitoring.overview.linkedList.prometheusRules.label') }} <i class="icon icon-external-link" /></a>
                  </li>
                  <li>
                    <a :href="`${value.status.dashboardValues.prometheusURL}/targets`" target="_blank">{{ t('monitoring.overview.linkedList.prometheusTargets.label') }} <i class="icon icon-external-link" /></a>
                  </li>
                </ul>
              </template>
            </v-popover>
          </div>
          <a :href="value.status.dashboardValues.grafanaURL" target="_blank"> {{ t('monitoring.overview.linkedList.grafana.label') }} <i class="icon icon-external-link" /></a>
          <a :href="value.status.dashboardValues.alertmanagerURL" target="_blank"> {{ t('monitoring.overview.linkedList.alertManager.label') }} <i class="icon icon-external-link" /></a>
        </div>
      </template>
    </Tabbed>
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
