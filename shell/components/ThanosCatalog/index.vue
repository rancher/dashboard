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
    ui: {
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
    version: {
      type:    String,
      default: '',
    },
    monitoringSettings: {
      type:     Object,
      default:  () => ({}),
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
    const apiToken = this.value.ui?.apiToken || '';

    return {
      thanosQuery:      THANOS_QUERY,
      serviceTypes:     SERVICE_TYPES,
      customAnswers:    {},
      chartVersion:     '',
      clusterId:        '',
      originUi:         {},
      queryTolerations: [],
      useDefaultToken:  !apiToken,
      originClusters:   [],
    };
  },

  computed: {
    upgradeAvailable() {
      return this.enabled && this.latestVersion && this.templateVersion && this.latestVersion !== this.templateVersion;
    },
    chartVersions() {
      if (!this.chartVersion && this.chart?.versions?.length) {
        if (this.version && this.chart.versions.find(obj => obj.version === this.version)) {
          this.$set(this, 'chartVersion', this.version);
        } else {
          this.$set(this, 'chartVersion', this.chart.versions[0].version);
        }
      }

      return uniqBy(this.chart?.versions || [], 'version').map(v => ({
        label: v.version,
        value: v.version,
      })).sort();
    },
    apiToken: {
      get() {
        return this.value.ui?.apiToken;
      },
      set(value) {
        if (this.useDefaultToken) {
          this.value.ui.apiToken = '';
        }

        this.value.ui.apiToken = value;
      }
    },
  },

  methods: {
    updateCluster(clusterId) {
      this.$router.push({
        name:   this.$route.name,
        params: { cluster: clusterId }
      });
    },
    validate() {
      const errors = this.value.errors || [];

      if (!this.useDefaultToken && !this.value.ui.apiToken) {
        errors.push(this.t('validation.required', { key: this.t('globalMonitoringPage.token.custom.label') }, true));
      }

      this.value.errors = errors;

      if (this.$refs.objectStorage) {
        this.$refs.objectStorage.validate();
      }
    },
    updateCustomAnswers() {
      const ui = this.removeCustomAnswers();

      Object.keys(this.customAnswers).forEach((key) => {
        ui[key] = this.customAnswers[key];
      });

      this.value.ui = ui;
    },
    removeCustomAnswers() {
      const newUi = {};

      Object.keys(this.ui).forEach((key) => {
        newUi[key] = this.value.ui[key];
      });

      return newUi;
    },
    getCustomAnswers() {
      const customAnswers = {};

      Object.keys(this.value.ui).forEach((key) => {
        if (this.ui[key] === undefined) {
          customAnswers[key] = this.value.ui[key];
        }
      });

      this.$set(this, 'customAnswers', customAnswers);
    },
    updateQueryTolerations(inputVal) {
      this.$set(this.value.thanos.query, 'tolerations', inputVal.map((item) => {
        delete item.vKey;

        return item;
      }));
    },
    updateApiToken(val) {
      this.$emit('updateUseDefaultToken', val);
      if (this.useDefaultToken) {
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
      this.getCustomAnswers();
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
      >
        <div class="row mb-20">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.global.clusterId"
              :mode="mode"
              :disabled="installed"
              required
              :options="originClusters.map(c=>{c.value=c.id; return c;})"
              option-key="id"
              option-label="spec.displayName"
              :label="t('globalMonitoringPage.cluster')"
              @input="updateCluster"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="chartVersion"
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
          <div class="col span-6">
            <RadioGroup
              v-model="useDefaultToken"
              name="defaultTokenEnabled"
              :mode="mode"
              :labels="[t('generic.yes'), t('generic.no')]"
              :options="[true, false]"
              @input="updateApiToken"
            />
          </div>
          <div
            v-if="!useDefaultToken"
            class="col span-6"
          >
            <LabeledInput
              v-model="apiToken"
              required
              :mode="mode"
              :label="t('globalMonitoringPage.token.custom.label')"
              :placeholder="t('globalMonitoringPage.token.custom.placeholder')"
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
        >
          <Reservation
            :value="value"
            :component="thanosQuery"
            class="mb-20"
            resources-key="thanos.query.resources"
            @updateWarning="$emit('updateWarning')"
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
        >
          <ObjectStorage
            ref="objectStorage"
            :value="value"
            :mode="mode"
            @updateWarning="$emit('updateWarning')"
          />
        </Tab>
        <Tab
          name="grafana"
          label-key="globalMonitoringPage.grafana.header"
          :weight="96"
        >
          <GlobalDashboard
            :value="value"
            :mode="mode"
            @updateWarning="$emit('updateWarning')"
          />
        </Tab>
        <Tab
          name="ceritificate"
          label-key="globalMonitoringPage.tls.header"
          :weight="95"
        >
          <Certificate
            :value="value"
            :mode="mode"
          />
        </Tab>
        <Tab
          name="customAnswers"
          label-key="globalMonitoringPage.customAnswers.title"
          :weight="94"
        >
          <h3>{{ t('globalMonitoringPage.customAnswers.answer.label') }}</h3>
          <div class="row mb-20">
            <KeyValue
              v-model="customAnswers"
              :mode="mode"
              :read-allowed="false"
              :protip="true"
              :add-label="t('globalMonitoringPage.customAnswers.addAnswerLabel')"
              @input="updateCustomAnswers"
            />
          </div>
        </Tab>
      </template>
    </Tabbed>
  </div>
</template>
