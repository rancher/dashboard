<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'SecretKeySelector',
  components: {
    Checkbox,
    LabeledSelect,
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
  },
  data() {
    return {
      loaded:          false,
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata?.namespace,
      allSecrets:      {},
      secrets:         [],
    };
  },
  async fetch() {
    const requests = { secrets: this.$store.dispatch('management/findAll', { type: SECRET }) };

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    this.fetchInProgress = false;
  },
  computed: {
    keys() {
      const secretName = this.getField('name');
      const keys = [];

      if (secretName) {
        const secret = this.secrets.find(each => each.metadata?.name === secretName);

        if (secret && secret.data) {
          keys.push(...Object.keys(secret.data));
        }
      }

      return keys;
    }
  },
  methods: {
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
      }
    },
  },
  mounted() {
    this.loaded = true;
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    },
    'value.name'(neu, old) {
      let resetKey = false;

      if (this.loaded && old) {
        if (neu) {
          if (neu !== old) {
            const neuSecret = this.secrets.find(secret => secret.metadata?.name === neu);
            const key = this.getField('key');

            if (key && !(key in neuSecret.data)) {
              resetKey = true;
            }
          }
        } else {
          resetKey = true;
        }
      }

      if (resetKey) {
        this.setField('key', undefined);
      }
    },
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-4">
      <LabeledSelect
        :value="getField('name')"
        :mode="mode"
        :options="secrets"
        option-label="metadata.name"
        :reduce="secret => secret.metadata.name"
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.common.fields.secretKeySelector.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div class="col span-4">
      <LabeledSelect
        :value="getField('key')"
        :mode="mode"
        :options="keys"
        :placeholder="getNotSetPlaceholder(value, 'key')"
        :label="t('verrazzano.common.fields.secretKeySelector.key')"
        @input="setFieldIfNotEmpty('key', $event)"
      />
    </div>
    <div class="col span-4">
      <div class="spacer-small" />
      <Checkbox
        :value="getField('optional')"
        :mode="mode"
        :label="t('verrazzano.common.fields.secretKeySelector.optional')"
        @input="setBooleanField('optional', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
