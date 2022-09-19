<script>
// Added by Verrazzano
import Checkbox from '@components/Form/Checkbox/Checkbox';
import CoherenceWorkloadHelper from '@pkg/mixins/coherence-workload-helper';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { NAMESPACE, SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'SSLSpec',
  components: {
    Checkbox,
    LabeledInput,
    LabeledSelect,
  },
  mixins: [CoherenceWorkloadHelper],
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
    hideSslEnabled: {
      type:    Boolean,
      default: false,
    }
  },
  data() {
    return {
      fetchInProgress:    true,
      namespace:          this.namespacedObject.metadata?.namespace,
      allNamespaces:      [],
      allSecrets:         {},
      secrets:            [],
    };
  },
  async fetch() {
    this.allSecrets = {};

    const requests = { namespaces: this.$store.dispatch('management/findAll', { type: NAMESPACE }) };

    if (this.$store.getters['cluster/schemaFor'](SECRET)) {
      requests.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }

    const hash = await allHash(requests);

    this.allNamespaces = hash.namespaces;

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecrets);
    }
    this.fetchInProgress = false;
  },
  computed: {
    showSSLEnabled() {
      return !this.hideSslEnabled;
    }
  },
  methods: {
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secrets = this.allSecrets[this.namespace] || [];
      }
    },
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'namespacedObject.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    }
  },
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-4">
        <Checkbox
          v-if="showSSLEnabled"
          :value="getField('enabled')"
          :mode="mode"
          :label="t('verrazzano.coherence.fields.sslEnabled')"
          @input="setBooleanField('enabled', $event)"
        />
        <div class="spacer-tiny" />
        <Checkbox
          :value="getField('requireClientCert')"
          :mode="mode"
          :label="t('verrazzano.coherence.fields.requireClientCert')"
          @input="setBooleanField('requireClientCert', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          :value="getField('secrets')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'secrets')"
          :label="t('verrazzano.coherence.fields.secrets')"
          :options="secrets"
          option-label="metadata.name"
          :reduce="secret => secret.metadata.name"
          @input="setFieldIfNotEmpty('secrets', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('keyStore')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'keyStore')"
          :label="t('verrazzano.coherence.fields.keyStore')"
          @input="setFieldIfNotEmpty('keyStore', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('keyStorePasswordFile')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'keyStorePasswordFile')"
          :label="t('verrazzano.coherence.fields.keyStorePasswordFile')"
          @input="setFieldIfNotEmpty('keyStorePasswordFile', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('keyPasswordFile')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'keyPasswordFile')"
          :label="t('verrazzano.coherence.fields.keyPasswordFile')"
          @input="setFieldIfNotEmpty('keyPasswordFile', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('keyStoreAlgorithm')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'keyStoreAlgorithm')"
          :label="t('verrazzano.coherence.fields.keyStoreAlgorithm')"
          @input="setFieldIfNotEmpty('keyStoreAlgorithm', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('keyStoreProvider')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'keyStoreProvider')"
          :label="t('verrazzano.coherence.fields.keyStoreProvider')"
          @input="setFieldIfNotEmpty('keyStoreProvider', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('keyStoreType')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'keyStoreType')"
          :label="t('verrazzano.coherence.fields.keyStoreType')"
          @input="setFieldIfNotEmpty('keyStoreType', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('trustStore')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'trustStore')"
          :label="t('verrazzano.coherence.fields.trustStore')"
          @input="setFieldIfNotEmpty('trustStore', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('trustStorePasswordFile')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'trustStorePasswordFile')"
          :label="t('verrazzano.coherence.fields.trustStorePasswordFile')"
          @input="setFieldIfNotEmpty('trustStorePasswordFile', $event)"
        />
      </div>
    </div>
    <div class="spacer-small" />
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          :value="getField('trustStoreAlgorithm')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'trustStoreAlgorithm')"
          :label="t('verrazzano.coherence.fields.trustStoreAlgorithm')"
          @input="setFieldIfNotEmpty('trustStoreAlgorithm', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('trustStoreProvider')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'trustStoreProvider')"
          :label="t('verrazzano.coherence.fields.trustStoreProvider')"
          @input="setFieldIfNotEmpty('trustStoreProvider', $event)"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          :value="getField('trustStoreType')"
          :mode="mode"
          :placeholder="getNotSetPlaceholder(value, 'trustStoreType')"
          :label="t('verrazzano.coherence.fields.trustStoreType')"
          @input="setFieldIfNotEmpty('trustStoreType', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped src="@pkg/assets/styles/verrazzano.scss">
</style>
