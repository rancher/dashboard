<script>
import InputWithSelect from '@/components/form/InputWithSelect';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { set } from '@/utils/object';

export default {
  components: {
    InputWithSelect, LabeledInput, LabeledSelect
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
    ingress: {
      type:     Object,
      required: true
    }
  },
  data() {
    const pathTypes = [
      'Prefix',
      'Exact',
      'ImplementationSpecific'
    ];

    set(this.value, 'backend', this.value.backend || {});
    set(this.value, 'path', this.value.path || '');
    set(this.value, 'pathType', this.value.pathType || pathTypes[0]);
    set(this.value.backend, this.ingress.serviceNamePath, this.value.backend[this.ingress.serviceNamePath] || '');
    set(this.value.backend, this.ingress.servicePortPath, this.value.backend[this.ingress.servicePortPath] || '');

    return { pathTypes };
  },
  computed: {
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
    serviceName: {
      get() {
        return this.value.backend[this.ingress.serviceNamePath];
      },
      set(value) {
        const newValue = value.label ? value.label : value;

        this.value.backend[this.ingress.serviceNamePath] = newValue;
      }
    },

    servicePort: {
      get() {
        return this.value.backend[this.ingress.servicePortPath];
      },
      set(value) {
        this.value.backend[this.ingress.servicePortPath] = Number.parseInt(value) || value;
      }
    }
  },
  methods: {
    updatePathTypeAndPath(values) {
      this.value.path = values.text;
      this.value.pathType = values.selected;
    }
  }
};
</script>
<template>
  <div class="rule-path row">
    <div v-if="ingress.showPathType" class="col span-6">
      <InputWithSelect
        :options="pathTypes"
        :placeholder="t('ingress.rules.path.placeholder', undefined, true)"
        :select-value="value.pathType"
        :text-value="value.path"
        @input="updatePathTypeAndPath"
      />
    </div>
    <div v-else class="col span-4">
      <input v-model="path" :placeholder="t('ingress.rules.path.placeholder', undefined, true)" @input="update" />
    </div>
    <div class="col" :class="{'span-3': ingress.showPathType, 'span-4': !ingress.showPathType}">
      <LabeledSelect
        v-model="serviceName"
        option-label="label"
        option-key="label"
        :options="serviceTargets"
        :status="serviceTargetStatus"
        :taggable="true"
        :tooltip="serviceTargetTooltip"
        :hover-tooltip="true"
        @input="servicePort = ''"
      />
    </div>
    <div class="col" :class="{'span-2': ingress.showPathType, 'span-3': !ingress.showPathType}" :style="{'margin-right': '0px'}">
      <LabeledInput
        v-if="portOptions.length === 0"
        v-model="servicePort"
        :placeholder="t('ingress.rules.port.placeholder')"
      />
      <LabeledSelect
        v-else
        v-model="servicePort"
        :options="portOptions"
        :placeholder="t('ingress.rules.port.placeholder')"
      />
    </div>
    <button class="btn btn-sm role-link col" @click="$emit('remove')">
      {{ t('ingress.rules.removePath') }}
    </button>
  </div>
</template>
<style lang="scss" scoped>
.rule-path {
  button {
    line-height: 40px;
  }
  input {
    height: 55px;
  }
}
</style>
