<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import SecretSelector from '@shell/components/form/SecretSelector';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: {
    Checkbox, LabeledInput, SecretSelector
  },
  props: {
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
  data() {
    return {};
  },
};
</script>

<template>
  <div class="loki">
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.url"
          :mode="mode"
          :disabled="disabled"
          class="url"
          :label="t('logging.loki.url')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.tenant"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.loki.tenant')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.username"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.loki.username')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model="value.password"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.loki.password')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.certificate') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.ca_cert"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.loki.caCert')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6 mb-10">
        <SecretSelector
          v-model="value.cert"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.loki.cert')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model="value.key"
          mount-key="mountFrom"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.loki.key')"
          :show-key-selector="true"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.labels') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <Checkbox
          v-model="value.configure_kubernetes_labels"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.loki.configureKubernetesLabels')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <Checkbox
          v-model="value.extract_kubernetes_labels"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.loki.extractKubernetesLabels')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <Checkbox
          v-model="value.drop_single_key"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.loki.dropSingleKey')"
        />
      </div>
    </div>
  </div>
</template>
