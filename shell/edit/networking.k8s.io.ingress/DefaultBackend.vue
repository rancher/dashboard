<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import Banner from '@shell/components/Banner';
import { get, set } from '@shell/utils/object';

export default {
  components: {
    LabeledInput, LabeledSelect, Banner
  },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    serviceTargets:  {
      type:    Array,
      default: () => []
    },
    mode: {
      type:    String,
      default: _EDIT
    }
  },
  data() {
    const backend = get(this.value.spec, this.value.defaultBackendPath);
    const serviceName = get(backend, this.value.serviceNamePath) || '';
    const servicePort = get(backend, this.value.servicePortPath) || '';

    return { serviceName, servicePort };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    portOptions() {
      const service = this.serviceTargets.find(s => s.label === this.serviceName);

      return service?.ports || [];
    },
    serviceTargetStatus() {
      const isValueAnOption = !this.serviceName || this.serviceTargets.find(target => this.serviceName === target.value);

      return isValueAnOption ? null : 'warning';
    },
    serviceTargetTooltip() {
      return this.serviceTargetStatus === 'warning' ? this.t('ingress.rules.target.doesntExist') : null;
    },
    serviceTargetOptions() {
      return [
        {
          label: this.t('generic.none'),
          value: '',
          ports: []
        },
        ...this.serviceTargets
      ];
    }
  },
  methods: {
    update() {
      const backend = get(this.value.spec, this.value.defaultBackendPath) || {};

      set(backend, this.value.serviceNamePath, this.serviceName);
      set(backend, this.value.servicePortPath, this.servicePort);
      set(this.value.spec, this.value.defaultBackendPath, backend);

      this.$emit('input', this.value);
    }
  },
};
</script>
<template>
  <div>
    <Banner color="warning" :label="t('ingress.defaultBackend.warning')" />
    <div v-if="serviceName || !isView" class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="serviceName"
          :taggable="true"
          :mode="mode"
          :label="t('ingress.defaultBackend.targetService.label')"
          :options="serviceTargetOptions"
          option-label="label"
          :status="serviceTargetStatus"
          :tooltip="serviceTargetTooltip"
          @input="update(); servicePort = ''"
        />
      </div>
      <div class="col span-3" :style="{'margin-right': '0px'}">
        <LabeledInput
          v-if="portOptions.length === 0 || isView"
          v-model.number="servicePort"
          :mode="mode"
          :label="t('ingress.defaultBackend.port.label')"
          :placeholder="t('ingress.defaultBackend.port.placeholder')"
          @input="update"
        />
        <LabeledSelect
          v-else
          v-model="servicePort"
          :mode="mode"
          :options="portOptions"
          :label="t('ingress.defaultBackend.port.label')"
          :placeholder="t('ingress.defaultBackend.port.placeholder')"
          @input="update"
        />
      </div>
    </div>
    <div v-else class="pl-10">
      {{ t('ingress.defaultBackend.noServiceSelected') }}
    </div>
  </div>
</template>
