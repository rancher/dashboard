<script>
import { CONFIG_MAP, SECRET, NAMESPACE } from '@shell/config/types';
import { get } from '@shell/utils/object';
import { _VIEW } from '@shell/config/query-params';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@rc/Form/LabeledInput';
import { ref, watch } from 'vue';

export default {
  emits: ['update:value', 'remove'],

  components: {
    LabeledSelect,
    LabeledInput
  },

  props: {
    mode: {
      type:    String,
      default: 'create'
    },
    value: {
      type:    Object,
      default: () => {
        return { valueFrom: {} };
      }
    },
    options: {
      type:    Array,
      default: () => {
        return [
          { value: 'simple', label: 'Key/Value Pair' },
          { value: 'resourceFieldRef', label: 'Resource' },
          { value: 'configMapKeyRef', label: 'ConfigMap Key' },
          { value: 'secretKeyRef', label: 'Secret Key' },
          { value: 'fieldRef', label: 'Pod Field' },
          { value: 'secretRef', label: 'Secret' },
          { value: 'configMapRef', label: 'ConfigMap' },
        ];
      },
    },
    allConfigMaps: {
      type:    Array,
      default: () => []
    },
    allSecrets: {
      type:    Array,
      default: () => []
    },
    // filter resource options by namespace(s) selected in top nav
    namespaced: {
      type:    Boolean,
      default: true
    },
    loading: {
      default: false,
      type:    Boolean
    },
  },

  data() {
    return {
      secrets:         this.allSecrets,
      resourceKeyOpts: ['limits.cpu', 'limits.ephemeral-storage', 'limits.memory', 'requests.cpu', 'requests.ephemeral-storage', 'requests.memory'],
    };
  },

  setup(props, { emit }) {
    const type = ref(null);

    if (props.value.secretRef) {
      type.value = 'secretRef';
    } else if (props.value.configMapRef) {
      type.value = 'configMapRef';
    } else if (props.value.value) {
      type.value = 'simple';
    } else if (props.value.valueFrom) {
      type.value = Object.keys((props.value.valueFrom))[0] || props.options[0].value || 'simple';
    }

    const refName = ref('');
    const name = ref('');
    const fieldPath = ref('');
    const referenced = ref(null);
    const key = ref(null);
    const valStr = ref('');
    const keys = ref([]);

    switch (type.value) {
    case 'resourceFieldRef':
      name.value = props.value.name;
      refName.value = props.value.valueFrom?.[type.value]?.containerName;
      key.value = props.value.valueFrom?.[type.value]?.resource || '';
      break;
    case 'configMapKeyRef':
      name.value = props.value.name;
      key.value = props.value.valueFrom?.[type.value]?.key || '';
      refName.value = props.value.valueFrom?.[type.value]?.name;
      referenced.value = props.allConfigMaps.filter((resource) => {
        return resource.metadata.name === refName.value;
      })[0];
      if (referenced.value && referenced.value.data) {
        keys.value.push(...Object.keys(referenced.value.data));
      }
      break;
    case 'secretRef':
    case 'configMapRef':
      name.value = props.value.prefix;
      refName.value = props.value[type.value]?.name;
      break;
    case 'secretKeyRef':
      name.value = props.value.name;
      key.value = props.value.valueFrom?.[type.value]?.key || '';
      refName.value = props.value.valueFrom?.[type.value]?.name;
      referenced.value = props.allSecrets.filter((resource) => {
        return resource.metadata.name === refName.value;
      })[0];
      if (referenced.value && referenced.value.data) {
        keys.value.push(...Object.keys(referenced.value.data));
      }
      break;
    case 'fieldRef':
      fieldPath.value = get(props.value.valueFrom, `${ type.value }.fieldPath`) || '';
      name.value = props.value.name;
      break;
    default:
      name.value = props.value.name;
      valStr.value = props.value.value;
      break;
    }

    referenced.value = refName.value;

    const updateRow = () => {
      if (!name.value?.length && !refName.value?.length) {
        if (type.value !== 'fieldRef') {
          emit('update:value', null);

          return;
        }
      }
      let out = { name: name.value || refName.value };

      switch (type.value) {
      case 'configMapKeyRef':
      case 'secretKeyRef':
        out.valueFrom = {
          [type.value]: {
            key: key.value, name: refName.value, optional: false
          }
        };
        break;
      case 'resourceFieldRef':
        out.valueFrom = {
          [type.value]: {
            containerName: refName.value, divisor: 1, resource: key.value
          }
        };
        break;
      case 'fieldRef':
        if (!fieldPath.value || !fieldPath.value.length) {
          out = null; break;
        }
        out.valueFrom = { [type.value]: { apiVersion: 'v1', fieldPath: fieldPath.value } };
        break;
      case 'simple':
        out.value = valStr.value;
        break;
      default:
        delete out.name;
        out.prefix = name.value;
        out[type.value] = { name: refName.value, optional: false };
      }
      emit('update:value', out);
    };

    watch(type, () => {
      referenced.value = null;
      key.value = '';
      refName.value = '';
      keys.value = [];
      key.value = '';
      valStr.value = '';
      fieldPath.value = '';
    });

    watch(referenced, (neu, old) => {
      if (neu) {
        if ((neu.type === SECRET || neu.type === CONFIG_MAP) && neu.data) {
          keys.value = Object.keys(neu.data);
        }
        refName.value = neu?.metadata?.name;
      }
      updateRow();
    });

    return {
      type,
      refName,
      referenced,
      keys,
      key,
      fieldPath,
      name,
      valStr,
      updateRow,
      get,
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    namespaces() {
      if (this.namespaced) {
        const map = this.$store.getters.namespaces();

        return Object.keys(map).filter((key) => map[key]);
      } else {
        const inStore = this.$store.getters['currentStore'](NAMESPACE);

        return this.$store.getters[`${ inStore }/all`](NAMESPACE);
      }
    },

    sourceOptions() {
      if (this.type === 'configMapKeyRef' || this.type === 'configMapRef') {
        return this.allConfigMaps.filter((map) => this.namespaces.includes(map?.metadata?.namespace));
      } else if (this.type === 'secretRef' || this.type === 'secretKeyRef') {
        return this.allSecrets.filter((secret) => this.namespaces.includes(secret?.metadata?.namespace));
      } else {
        return [];
      }
    },

    needsSource() {
      return this.type !== 'simple' && this.type !== 'resourceFieldRef' && this.type !== 'fieldRef' && !!this.type;
    },

    sourceLabel() {
      let out;
      const { type } = this;

      if (!type) {
        return;
      }

      switch (type) {
      case 'secretKeyRef':
      case 'secretRef':
        out = 'workload.container.command.fromResource.secret';
        break;
      case 'configMapKeyRef':
      case 'configMapRef':
        out = 'workload.container.command.fromResource.configMap';
        break;
      default:
        out = 'workload.container.command.fromResource.source.label';
      }

      return this.t(out);
    },

    nameLabel() {
      if (this.type === 'configMapRef' || this.type === 'secretRef') {
        return this.t('workload.container.command.fromResource.prefix');
      } else {
        return this.t('workload.container.command.fromResource.name.label');
      }
    },

    extraColumn() {
      return ['resourceFieldRef', 'configMapKeyRef', 'secretKeyRef'].includes(this.type);
    },

    hideVariableName() {
      return this.options?.find((opt) => opt.value === this.type)?.hideVariableName || false;
    }
  },
};
</script>

<template>
  <div class="var-row">
    <div class="type">
      <LabeledSelect
        v-model:value="type"
        :mode="mode"
        :multiple="false"
        :options="options"
        option-label="label"
        :searchable="false"
        :reduce="e=>e.value"
        :label="t('workload.container.command.fromResource.type')"
        @update:value="updateRow"
      />
    </div>

    <div
      v-if="!hideVariableName"
      class="name"
    >
      <LabeledInput
        v-model:value="name"
        :label="nameLabel"
        :placeholder="t('workload.container.command.fromResource.name.placeholder')"
        :mode="mode"
        @update:value="updateRow"
      />
    </div>

    <div
      v-if="type==='simple'"
      class="single-value"
    >
      <LabeledInput
        v-model:value="valStr"
        :label="t('workload.container.command.fromResource.value.label')"
        :placeholder="t('workload.container.command.fromResource.value.placeholder')"
        :mode="mode"
        @update:value="updateRow"
      />
    </div>

    <template v-else-if="needsSource">
      <div :class="{'single-value': type === 'configMapRef' || type === 'secretRef'}">
        <LabeledSelect
          v-model:value="referenced"
          :options="sourceOptions"
          :multiple="false"
          :get-option-label="opt=>get(opt, 'metadata.name') || opt"
          :get-option-key="opt=>opt.id|| opt"
          :mode="mode"
          :label="sourceLabel"
          :loading="loading"
        />
      </div>
      <div v-if="type!=='secretRef' && type!== 'configMapRef'">
        <LabeledSelect
          v-model:value="key"
          :multiple="false"
          :options="keys"
          :mode="mode"
          option-label="label"
          :label="t('workload.container.command.fromResource.key.label')"
          :loading="loading"
          @update:value="updateRow"
        />
      </div>
    </template>

    <template v-else-if="type==='resourceFieldRef'">
      <div>
        <LabeledInput
          v-model:value="refName"
          :label="t('workload.container.command.fromResource.containerName')"
          :placeholder="t('workload.container.command.fromResource.source.placeholder')"
          :mode="mode"
          @update:value="updateRow"
        />
      </div>
      <div>
        <LabeledSelect
          v-model:value="key"
          :label="t('workload.container.command.fromResource.key.label')"
          :multiple="false"
          :options="resourceKeyOpts"
          :mode="mode"
          :searchable="false"
          :placeholder="t('workload.container.command.fromResource.key.placeholder', null, true)"
          @update:value="updateRow"
        />
      </div>
    </template>

    <template v-else>
      <div class="single-value">
        <LabeledInput
          v-model:value="fieldPath"
          :placeholder="t('workload.container.command.fromResource.key.placeholder', null, true)"
          :label="t('workload.container.command.fromResource.key.label')"
          :mode="mode"
          @update:value="updateRow"
        />
      </div>
    </template>
    <div class="remove">
      <button
        v-if="!isView"
        type="button"
        class="btn role-link"
        @click.stop="$emit('remove')"
      >
        {{ t('generic.remove') }}
      </button>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.var-row{
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 100px;
  grid-column-gap: 20px;
  margin-bottom: 10px;
  align-items: center;

  .single-value {
    grid-column: span 2;
  }

  .remove BUTTON {
    padding: 0px;
  }
}

</style>
