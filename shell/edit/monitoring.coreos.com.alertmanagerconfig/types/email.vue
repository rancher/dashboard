<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import TLS from '../tls';
import SimpleSecretSelector from '@shell/components/form/SimpleSecretSelector';
import { _VIEW } from '@shell/config/query-params';

export default {
  emits: ['input'],

  components: {
    Checkbox, LabeledInput, SimpleSecretSelector, TLS
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    },
    namespace: {
      type:    String,
      default: ''
    }
  },
  data() {
    this.value['sendResolved'] = this.value.sendResolved || false;
    this.value['requireTLS'] = this.value.requireTLS || false;

    return {
      view:                          _VIEW,
      initialAuthPasswordSecretName: this.value?.authPassword?.name ? this.value.authPassword.name : '',
      initialAuthPasswordSecretKey:  this.value.authPassword?.key ? this.value.authPassword.key : '',
      none:                          '__[[NONE]]__',
    };
  },

  methods: {
    updateAuthPasswordSecretName(name) {
      const existingKey = this.value.authPassword?.key || '';

      if (this.value.authPassword) {
        if (name === this.none) {
          delete this.value.authPassword;
        } else {
          this.value.authPassword = {
            key: existingKey,
            name,
          };
        }
      } else {
        this.value['authPassword'] = {
          key: '',
          name
        };
      }
    },
    updateAuthPasswordSecretKey(key) {
      const existingName = this.value.authPassword?.name || '';

      if (this.value.authPassword) {
        this.value.authPassword = {
          name: existingName,
          key
        };
      } else {
        this.value['authPassword'] = {
          name: '',
          key
        };
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <h3>Target</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.to"
          :mode="mode"
          label="Default Recipient Address"
          placeholder="e.g. admin@example.com"
        />
      </div>
      <div class="col span-6">
        <Checkbox
          v-model:value="value.sendResolved"
          :mode="mode"
          class="mt-20"
          label="Enable send resolved alerts"
        />
      </div>
    </div>
    <h2 class="mb-10">
      SMTP
    </h2>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledInput
          v-model:value="value.from"
          :mode="mode"
          label="Sender"
          placeholder="e.g. admin@example.com"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.smarthost"
          :mode="mode"
          label="Host"
          placeholder="e.g. 192.168.1.121:587"
        />
      </div>
      <div class="col span-6">
        <Checkbox
          v-model:value="value.requireTLS"
          :mode="mode"
          class="mt-20"
          label="Use TLS"
        />
      </div>
    </div>
    <div
      v-if="namespace"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.authUsername"
          :mode="mode"
          :label="t('monitoring.alertmanagerConfig.email.username')"
          placeholder="e.g. John"
        />
      </div>
    </div>
    <div class="row mb-20">
      <SimpleSecretSelector
        v-if="namespace"
        :initial-key="initialAuthPasswordSecretKey"
        :mode="mode"
        :initial-name="initialAuthPasswordSecretName"
        :namespace="namespace"
        :disabled="mode === view"
        :secret-name-label="t('monitoring.alertmanagerConfig.email.password')"
        @updateSecretName="updateAuthPasswordSecretName"
        @updateSecretKey="updateAuthPasswordSecretKey"
      />
      <Banner
        v-else
        color="error"
      >
        {{ t('alertmanagerConfigReceiver.namespaceWarning') }}
      </Banner>
    </div>
    <TLS
      :value="value"
      class="mb-20"
      :mode="mode"
      :namespace="namespace"
      @update:value="$emit('input', $event)"
    />
  </div>
</template>
