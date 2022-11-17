<script>
/**
 * I created this component because the regular secret
 * selector assumes secrets need to be in this format:
 *
 *  valueFrom:
      secretKeyRef:
        name: example-secret-name
        key: example-secret-key

   But for secrets for receivers in AlertmanagerConfigs,
   it needed to be in this format:

   name: example-secret-name
   key: example-secret-key
 */
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { SECRET } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { TYPES } from '@shell/models/secret';
import sortBy from 'lodash/sortBy';

const NONE = '__[[NONE]]__';

export default {
  components: { LabeledSelect },

  async fetch() {
    // Make sure secrets are in the store so that the secret
    // selectors in the receiver config forms will have secrets
    // to choose from.
    const allSecrets = await this.$store.dispatch('cluster/findAll', { type: SECRET });

    const allSecretsInNamespace = allSecrets.filter(secret => this.types.includes(secret._type) && secret.namespace === this.namespace);

    this.secrets = allSecretsInNamespace;
  },

  props: {
    test:        { type: String, default: '' },
    initialName: {
      type:     String,
      required: true
    },
    initialKey: {
      type:     String,
      required: true
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
    secretNameLabel: {
      type:    String,
      default: 'Secret Name'
    },
    keyNameLabel: {
      type:    String,
      default: 'Key'
    },
    mode: {
      type:    String,
      default: _EDIT
    },
  },

  data(props) {
    return {
      secrets: [],
      name:    props.initialName,
      key:     props.initialKey,
      none:    NONE
    };
  },

  computed: {
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

  methods: {
    updateSecretName(value) {
      if (value === this.none) {
        // The key should appear blank if the secret name is cleared
        this.key = '';
      }
      if (value) {
        this.$emit('updateSecretName', value);
      }
    },
    updateSecretKey(value) {
      if (value) {
        this.$emit('updateSecretKey', value);
      }
    }
  }
};
</script>

<template>
  <div class="secret-selector show-key-selector">
    <div class="input-container">
      <LabeledSelect
        v-model="name"
        class="col span-6"
        :disabled="!isView && disabled"
        :options="secretNames"
        :label="secretNameLabel"
        :mode="mode"
        @selecting="updateSecretName(name)"
      />
      <LabeledSelect
        v-model="key"
        class="col span-6"
        :disabled="isKeyDisabled"
        :options="keys"
        :label="keyNameLabel"
        :mode="mode"
        @selecting="updateSecretKey(key)"
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
