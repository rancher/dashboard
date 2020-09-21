<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import { SECRET } from '@/config/types';
import { _EDIT, _VIEW } from '@/config/query-params';
import { TYPES } from '@/models/secret';

export default {
  components: { LabeledSelect },

  props: {
    value: {
      type:     [String, Object],
      required: false,
      default:  undefined
    },
    types: {
      type:    Array,
      default: () => Object.values(TYPES)
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    nameKey: {
      type:    String,
      default: 'name'
    },
    keyKey: {
      type:    String,
      default: 'key'
    },
    showKeySelector: {
      type:    Boolean,
      default: false
    },
    label: {
      type:    String,
      default: null
    },
    mode: {
      type:     String,
      default: _EDIT
    }
  },

  computed: {
    name: {
      get() {
        const name = this.showKeySelector ? this.value?.valueFrom?.secretKeyRef?.[this.nameKey] : this.value;

        return name || '';
      },
      set(name) {
        if (this.showKeySelector) {
          this.$emit('input', { valueFrom: { secretKeyRef: { [this.nameKey]: name, [this.keyKey]: this.key } } });
        } else {
          this.$emit('input', name);
        }
      }
    },

    key: {
      get() {
        return this.value?.valueFrom?.secretKeyRef?.[this.keyKey] || '';
      },
      set(key) {
        this.$emit('input', { valueFrom: { secretKeyRef: { [this.nameKey]: this.name, [this.keyKey]: key } } });
      }
    },
    secrets() {
      const allSecrets = this.$store.getters['cluster/all'](SECRET);

      return allSecrets
        .filter(secret => this.types.includes(secret._type));
    },
    secretNames() {
      return this.secrets.map(secret => secret.name);
    },
    keys() {
      const secret = this.secrets.find(secret => secret.name === this.name) || {};

      return Object.keys(secret.data || {});
    },
    secretNameLabel() {
      return this.showKeySelector ? 'Secret Name' : this.label;
    },
    isView() {
      return this.mode === _VIEW;
    },
  },

};
</script>

<template>
  <div class="secret-selector" :class="{'show-key-selector': showKeySelector}">
    <label v-if="label && showKeySelector">{{ label }}</label>
    <div class="input-container">
      <LabeledSelect
        v-model="name"
        :disabled="!isView && disabled"
        :options="secretNames"
        :label="secretNameLabel"
        :mode="mode"
      />
      <LabeledSelect
        v-if="showKeySelector"
        v-model="key"
        class="col span-6"
        :disabled="!isView && (!name || disabled)"
        :options="keys"
        label="Key"
        :mode="mode"
      />
    </div>
  </div>
</template>

<style lang="scss">
.secret-selector {
  width: 100%;
  label {
    display: block;
  }

  &.show-key-selector {
    .input-container > * {
      display: inline-block;
      width: 50%;

      &.labeled-select.focused {
        z-index: 10;
      }

      &:first-child {
          border-radius: calc(var(--border-radius) * 2) 0 0  calc(var(--border-radius) * 2);
          margin-right: 0;
      }

      &:last-child {
          border-radius: 0 calc(var(--border-radius) * 2) calc(var(--border-radius) * 2) 0;
          border-left: none;
          float: right;
      }
    }
  }

}
</style>
