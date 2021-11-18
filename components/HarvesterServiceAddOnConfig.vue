<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { _CREATE } from '@/config/query-params';
import { get } from '@/utils/object';

const HARVESTER_ADD_ON_CONFIG = [{
  variableName: 'ipam',
  key:          'cloudprovider.harvesterhci.io/ipam',
  default:      'dhcp'
}, {
  variableName: 'healthcheckPort',
  key:          'cloudprovider.harvesterhci.io/healthcheck-port',
  default:      '',
}, {
  variableName: 'healthCheckSuccessThreshold',
  key:          'cloudprovider.harvesterhci.io/healthcheck-success-threshold',
  default:      1,
}, {
  variableName: 'healthCheckFailureThreshold',
  key:          'cloudprovider.harvesterhci.io/healthcheck-failure-threshold',
  default:      3,
}, {
  variableName: 'healthCheckPeriod',
  key:          'cloudprovider.harvesterhci.io/healthcheck-periodseconds',
  default:      5,
}, {
  variableName: 'healthCheckTimeout',
  key:          'cloudprovider.harvesterhci.io/healthcheck-timeoutseconds',
  default:      3,
}];

export default {
  components: {
    LabeledInput,
    LabeledSelect,
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    registerBeforeHook: {
      type:    Function,
      default: null
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'harvesterWillSave');
    }
  },

  data() {
    const harvesterAddOnConfig = {};

    HARVESTER_ADD_ON_CONFIG.forEach((c) => {
      harvesterAddOnConfig[c.variableName] = this.value.metadata.annotations[c.key] || c.default;
    });

    return { ...harvesterAddOnConfig };
  },

  computed: {
    ipamOptions() {
      return [{
        label: 'dhcp',
        value: 'dhcp',
      }, {
        label: 'pool',
        value: 'pool',
      }];
    },
  },

  methods: {
    willSave() {
      const errors = [];

      if (!this.healthcheckPort) {
        errors.push(this.t('validation.required', { key: this.t('harvester.service.healthCheckPort.label') }, true));
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      }

      HARVESTER_ADD_ON_CONFIG.forEach((c) => {
        this.value.metadata.annotations[c.key] = String(get(this, c.variableName));
      });
    },
  },
};
</script>

<template>
  <div>
    <div class="row mt-30">
      <div class="col span-6">
        <LabeledInput
          v-model="healthcheckPort"
          :mode="mode"
          required
          type="number"
          :label="t('harvester.service.healthCheckPort.label')"
          :tooltip="t('harvester.service.healthCheckPort.description')"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="ipam"
          :mode="mode"
          :options="ipamOptions"
          :label="t('harvester.service.ipam.label')"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="healthCheckSuccessThreshold"
          :mode="mode"
          type="number"
          :label="t('harvester.service.healthCheckSuccessThreshold.label')"
          :tooltip="t('harvester.service.healthCheckSuccessThreshold.description')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="healthCheckFailureThreshold"
          :mode="mode"
          type="number"
          :label="t('harvester.service.healthCheckFailureThreshold.label')"
          :tooltip="t('harvester.service.healthCheckFailureThreshold.description')"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <LabeledInput
          v-model="healthCheckPeriod"
          :mode="mode"
          type="number"
          :label="t('harvester.service.healthCheckPeriod.label')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="healthCheckTimeout"
          :mode="mode"
          type="number"
          :label="t('harvester.service.healthCheckTimeout.label')"
        />
      </div>
    </div>
  </div>
</template>
