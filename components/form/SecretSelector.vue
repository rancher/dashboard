<script>
import LabeledSelect from '@/components/form/LabeledSelect';
import { SECRET } from '@/config/types';
import { _EDIT, _VIEW } from '@/config/query-params';
import { SECRET_TYPES as TYPES } from '@/config/secret';
import sortBy from 'lodash/sortBy';

const NONE = '__[[NONE]]__';

export default {
  components: { LabeledSelect },

  props: {
    value: {
      type:     [String, Object],
      required: false,
      default:  undefined
    },
    namespace: {
      type:     String,
      required: true
    },
    types: {
      type:    Array,
      default: () => Object.values(TYPES)
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mountKey: {
      type:    String,
      default: 'valueFrom'
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
    secretNameLabel: {
      type:    String,
      default: 'Secret Name'
    },
    keyNameLabel: {
      type:    String,
      default: 'Key'
    },
    mode: {
      type:     String,
      default: _EDIT
    }
  },

  computed: {
    name: {
      get() {
        const name = this.showKeySelector ? this.value?.[this.mountKey]?.secretKeyRef?.[this.nameKey] : this.value;

        return name || NONE;
      },
      set(name) {
        const isNone = name === NONE;
        const correctedName = isNone ? undefined : name;

        if (this.showKeySelector) {
          this.$emit('input', { [this.mountKey]: { secretKeyRef: { [this.nameKey]: correctedName, [this.keyKey]: '' } } });
        } else {
          this.$emit('input', correctedName);
        }
      }
    },

    key: {
      get() {
        return this.value?.[this.mountKey]?.secretKeyRef?.[this.keyKey] || '';
      },
      set(key) {
        this.$emit('input', { [this.mountKey]: { secretKeyRef: { [this.nameKey]: this.name, [this.keyKey]: key } } });
      }
    },
    secrets() {
      const allSecrets = this.$store.getters['cluster/all'](SECRET);

      return allSecrets
        .filter(secret => this.types.includes(secret._type) && secret.namespace === this.namespace);
    },
    secretNames() {
      const mappedSecrets = this.secrets.map(secret => ({
        label: secret.name,
        value: secret.name
      })).sort();

      return [{ label: 'None', value: NONE }, ...sortBy(mappedSecrets, 'label')];
    },
    keys() {
      const secret = this.secrets.find(secret => secret.name === this.name) || {};

      return Object.keys(secret.data || {}).map(key => ({
        label: key,
        value: key
      }));
    },
    isView() {
      return this.mode === _VIEW;
    },
    isKeyDisabled() {
      return !this.isView && (!this.name || this.name === NONE || this.disabled);
    }
  },

};
</script>

<template>
  <div class="secret-selector" :class="{'show-key-selector': showKeySelector}">
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
        :disabled="isKeyDisabled"
        :options="keys"
        :label="keyNameLabel"
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

  & .labeled-select {
    min-height: $input-height;
  }

  & .vs__selected-options {
    padding: 8px 0 7px 0;
  }

  & label {
    display: inline-block;
  }

  &.show-key-selector {
    .input-container > * {
      display: inline-block;
      width: 50%;

      &.labeled-select.focused {
        z-index: 10;
      }

      &:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        margin-right: 0;
      }

      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        border-left: none;
        float: right;
      }
    }
  }
}
</style>
