<script>
import UnitInput from '@shell/components/form/UnitInput';
import { _EDIT } from '@shell/config/query-params';
import { get, set } from '@shell/utils/object';

export const answers = {
  bucketName: 'thanos.objectConfig.config.bucket',
  endpoint:   'thanos.objectConfig.config.endpoint',
  accessKey:  'thanos.objectConfig.config.access_key',
  secretKey:  'thanos.objectConfig.config.secret_key'
};

export default {
  props: {
    mode: {
      type:    String,
      default: _EDIT
    },
    value: {
      type:     Object,
      required: true,
    },
    component: {
      type:    String,
      default: '',
    },
    resourcesKey: {
      type:     String,
      required: true,
    },
    fvGetAndReportPathRules: {
      type:    Function,
      default: () => {},
    },
  },

  components: { UnitInput },

  data() {
    return {
      limits: {
        cpu:    '200m',
        memory: '200Mi',
      },
      requests: {
        cpu:    '100m',
        memory: '100Mi',
      },
    };
  },

  watch: { },

  methods: {
    get,
    set,
    initValues() {
      this.$set(this, 'limits', {
        cpu:    this.initValue('limits.cpu'),
        memory: this.initValue('limits.memory'),
      });
      this.$set(this, 'requests', {
        cpu:    this.initValue('requests.cpu'),
        memory: this.initValue('requests.memory'),
      });
    },

    initValue(key) {
      return this.get(this.value, `${ this.resourcesKey }.${ key }`);
    },
    updateLimits(a) {
      const {
        cpu,
        memory,
      } = this.limits;

      this.set(this.value, `${ this.resourcesKey }.limits.cpu`, cpu);
      this.set(this.value, `${ this.resourcesKey }.limits.memory`, memory);
    },
    updateRequests() {
      const {
        cpu,
        memory,
      } = this.requests;

      this.set(this.value, `${ this.resourcesKey }.requests.cpu`, cpu);
      this.set(this.value, `${ this.resourcesKey }.requests.memory`, memory);
    },
  },

  mounted() {
    this.initValues();
  }

};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <UnitInput
          v-model="limits.cpu"
          :mode="mode"
          required
          :label="t('formReservation.limitCpu.label', {component})"
          :placeholder="t('formReservation.limitCpu.placeholder')"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          :fv-get-and-report-path-rules="fvGetAndReportPathRules"
          :rules="fvGetAndReportPathRules(`${resourcesKey}.limits.cpu`)"
          @input="updateLimits"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="limits.memory"
          :mode="mode"
          required
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          :label="t('formReservation.limitMemory.label', {component})"
          :placeholder="t('formReservation.limitMemory.placeholder')"
          :fv-get-and-report-path-rules="fvGetAndReportPathRules"
          :rules="fvGetAndReportPathRules(`${resourcesKey}.limits.memory`)"
          @input="updateLimits"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <UnitInput
          v-model="requests.cpu"
          required
          :mode="mode"
          :input-exponent="-1"
          :output-modifier="true"
          :base-unit="t('suffix.cpus')"
          :label="t('formReservation.requestCpu.label', {component})"
          :placeholder="t('formReservation.requestCpu.placeholder')"
          :fv-get-and-report-path-rules="fvGetAndReportPathRules"
          :rules="fvGetAndReportPathRules(`${resourcesKey}.requests.cpu`)"
          @input="updateRequests"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          v-model="requests.memory"
          required
          :placeholder="t('formReservation.requestMemory.placeholder')"
          :label="t('formReservation.requestMemory.label', {component})"
          :mode="mode"
          :input-exponent="2"
          :increment="1024"
          :output-modifier="true"
          :fv-get-and-report-path-rules="fvGetAndReportPathRules"
          :rules="fvGetAndReportPathRules(`${resourcesKey}.requests.memory`)"
          @input="updateRequests"
        />
      </div>
    </div>
  </div>
</template>
