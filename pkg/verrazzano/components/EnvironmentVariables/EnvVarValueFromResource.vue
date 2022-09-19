<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { CONFIG_MAP, SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'EnvVarValueFromReference',
  components: {
    LabeledSelect,
    LabeledInput
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    enableEnvFromOptions: {
      type:    Boolean,
      default: true
    },
  },
  data() {
    let type;

    if (this.value.secretRef) {
      type = 'secretRef';
    } else if (this.value.configMapRef) {
      type = 'configMapRef';
    } else if (this.value.value) {
      type = 'simple';
    } else if (this.value.valueFrom) {
      type = Object.keys((this.value.valueFrom))[0] || 'simple';
    }

    let refName;
    let name;
    let fieldPath;
    let referenced;
    let key;
    let valStr;
    const keys = [];

    switch (type) {
    case 'resourceFieldRef':
      name = this.value.name;
      refName = this.value.valueFrom[type].containerName;
      key = this.value.valueFrom[type].resource || '';
      break;
    case 'configMapKeyRef':
      name = this.value.name;
      key = this.value.valueFrom[type].key || '';
      refName = this.value.valueFrom[type].name;
      referenced = (this.allConfigMaps || []).filter((resource) => {
        return resource.metadata.name === refName;
      })[0];
      if (referenced && referenced.data) {
        keys.push(...Object.keys(referenced.data));
      }
      break;
    case 'secretRef':
    case 'configMapRef':
      name = this.value.prefix;
      refName = this.value[type].name;
      break;
    case 'secretKeyRef':
      name = this.value.name;
      key = this.value.valueFrom[type].key || '';
      refName = this.value.valueFrom[type].name;
      referenced = (this.allSecrets || []).filter((resource) => {
        return resource.metadata.name === refName;
      })[0];
      if (referenced && referenced.data) {
        keys.push(...Object.keys(referenced.data));
      }
      break;
    case 'fieldRef':
      fieldPath = this.get(this.value.valueFrom, `${ type }.fieldPath`) || '';
      name = this.value.name;
      break;
    default:
      name = this.value.name;
      valStr = this.value.value;
      break;
    }

    return {
      namespace:     this.namespacedObject.metadata?.namespace,
      allConfigMaps: {},
      allSecrets:    {},
      referenced:    refName,
      type,
      refName,
      keys,
      key,
      fieldPath,
      name,
      valStr
    };
  },
  async fetch() {
    const requests = { };

    if (this.$store.getters['cluster/schemaFor'](CONFIG_MAP)) {
      requests.configMaps = this.$store.dispatch('management/findAll', { type: CONFIG_MAP });
    }
    if (this.$store.getters['cluster/schemaFor'](SECRET)) {
      requests.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }

    const hash = await allHash(requests);

    if (hash.configMaps) {
      this.sortObjectsByNamespace(hash.configMaps, this.allConfigMaps);
    }
    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
  },
  computed: {
    configMaps() {
      const namespace = this.get(this.namespacedObject, 'metadata.namespace');

      return this.allConfigMaps[namespace] || [];
    },
    secrets() {
      const namespace = this.get(this.namespacedObject, 'metadata.namespace');

      return this.allSecrets[namespace] || [];
    },
    resourceKeyOpts() {
      return [
        'limits.cpu',
        'limits.ephemeral-storage',
        'limits.memory',
        'requests.cpu',
        'requests.ephemeral-storage',
        'requests.memory'
      ];
    },
    typeOptions() {
      const typeOpts = [
        { value: 'simple', label: this.t('verrazzano.common.types.envVars.keyValuePair') },
        { value: 'resourceFieldRef', label: this.t('verrazzano.common.types.envVars.resourceFieldRef') },
        { value: 'configMapKeyRef', label: this.t('verrazzano.common.types.envVars.configMapKeyRef') },
        { value: 'secretKeyRef', label: this.t('verrazzano.common.types.envVars.secretKeyRef') },
        { value: 'fieldRef', label: this.t('verrazzano.common.types.envVars.fieldRef') },
      ];

      if (this.enableEnvFromOptions) {
        typeOpts.push(
          { value: 'secretRef', label: this.t('verrazzano.common.types.envVars.secretRef') },
          { value: 'configMapRef', label: this.t('verrazzano.common.types.envVars.configMapRef') }
        );
      }

      return typeOpts;
    },
    sourceOptions() {
      if (this.type === 'configMapKeyRef' || this.type === 'configMapRef') {
        return this.configMaps;
      } else if (this.type === 'secretKeyRef' || this.type === 'secretRef') {
        return this.secrets;
      } else {
        return [];
      }
    },
    needsSource() {
      return !!this.type && this.type !== 'simple' && this.type !== 'resourceFieldRef' && this.type !== 'fieldRef';
    },
    sourceLabel() {
      let result;
      const { type } = this;

      if (type) {
        let out;

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
          break;
        }

        result = this.t(out);
      }

      return result;
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
  },
  methods: {
    updateRow() {
      if (!this.name?.length && !this.refName?.length) {
        if (this.type !== 'fieldRef') {
          this.$emit('input', null);

          return;
        }
      }
      let out = { name: this.name || this.refName };

      switch (this.type) {
      case 'configMapKeyRef':
      case 'secretKeyRef':
        out.valueFrom = {
          [this.type]: {
            key: this.key, name: this.refName, optional: false
          }
        };
        break;
      case 'resourceFieldRef':
        out.valueFrom = {
          [this.type]: {
            containerName: this.refName, divisor: 1, resource: this.key
          }
        };
        break;
      case 'fieldRef':
        if (!this.fieldPath || !this.fieldPath.length) {
          out = null; break;
        }
        out.valueFrom = { [this.type]: { apiVersion: 'v1', fieldPath: this.fieldPath } };
        break;
      case 'simple':
        out.value = this.valStr;
        break;
      default:
        delete out.name;
        out.prefix = this.name;
        out[this.type] = { name: this.refName, optional: false };
      }
      this.$emit('input', out);
    },
  },
  watch: {
    type() {
      this.referenced = null;
      this.key = '';
      this.refName = '';
      this.keys = [];
      this.key = '';
      this.valStr = '';
      this.fieldPath = '';
    },
    referenced(neu, old) {
      if (neu) {
        if ((neu.type === SECRET || neu.type === CONFIG_MAP) && neu.data) {
          this.keys = Object.keys(neu.data);
        }
        this.refName = neu?.metadata?.name;
      }
      this.updateRow();
    },
  },
};
</script>

<template>
  <div class="var-row">
    <div class="type">
      <LabeledSelect
        v-model="type"
        :mode="mode"
        :multiple="false"
        :options="typeOptions"
        option-label="label"
        :searchable="false"
        :reduce="e=>e.value"
        :label="t('workload.container.command.fromResource.type')"
        @input="updateRow"
      />
    </div>
    <div class="name">
      <LabeledInput
        v-model="name"
        :label="nameLabel"
        :placeholder="t('workload.container.command.fromResource.name.placeholder')"
        :mode="mode"
        @input="updateRow"
      />
    </div>
    <div v-if="type==='simple'" class="single-value">
      <LabeledInput
        v-model="valStr"
        :label="t('workload.container.command.fromResource.value.label')"
        :placeholder="t('workload.container.command.fromResource.value.placeholder')"
        :mode="mode"
        @input="updateRow"
      />
    </div>
    <template v-else-if="needsSource">
      <div :class="{'single-value': type === 'configMapRef' || type === 'secretRef'}">
        <LabeledSelect
          v-model="referenced"
          :options="sourceOptions"
          :multiple="false"
          :get-option-label="opt=>get(opt, 'metadata.name') || opt"
          :get-option-key="opt=>opt.id|| opt"
          :mode="mode"
          :label="sourceLabel"
        />
      </div>
      <div v-if="type!=='secretRef' && type!== 'configMapRef'">
        <LabeledSelect
          v-model="key"
          :multiple="false"
          :options="keys"
          :mode="mode"
          option-label="label"
          :label="t('workload.container.command.fromResource.key.label')"
          @input="updateRow"
        />
      </div>
    </template>
    <template v-else-if="type==='resourceFieldRef'">
      <div>
        <LabeledInput
          v-model="refName"
          :label="t('workload.container.command.fromResource.containerName')"
          :placeholder="t('workload.container.command.fromResource.source.placeholder')"
          :mode="mode"
          @input="updateRow"
        />
      </div>
      <div>
        <LabeledSelect
          v-model="key"
          :label="t('workload.container.command.fromResource.key.label')"
          :multiple="false"
          :options="resourceKeyOpts"
          :mode="mode"
          :searchable="false"
          :placeholder="t('workload.container.command.fromResource.key.placeholder', null, true)"
          @input="updateRow"
        />
      </div>
    </template>
    <template v-else>
      <div class="single-value">
        <LabeledInput
          v-model="fieldPath"
          :placeholder="t('workload.container.command.fromResource.key.placeholder', null, true)"
          :label="t('workload.container.command.fromResource.key.label')"
          :mode="mode"
          @input="updateRow"
        />
      </div>
    </template>
    <button v-if="!isView" type="button" class="btn btn-sm role-link" @click.stop="$emit('remove')">
      {{ t('generic.remove') }}
    </button>
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
}

</style>
