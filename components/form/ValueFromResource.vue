<script>
import { CONFIG_MAP, SECRET, NAMESPACE } from '@/config/types';
import { get } from '@/utils/object';
import { mapGetters } from 'vuex';
import { _VIEW } from '@/config/query-params';
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
      { value: 'resourceFieldRef', label: 'Container Resource Field' },
      { value: 'configMapKeyRef', label: 'ConfigMap Key' },
      { value: 'secretKeyRef', label: 'Secret key' },
      { value: 'fieldRef', label: 'Pod Field' },
      { value: 'secretRef', label: 'Secret' },
      { value: 'configMapRef', label: 'ConfigMap' }
    ];

    const resourceKeyOpts = ['limits.cpu', 'limits.ephemeral-storage', 'limits.memory', 'requests.cpu', 'requests.ephemeral-storage', 'requests.memory'];

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
      referenced = this.allConfigMaps.filter((resource) => {
        return resource.metadata.name === name;
      })[0];
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
      referenced = this.allSecrets.filter((resource) => {
        return resource.metadata.name === name;
      })[0];
      break;
    case 'fieldRef':
      fieldPath = get(this.row.valueFrom, `${ type }.fieldPath`) || '';
      name = this.row.name;
      break;
    default:
      break;
    }

    return {
      typeOpts, type, refName, referenced: refName, secrets: this.allSecrets, keys: [], key, fieldPath, name, resourceKeyOpts
    };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    namespaces() {
      if (this.namespaced) {
        const map = this.$store.getters.namespaces();

        return Object.keys(map).filter(key => map[key]);
      } else {
        const inStore = this.$store.getters['currentProduct'].inStore;

        return this.$store.getters[`${ inStore }/findAll`](NAMESPACE);
      }
    },

    sourceOptions() {
      if (this.type === 'configMapKeyRef' || this.type === 'configMapRef') {
        return this.allConfigMaps.filter(map => this.namespaces.includes(map?.metadata?.namespace));
      } else if (this.type === 'secretRef' || this.type === 'secretKeyRef') {
        return this.allSecrets.filter(secret => this.namespaces.includes(secret?.metadata?.namespace));
      } else {
        return [];
      }
    },

    needsSource() {
      return this.type !== 'resourceFieldRef' && this.type !== 'fieldRef' && !!this.type;
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
    ...mapGetters({ t: 'i18n/t' })
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
        if ((neu.type === SECRET || neu.type === CONFIG_MAP) && neu.data) {
          this.keys = Object.keys(neu.data);
        }
        this.refName = neu?.metadata?.name;
      }
    },
  },

  methods: {

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
            containerName: this.refName, divisor: 1, resource: this.key
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
    get
  }
};
</script>

<template>
  <div>
    <div>
      <LabeledSelect
        v-model="type"
        :mode="mode"
        :multiple="false"
        :options="typeOpts"
        :reduce="e=>e.value"
        :label="t('workload.container.command.fromResource.type')"
        @input="updateRow"
      />
    </div>

    <div>
      <LabeledInput
        v-model="name"
        :label="t('workload.container.command.fromResource.prefix')"
        :mode="mode"
        @input="updateRow"
      />
    </div>

    <template v-if="needsSource">
      <div>
        <LabeledSelect
          v-model="referenced"
          :options="sourceOptions"
          :multiple="false"
          :get-option-label="opt=>get(opt, 'metadata.name') || opt"
          :get-option-key="opt=>opt.id|| opt"
          :mode="mode"
          :label="sourceLabel"
          @input="updateRow"
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
      <span v-else class="text-muted">&mdash;</span>
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
          class="inline"
          :searchable="false"
          :placeholder="t('workload.container.command.fromResource.key.placeholder')"
          @input="updateRow"
        />
      </div>
    </template>

    <template v-else>
      <div>
        <LabeledInput
          v-model="fieldPath"
          :placeholder="t('workload.container.command.fromResource.key.placeholder')"
          :label="t('workload.container.command.fromResource.key.label')"
          :mode="mode"
          @input="updateRow"
        />
      </div>
      <div>
        <span class="text-muted">&mdash;</span>
      </div>
    </template>

    <div>
      <button v-if="mode!=='view'" type="button" class="btn btn-sm role-link remove" @click="$emit('input', { value:null })">
        <t k="generic.remove" />
      </button>
    </div>
  </div>
</template>
