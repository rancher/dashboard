<script>
import { _EDIT } from '@shell/config/query-params';
import Reservation from '@shell/components/Reservation.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Tolerations from '@shell/components/form/Tolerations';
import { STORAGE_CLASS } from '@shell/config/types';
import { random32 } from '@shell/utils/string';

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
  props: {
    mode: {
      type:     String,
      default: _EDIT
    },
    value: {
      type:     Object,
      required: true,
    },
    optionLabel: {
      type:    String,
      default: 'label',
    },
  },

  components: {
    Reservation,
    RadioGroup,
    LabeledInput,
    LabeledSelect,
    KeyValue,
    Tolerations,
  },

  async fetch() {
    const storageClass = await this.$store.dispatch('management/findAll', { type: STORAGE_CLASS });

    const storageClassesOptions = storageClass.map(s => ({
      label: s.id,
      value: s.id
    }));

    storageClassesOptions.unshift({
      label: this.t('globalMonitoringPage.grafana.storageClass.placeholder'),
      value:    '',
    });

    this.storageClassesOptions = storageClassesOptions;
  },

  data() {
    return {
      storageClassesOptions: [],
      grafanaTolerations:    [],
      serviceTypes:          SERVICE_TYPES,
    };
  },

  methods: {
    updateGrafanaTolerations(inputVal) {
      this.$set(this.value.grafana, 'tolerations', inputVal.map((item) => {
        delete item.vKey;

        return item;
      }));
    },
    initTolerations() {
      this.$set(this, 'grafanaTolerations', this.value.grafana.tolerations.map((item) => {
        item.vKey = random32();

        return item;
      }));
    }
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
    <h2>{{ t('globalMonitoringPage.grafana.header') }}</h2>

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.ui.title"
          :mode="mode"
          :label="t('globalMonitoringPage.grafana.title.label')"
          :placeholder="t('globalMonitoringPage.grafana.title.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.ui.tabTitle"
          :mode="mode"
          :label="t('globalMonitoringPage.grafana.tabTitle.label')"
          :placeholder="t('globalMonitoringPage.grafana.tabTitle.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.ui.logo"
          :mode="mode"
          :label="t('globalMonitoringPage.grafana.logo.label')"
          :placeholder="t('globalMonitoringPage.grafana.logo.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.ui.favicon"
          :mode="mode"
          :label="t('globalMonitoringPage.grafana.favicon.label')"
          :placeholder="t('globalMonitoringPage.grafana.favicon.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.ui.serverUrl"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.grafana.serverUrl.label')"
          :placeholder="t('globalMonitoringPage.grafana.serverUrl.placeholder')"
        />
      </div>
    </div>
    <Reservation
      :value="value"
      component="Grafana"
      class="mb-20"
      resources-key="grafana.resources.core"
      @updateWarning="$emit('updateWarning')"
    />

    <h3>{{ t('globalMonitoringPage.grafana.enablePersistence.label') }}</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.grafana.persistence.enabled"
          name="enableGrafanaPersistence"
          :mode="mode"
          :labels="[t('generic.yes'), t('generic.no')]"
          :options="[true, false]"
        />
      </div>
    </div>
    <div
      v-if="value.grafana.persistence.enabled"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model="value.grafana.persistence.size"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.grafana.size.label')"
          :placeholder="t('globalMonitoringPage.grafana.size.placeholder')"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.grafana.persistence.storageClass"
          :mode="mode"
          :label="t('globalMonitoringPage.grafana.storageClass.label')"
          :options="storageClassesOptions"
          :option-label="optionLabel"
          :localized-label="true"
          :placeholder="t('globalMonitoringPage.grafana.storageClass.placeholder')"
        />
      </div>
    </div>

    <h3>{{ t('globalMonitoringPage.grafana.enableGrafanaSidecar.label') }}</h3>
    <div class="row mb-20">
      <div class="col span-6">
        <RadioGroup
          v-model="value.grafana.sidecar.dashboards.enabled"
          name="enableGrafanaSidecar"
          :mode="mode"
          :labels="[t('generic.yes'), t('generic.no')]"
          :options="[true, false]"
        />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.grafana.service.type"
          :mode="mode"
          :label="t('globalMonitoringPage.grafana.serviceType.label')"
          :options="serviceTypes"
          :option-label="optionLabel"
          :localized-label="true"
        />
      </div>
    </div>

    <h3>{{ t('globalMonitoringPage.nodeSelector.helpText', {component: 'Grafana'}) }}</h3>
    <div class="row mb-20">
      <KeyValue
        v-model="value.grafana.nodeSelector"
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
          workload="Grafana"
        />
      </h3>
      <div class="row">
        <Tolerations
          :value="grafanaTolerations"
          :mode="mode"
          @input="updateGrafanaTolerations"
        />
      </div>
    </div>
  </div>
</template>
