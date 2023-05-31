<script>
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { _EDIT } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Tolerations from '@shell/components/form/Tolerations';
import Reservation from '@shell/components/Reservation.vue';
import { RadioGroup } from '@components/Form/Radio';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import { random32 } from '@shell/utils/string';
import { uniqBy } from 'lodash';
import GlobalDashboard from './GlobalDashboard';
import ObjectStorage from './ObjectStorage';
import Certificate from './Certificate';
import MonitoringStore from './MonitoringStore';
import { MANAGEMENT } from '@shell/config/types';

const THANOS_QUERY = 'Thanos Query';
const CLUSTER_IP = 'ClusterIP';
const NODE_PORT = 'NodePort';
const LOAD_BALANCER = 'LoadBalancer';
const SERVICE_TYPES = [
  {
    label: 'globalMonitoringPage.svc.clusterIp',
    value: CLUSTER_IP
  },
  {
    label: 'globalMonitoringPage.svc.nodePort',
    value: NODE_PORT
  },
  {
    label: 'globalMonitoringPage.svc.loadBalancer',
    value: LOAD_BALANCER
  }
];

export default {
  name:  'GlobalMonitoring',
  props: {
    mode: {
      type:    String,
      default: _EDIT
    },
    installed: {
      type:    Boolean,
      default: false,
    },
    value: {
      type:     Object,
      required: true,
    },
    chart: {
      type:    Object,
      default: () => ({}),
    },
    optionLabel: {
      type:    String,
      default: 'label',
    },
    monitoringSettings: {
      type:     Object,
      default:  () => ({}),
      required: true,
    },
    tabErrors: {
      type:     Object,
      default:  () => ({}),
      required: true,
    },
    fvGetAndReportPathRules: {
      type:     Function,
      default:  () => {},
      required: true,
    },
  },
  components: {
    Tab,
    Tabbed,
    LabeledSelect,
    KeyValue,
    Tolerations,
    Reservation,
    GlobalDashboard,
    ObjectStorage,
    Certificate,
    RadioGroup,
    LabeledInput,
    MonitoringStore,
  },

  async fetch() {
    this.originClusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });
  },

  data() {
    return {
      thanosQuery:      THANOS_QUERY,
      serviceTypes:     SERVICE_TYPES,
      clusterId:        '',
      originUi:         {},
      queryTolerations: [],
      originClusters:   [],
    };
  },

  computed: {
    upgradeAvailable() {
      return this.enabled && this.latestVersion && this.templateVersion && this.latestVersion !== this.templateVersion;
    },
    chartVersions() {
      return uniqBy(this.chart?.versions || [], 'version').map(v => ({
        label: v.version,
        value: v.version,
      })).sort();
    },
  },

  methods: {
    updateCluster(clusterId) {
      this.$router.push({
        name:   this.$route.name,
        params: { cluster: clusterId }
      });
    },

    updateQueryTolerations(inputVal) {
      this.$set(this.value.thanos.query, 'tolerations', inputVal.map((item) => {
        delete item.vKey;

        return item;
      }));
    },
    updateApiToken(neu) {
      if (neu) {
        this.$set(this.value.ui, 'apiToken', '');
      }
    },

    initTolerations() {
      this.$set(this, 'queryTolerations', this.value.thanos.query.tolerations.map((item) => {
        item.vKey = random32();

        return item;
      }));
    },
  },

  created() {
    if (this?.chart?.id) {
      this.initTolerations();
    }
  }
};
</script>

<template>
  <div>
    <Tabbed
      :side-tabs="true"
      default-tab="general"
    >
      <Tab
        name="general"
        :label="t('monitoring.tabs.general')"
        :weight="99"
        :error="tabErrors.general"
      >
        <div class="row mb-20">
          <div
            class="col span-6"
            data-testid="input-config-clusterId"
          >
            <LabeledSelect
              v-model="value.global.clusterId"
              :mode="mode"
              :disabled="installed"
              required
              :options="originClusters.map(c=>{c.value=c.id; return c;})"
              option-key="id"
              option-label="spec.displayName"
              :label="t('globalMonitoringPage.cluster')"
              :rules="fvGetAndReportPathRules('global.clusterId')"
              @input="updateCluster"
            />
          </div>
          <div
            class="col span-6"
            data-testid="input-config-version"
          >
            <LabeledSelect
              v-model="value.global.version"
              :mode="mode"
              required
              :label="upgradeAvailable ? t('monitoringPage.upgradeAvailable', {version: latestVersion}) : t('globalMonitoringPage.version')"
              :options="chartVersions"
              :option-label="optionLabel"
              @input="$emit('updateVersion', $event)"
            />
          </div>
        </div>

        <h3>{{ t('globalMonitoringPage.token.label') }}</h3>
        <div class="row mb-20">
          <div
            class="col span-6"
            data-testid="input-config-defaultApiToken"
          >
            <RadioGroup
              v-model="value.ui.defaultApiToken"
              name="defaultTokenEnabled"
              :mode="mode"
              :labels="[t('generic.yes'), t('generic.no')]"
              :options="[true, false]"
              @input="updateApiToken"
            />
          </div>
          <div
            v-if="!value.ui.defaultApiToken"
            class="col span-6"
            data-testid="input-config-apiToken"
          >
            <LabeledInput
              v-model="value.ui.apiToken"
              required
              :mode="mode"
              :label="t('globalMonitoringPage.token.custom.label')"
              :placeholder="t('globalMonitoringPage.token.custom.placeholder')"
              :rules="fvGetAndReportPathRules('ui.apiToken')"
            />
          </div>
        </div>

        <MonitoringStore
          v-if="!!chart.id"
          ref="monitoringStore"
          v-model="value"
          :mode="mode"
          :installed="installed"
          :monitoring-settings="monitoringSettings"
        />
      </Tab>
      <template v-if="!!chart.id">
        <Tab
          name="thanos"
          label-key="globalMonitoringPage.thanos.title"
          :weight="98"
          :error="tabErrors.thanos"
        >
          <Reservation
            :value="value"
            :component="thanosQuery"
            class="mb-20"
            resources-key="thanos.query.resources"
            :fv-get-and-report-path-rules="fvGetAndReportPathRules"
          />
          <h3>{{ t('globalMonitoringPage.nodeSelector.helpText', {component: thanosQuery}) }}</h3>
          <div class="row mb-20">
            <KeyValue
              v-model="value.thanos.query.nodeSelector"
              :mode="mode"
              :read-allowed="false"
              :protip="true"
              :add-label="t('globalMonitoringPage.nodeSelector.addSelectorLabel')"
            />
          </div>

          <div class="mb-20">
            <h3 class="mb-20">
              <t
                k="formScheduling.toleration.workloadTitle"
                :workload="thanosQuery"
              />
            </h3>
            <div class="row">
              <Tolerations
                :value="queryTolerations"
                :mode="mode"
                @input="updateQueryTolerations"
              />
            </div>
          </div>

          <div class="row mb-20">
            <div class="col span-6">
              <LabeledSelect
                v-model="value.thanos.query.service.type"
                :mode="mode"
                :label="t('globalMonitoringPage.thanos.serviceType.label')"
                :options="serviceTypes"
                :option-label="optionLabel"
                :localized-label="true"
              />
            </div>
          </div>
        </Tab>
        <Tab
          name="store"
          label-key="globalMonitoringPage.store.title"
          :weight="97"
          :error="tabErrors.store"
        >
          <ObjectStorage
            ref="objectStorage"
            :value="value"
            :mode="mode"
            :fv-get-and-report-path-rules="fvGetAndReportPathRules"
          />
        </Tab>
        <Tab
          name="grafana"
          label-key="globalMonitoringPage.grafana.header"
          :weight="96"
          :error="tabErrors.grafana"
        >
          <GlobalDashboard
            :value="value"
            :mode="mode"
            :fv-get-and-report-path-rules="fvGetAndReportPathRules"
          />
        </Tab>
        <Tab
          name="ceritificate"
          label-key="globalMonitoringPage.tls.header"
          :weight="95"
          :error="tabErrors.ceritificate"
        >
          <Certificate
            :value="value"
            :mode="mode"
          />
        </Tab>
      </template>
    </Tabbed>
  </div>
</template>
