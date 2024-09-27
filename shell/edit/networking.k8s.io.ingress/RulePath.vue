<script>
import InputWithSelect from '@shell/components/form/InputWithSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import Select from '@shell/components/form/Select';
import { get, set } from '@shell/utils/object';
import debounce from 'lodash/debounce';

export default {
  emits:      ['update:value', 'remove'],
  components: {
    InputWithSelect, LabeledInput, Select
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    serviceTargets: {
      type:    Array,
      default: () => []
    },
    ingress: {
      type:     Object,
      required: true
    },
    rules: {
      default: () => ({
        path:   [],
        port:   [],
        target: []
      }),
      type: Object,
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
    set(this.value.backend, this.ingress.serviceNamePath, get(this.value.backend, this.ingress.serviceNamePath) || '');
    set(this.value.backend, this.ingress.servicePortPath, get(this.value.backend, this.ingress.servicePortPath) || '');

    const serviceName = get(this.value.backend, this.ingress.serviceNamePath);
    const servicePort = get(this.value.backend, this.ingress.servicePortPath);

    return {
      pathTypes, serviceName, servicePort, pathType: this.value.pathType, path: this.value.path
    };
  },
  computed: {
    portOptions() {
      const service = this.serviceTargets.find((s) => s.label === this.serviceName);

      return service?.ports || [];
    },
    serviceTargetStatus() {
      const serviceName = this.serviceName?.label || this.serviceName;
      const isValueAnOption = !serviceName || this.serviceTargets.find((target) => serviceName === target.value);

      return isValueAnOption ? null : 'warning';
    },
    serviceTargetTooltip() {
      if (this.serviceTargetStatus === 'warning' ) {
        return this.t('ingress.rules.target.doesntExist');
      }

      return this.t('ingress.rules.target.tooltip');
    },
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
    this.queueUpdatePathTypeAndPath = debounce(this.updatePathTypeAndPath, 500);
  },
  methods: {
    update() {
      const servicePort = Number.parseInt(this.servicePort) || this.servicePort;
      const serviceName = this.serviceName.label || this.serviceName;
      const out = {
        id: this.value.id, backend: {}, path: this.path, pathType: this.pathType
      };

      set(out.backend, this.ingress.servicePortPath, servicePort);
      set(out.backend, this.ingress.serviceNamePath, serviceName);

      this.$emit('update:value', out);
    },
    updatePathTypeAndPath(values) {
      this.path = values.text;
      this.pathType = values.selected;
      this.update();
    },
    focus() {
      this.$refs.first.focus();
    },
    remove(ev) {
      ev.preventDefault();
      this.$emit('remove');
    }
  }
};
</script>
<template>
  <div class="rule-path row">
    <div
      v-if="ingress.showPathType"
      class="col span-6"
    >
      <InputWithSelect
        ref="first"
        class="path-type"
        :options="pathTypes"
        :placeholder="t('ingress.rules.path.placeholder', undefined, true)"
        :select-value="value.pathType"
        :text-value="value.path"
        :searchable="false"
        :text-rules="rules.path"
        @update:value="queueUpdatePathTypeAndPath"
      />
    </div>
    <div
      v-else
      class="col span-4"
    >
      <input
        ref="first"
        v-model="path"
        :placeholder="t('ingress.rules.path.placeholder', undefined, true)"
        @input="queueUpdate"
      >
    </div>
    <div
      class="col"
      :class="{'span-3': ingress.showPathType, 'span-4': !ingress.showPathType}"
    >
      <Select
        v-model:value="serviceName"
        :options="serviceTargets"
        :status="serviceTargetStatus"
        :taggable="true"
        :searchable="true"
        :tooltip="serviceTargetTooltip"
        :hover-tooltip="true"
        @update:value="servicePort = ''; queueUpdate();"
      />
    </div>
    <div
      class="col"
      :class="{'span-2': ingress.showPathType, 'span-3': !ingress.showPathType}"
      :style="{'margin-right': '0px'}"
    >
      <LabeledInput
        v-if="portOptions.length === 0"
        v-model:value="servicePort"
        class="fullHeightInput"
        :placeholder="t('ingress.rules.port.placeholder')"
        :rules="rules.port"
        @update:value="queueUpdate"
      />
      <Select
        v-else
        v-model:value="servicePort"
        :options="portOptions"
        :placeholder="t('ingress.rules.port.placeholder')"
        :rules="rules.port"
        @update:value="queueUpdate"
      />
    </div>
    <button
      class="btn btn-sm role-link col"
      @click="remove"
    >
      {{ t('ingress.rules.removePath') }}
    </button>
  </div>
</template>
<style lang="scss" scoped>
// TODO #11952: Correct deep statement
$row-height: 40px;
.rule-path {
  :deep(.labeled-input) {
    padding: 0 !important;
    height: 100%;

    input.no-label {
      height: calc($row-height - 2px);
      padding: 10px;
    }
  }

  :deep(.col), INPUT {
    height: $row-height;
  }
  &, :deep(.input-container) {
    height: $row-height;
  }

  :deep(.input-container) :deep(.in-input.unlabeled-select) {
    width: initial;
  }

  button {
    line-height: $row-height;
  }

  :deep(.v-select) INPUT {
    height: 50px;
  }
  :deep(.labeled-input) {
    padding-top: 6px;
  }

  :deep(.unlabeled-select) {
    height: 100%;
    min-width: 200px;
  }
}
</style>
