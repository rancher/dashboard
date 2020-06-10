<script>
import { CONFIG_MAP, SECRET, NAMESPACE } from '@/config/types';
import { get } from '@/utils/object';
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
    }
  },
  data() {
    const typeOpts = [
      { value: 'resourceFieldRef', label: 'Resource' },
      { value: 'configMapKeyRef', label: 'ConfigMap' },
      { value: 'secretKeyRef', label: 'Secret key' },
      { value: 'fieldRef', label: 'Field' },
      { value: 'secretRef', label: 'Secret' }];

    let type = this.row.secretRef ? 'secretRef' : Object.keys((this.row.valueFrom))[0];

    let refName;
    let name;
    let fieldPath;
    let referenced;
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
      break;
    case 'secretRef':
      name = this.row.prefix;
      type = 'secretRef';
      refName = this.row[type].name;
      break;
    case 'secretKeyRef':
      name = this.row.name;
      type = Object.keys(this.row.valueFrom)[0];
      key = this.row.valueFrom[type].key || '';
      refName = this.row.valueFrom[type].name;
      break;
    case 'fieldRef':
      fieldPath = get(this.row.valueFrom, `${ type }.fieldPath`) || '';
      name = this.row.name;
      break;
    default:
      break;
    }

    return {
      typeOpts, type, refName, referenced: refName, secrets: this.allSecrets, keys: [], key, fieldPath, name
    };
  },
  computed: {

    namespaces() {
      if (this.namespaced) {
        const map = this.$store.getters.namespaces();

        return Object.keys(map).filter(key => map[key]);
      } else {
        return this.$store.getters['cluster/findAll'](NAMESPACE);
      }
    },

    sourceOptions() {
      if (this.type === 'configMapKeyRef') {
        return this.allConfigMaps.filter(map => this.namespaces.includes(map?.metadata?.namespace));
      } else if (this.type === 'secretRef' || this.type === 'secretKeyRef') {
        return this.allSecrets.filter(secret => this.namespaces.includes(secret?.metadata?.namespace));
      } else {
        return [];
      }
    },
  },

  watch: {
    type() {
      this.referenced = null;
    },

    referenced(neu, old) {
      if (old) {
        this.key = '';
      }
      if (neu) {
        if (neu.type === SECRET || neu.type === CONFIG_MAP) {
          this.keys = Object.keys(neu.data);
        }
        this.refName = neu?.metadata?.name;
      }
    },
  },

  mounted() {
    const typeSelect = this.$refs.typeSelect;

    if (typeSelect && this.mode === 'create') {
      typeSelect.open();
    }
  },

  methods: {
    async  getReferenced(name, type) {
      const resource = await this.$store.dispatch('cluster/find', { id: name, type });

      this.referenced = resource;
    },

    updateRow() {
      const out = { name: this.name || this.refName };
      const old = { ...this.row };

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
            containerName: this.refName, divisor: 0, resource: this.key
          }
        };
        break;
      case 'fieldRef':
        out.valueFrom = { [this.type]: { apiVersion: 'v1', fieldPath: this.fieldPath } };
        break;
      default:
        delete out.name;
        out.prefix = this.name;
        out[this.type] = { name: this.refName, optional: false };
      }
      this.$emit('input', { value: out, old });
    },

  }
};
</script>

<template>
  <div class="row" @input="updateRow">
    <div class="col span-5-of-23">
      <LabeledSelect
        ref="typeSelect"
        v-model="type"
        :multiple="false"
        :options="typeOpts"
        label="Type"
        :mode="mode"
        option-label="label"
        @input="updateRow"
      />
    </div>
    <template v-if="type === 'configMapKeyRef' || type === 'secretRef' || type === 'secretKeyRef'">
      <div class="col span-5-of-23">
        <LabeledSelect
          v-model="referenced"
          :options="sourceOptions"
          :multiple="false"
          label="Source"
          option-label="metadata.name"
          option-key
          :mode="mode"
          @input="updateRow"
        />
      </div>
      <div class="col span-5-of-23">
        <LabeledSelect
          ref="typeSelect"
          v-model="type"
          :multiple="false"
          :options="typeOpts"
          :mode="mode"
          option-label="label"
          @input="updateRow"
        />
      </div>
    </template>
    <template v-else-if="type==='resourceFieldRef'">
      <div class="col span-5-of-23">
        <LabeledInput v-model="refName" label="Source" placeholder="e.g. my-container" :mode="mode" />
      </div>

      <div class="col span-5-of-23">
        <LabeledInput v-model="key" label="Key" placeholder="e.g. requests.cpu" :mode="mode" />
      </div>
    </template>
    <template v-else>
      <div class="col span-5-of-23">
        <LabeledInput v-model="fieldPath" label="Source" placeholder="e.g. requests.cpu" :mode="mode" />
      </div>

      <div class="col span-5-of-23">
        <LabeledInput value="n/a" label="Key" placeholder="e.g. requests.cpu" disabled :mode="mode" />
      </div>
    </template>
    <div class="col span-1-of-23">
      <div id="as">
        as
      </div>
    </div>
    <div class="col span-5-of-23">
      <LabeledInput v-model="name" label="Prefix or Alias" :mode="mode" />
    </div>
    <div class="col span-2-of-23">
      <button v-if="mode!=='view'" id="remove" type="button" class="btn btn-sm role-link" @click="$emit('input', { value:null })">
        remove
      </button>
    </div>
  </div>
</template>

<style lang ="scss" scoped>
  .row{
    display: flex;
    align-items: center;
  }

  #as {
    text-align:center;
  }
  #remove{
    padding: 0px;
  }

</style>
