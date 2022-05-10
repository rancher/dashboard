<script>
import LabeledInput from '@shell/components/form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';
import { updatePort } from './utils';

export default {
  components: { LabeledInput, SecretSelector },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:     String,
      required: true,
    },
    namespace: {
      type:     String,
      required: true
    }
  },
  computed: {
    port: {
      get() {
        return this.value.servers[0].port;
      },
      set(port) {
        updatePort(value => this.$set(this.value.servers[0], 'port', value), port);
      }
    }
  }
};
</script>

<template>
  <div class="forward">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-10">
        <LabeledInput v-model="value.servers[0].host" :mode="mode" :disabled="disabled" :label="t('logging.forward.host')" />
      </div>
      <div class="col span-2">
        <LabeledInput
          v-model="port"
          :mode="mode"
          :disabled="disabled"
          type="number"
          min="1"
          max="65535"
          :label="t('logging.forward.port')"
        />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.servers[0].username"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.forward.username')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.servers[0].password"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.forward.password')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.servers[0].shared_key"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.forward.sharedKey')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.tls_client_cert_path"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.forward.clientCertPath')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.tls_client_private_key_path"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.forward.clientPrivateKeyPath')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row mt-10">
      <div class="col span-6">
        <SecretSelector
          v-model="value.tls_client_private_key_passphrase"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.forward.clientPrivateKeyPassphrase')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
