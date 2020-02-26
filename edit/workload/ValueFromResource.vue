<script>
import { CONFIG_MAP, SECRET } from '../../config/types';
import { get } from '../../utils/object';
import LabeledSelect from '@/components/form/LabeledSelect';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: {
    LabeledSelect,
    LabeledInput
  },
  props:      {
    mode: {
      type:    String,
      default: 'create'
    },
    row: {
      type:    Object,
      default: () => {
        return { valueFrom: {} };
      }
    },
    namespace: {
      type:     String,
      default: 'default'
    },
    allConfigMaps: {
      type:    Array,
      default: () => []
    },
    allSecrets: {
      type:    Array,
      default: () => []
    }
  },
  data() {
    const typeOpts = [
      { value: 'resourceFieldRef', label: 'Resource' },
      { value: 'configMapKeyRef', label: 'ConfigMap' },
      { value: 'secretKeyRef', label: 'Secret key' },
      { value: 'fieldRef', label: 'Field' },
      { value: 'secretRef', label: 'Secret' }];

    let type;

    if (this.row.valueFrom) {
      type = Object.keys(this.row.valueFrom)[0];
    } else {
      type = 'secretRef';
    }
    let refName;
    let name;
    let fieldPath;
    let referenced = {};
    let key;

    switch (type) {
    case 'resourceFieldRef':
      name = this.row.name;
      type = Object.keys(this.row.valueFrom)[0];
      referenced = this.row.valueFrom[type].containerName;
      key = this.row.valueFrom[type].resource || '';
      refName = referenced;
      break;
    case 'configMapKeyRef':
      name = this.row.name;
      type = Object.keys(this.row.valueFrom)[0];
      key = this.row.valueFrom[type].key || '';
      refName = this.row.valueFrom[type].name;
      if (!refName.includes('/')) {
        refName = `${ this.namespace }/${ refName }`;
      }

      this.getReferenced(refName, CONFIG_MAP);
      break;
    case 'secretRef':
      name = this.row.prefix;
      type = 'secretRef';
      refName = this.row[type].name;
      if (!refName.includes('/')) {
        refName = `${ this.namespace }/${ refName }`;
      }
      this.getReferenced(refName, SECRET);
      break;
    case 'secretKeyRef':
      name = this.row.name;
      type = Object.keys(this.row.valueFrom)[0];
      key = this.row.valueFrom[type].key || '';
      refName = this.row.valueFrom[type].name;
      if (!refName.includes('/')) {
        refName = `${ this.namespace }/${ refName }`;
      }
      this.getReferenced(refName, SECRET);
      break;
    default:
      referenced = {};
      fieldPath = get(this.row.valueFrom, `${ type }.fieldPath`) || '';
      name = this.row.name;
    }

    return {
      typeOpts, type, refName, referenced, secrets:    this.allSecrets, keys:       [], key, fieldPath, name
    };
  },
  computed: {
    sourceOptions() {
      if (this.type === 'configMapKeyRef') {
        return this.allConfigMaps.filter(map => map.metadata.namespace === this.namespace);
      } else if (this.type === 'secretRef' || this.type === 'secretKeyRef') {
        return this.allSecrets.filter(secret => secret.metadata.namespace === this.namespace);
      } else {
        return [];
      }
    },
    referencedID: {
      get() {
        return this.referenced.id;
      },
      set(neu) {
        this.referenced = { id: neu };
      }
    }
  },
  watch: {
    type() {
      this.referenced = {};
    },

    referenced(neu, old) {
      if (Object.keys(old).length) {
        this.key = '';
      }
      if (neu) {
        if (neu.type === SECRET || neu.type === CONFIG_MAP) {
          this.keys = Object.keys(neu.data);
        }
      }
    },
  },
  methods: {
    async  getReferenced(name, type) {
      const resource = await this.$store.dispatch('cluster/find', { id: name, type });

      this.referenced = resource;
    },

    updateRow() {
      const out = { name: this.name };
      const old = { ...this.row };

      switch (this.type) {
      case 'configMapKeyRef':
      case 'secretKeyRef':
        out.valueFrom = {
          [this.type]: {
            key:      this.key, name:     this.referencedID, optional: false
          }
        };
        break;
      case 'resourceFieldRef':
        out.valueFrom = {
          [this.type]: {
            containerName: this.refName, divisor:       0, resource:      this.key
          }
        };
        break;
      case 'fieldRef':
        out.valueFrom = { [this.type]: { apiVersion: 'v1', fieldPath: this.fieldPath } };
        break;
      default:
        delete out.name;
        out.prefix = this.name;
        out[this.type] = { name: this.referencedID, optional: false };
      }
      this.$emit('input', { value: out, old });
    }
  }
};
</script>

<template>
  <div class="row" @input="updateRow">
    <div class="col span-2">
      <LabeledSelect
        v-model="type"
        :multiple="false"
        :options="typeOpts"
        label="Type"
        :mode="mode"
        @input="updateRow"
      />
    </div>
    <template v-if="type === 'configMapKeyRef' || type === 'secretRef' || type === 'secretKeyRef'">
      <div class="col span-3">
        <LabeledSelect
          v-model="referenced"
          :options="sourceOptions"
          :multiple="false"
          label="Source"
          option-label="id"
          :mode="mode"
          @input="updateRow"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model="key"
          :disabled="type==='secretRef'"
          :options="keys"
          :multiple="false"
          label="Key"
          :mode="mode"
          @input="updateRow"
        />
      </div>
    </template>
    <template v-else-if="type==='resourceFieldRef'">
      <div class="col span-3">
        <LabeledInput v-model="refName" label="Source" placeholder="e.g. my-container" :mode="mode" />
      </div>

      <div class="col span-3">
        <LabeledInput v-model="key" label="Key" placeholder="e.g. requests.cpu" :mode="mode" />
      </div>
    </template>
    <template v-else>
      <div class="col span-3">
        <LabeledInput v-model="fieldPath" label="Source" placeholder="e.g. requests.cpu" :mode="mode" />
      </div>

      <div class="col span-3">
        <LabeledInput value="n/a" label="Key" placeholder="e.g. requests.cpu" disabled :mode="mode" />
      </div>
    </template>
    <div class="col">
      as
    </div>
    <LabeledInput v-model="name" label="Prefix or Alias" :mode="mode" />
  </div>
</template>

<style lang ="scss" scoped>
  .row{
    display: flex;
    align-items: center;
  }
</style>
