<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { _EDIT, _VIEW } from '@/config/query-params';
export default {
  components: { LabeledInput, LabeledSelect },
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
    const { serviceName = '', servicePort = '' } = this.value;

    return { serviceName, servicePort };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    portOptions() {
      const service = this.serviceTargets.find(s => s.label === this.serviceName);

      return service?.ports || [];
    }
  },
  methods: {
    update() {
      const out = { serviceName: this.serviceName, servicePort: this.servicePort };

      this.$emit('input', out);
    }
  },
};
</script>
<template>
  <div>
    <div class="row text-warning" :class="{'pl-10': isView}">
      {{ t('ingress.defaultBackend.warning') }}
    </div>
    <div v-if="serviceName || !isView" class="row">
      <div class="col span-4">
        <LabeledSelect
          v-model="serviceName"
          :mode="mode"
          :label="t('ingress.defaultBackend.targetService.label')"
          :options="serviceTargets"
          option-label="label"
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
          :options="portOptions"
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
