<script>
import ArrayListGrouped from '@shell/components/form/ArrayListGrouped';
import { set } from '@shell/utils/object';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import CreateEditView from '@shell/mixins/create-edit-view';
import SecretSelector from '@shell/components/form/SecretSelector';
import { SECRET_TYPES as TYPES } from '@shell/config/secret';

export default {
  components: {
    ArrayListGrouped,
    LabeledInput,
    Checkbox,
    SelectOrCreateAuthSecret,
    SecretSelector,
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    clusterRegisterBeforeHook: {
      // We use this hook instead of the create hook from the CreateEditView
      // mixin because this is a form within a form, therefore we
      // need the hook from the parent component.
      type:     Function,
      required: true
    }
  },

  data() {
    const configMap = this.value.spec.rkeConfig?.registries?.configs || {};
    const entries = [];

    const defaultAddValue = {
      hostname:             '',
      authConfigSecretName: null,
      caBundle:             '',
      insecureSkipVerify:   false,
      tlsSecretName:        null,
    };

    for ( const hostname in configMap ) {
      if (configMap[hostname]) {
        configMap[hostname].insecureSkipVerify = configMap[hostname].insecureSkipVerify ?? defaultAddValue.insecureSkipVerify;
        configMap[hostname].authConfigSecretName = configMap[hostname].authConfigSecretName ?? defaultAddValue.authConfigSecretName;
        configMap[hostname].caBundle = configMap[hostname].caBundle ?? defaultAddValue.caBundle;
        configMap[hostname].tlsSecretName = configMap[hostname].tlsSecretName ?? defaultAddValue.tlsSecretName;
      }
      entries.push({
        hostname,
        ...configMap[hostname],
      });
    }

    return { entries, defaultAddValue };
  },

  computed: {
    TLS: {
      get() {
        return TYPES.TLS;
      },
    },
  },

  mounted() {
    window.z = this;
  },

  // created() {
  //   set(this.value, 'spec.rkeConfig.registries.configs', {});
  // },

  methods: {
    update() {
      const configs = {};

      for ( const entry of this.entries ) {
        const h = entry.hostname;

        if ( !h || configs[h] ) {
          continue;
        }

        configs[h] = { ...entry };
        delete configs[h].hostname;
      }

      set(this.value, 'spec.rkeConfig.registries.configs', configs);
      this.$emit('updateConfigs', configs);
    },

    wrapRegisterBeforeHook(fn, ...args) {
      async function wrapFn(...params) {
        const result = await fn(...params);

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(result);
          }, 50);
        });
      }
      this.clusterRegisterBeforeHook(wrapFn, ...args);
    }
  }
};
</script>

<template>
  <div>
    <h3>
      {{ t('registryConfig.header') }}
      <i
        v-clean-tooltip="t('registryConfig.toolTip')"
        class="icon icon-info"
      />
    </h3>
    <p class="mb-20">
      {{ t('registryConfig.description') }}
    </p>
    <ArrayListGrouped
      v-model="entries"
      :add-label="t('registryConfig.addLabel')"
      :default-add-value="defaultAddValue"
      :initial-empty-row="true"
      :mode="mode"
      data-testid="registry-authentication"
      @input="update"
    >
      <template #default="{row, i}">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model="row.value.hostname"
              label="Registry Hostname"
              :mode="mode"
              :data-testid="`registry-auth-host-input-${i}`"
            />

            <SelectOrCreateAuthSecret
              :key="`${row.value.hostname}-${row.value.authConfigSecretName}`"
              v-model="row.value.authConfigSecretName"
              :register-before-hook="wrapRegisterBeforeHook"
              :append-unique-id-to-hook="true"
              in-store="management"
              :allow-ssh="false"
              :allow-rke="true"
              :vertical="true"
              :namespace="value.metadata.namespace"
              :mode="mode"
              generate-name="registryconfig-auth-"
              :data-testid="`registry-auth-select-or-create-${i}`"
              :cache-secrets="true"
            />
          </div>
          <div class="col span-6">
            <SecretSelector
              v-model="row.value.tlsSecretName"
              in-store="management"
              :mode="mode"
              :types="[TLS]"
              :namespace="value.metadata.namespace"
              secret-name-label="TLS Secret"
            />

            <LabeledInput
              v-model="row.value.caBundle"
              class="mt-20"
              type="multiline"
              label="CA Cert Bundle"
              :mode="mode"
            />

            <div>
              <Checkbox
                v-model="row.value.insecureSkipVerify"
                class="mt-10"
                :mode="mode"
                label="Skip TLS Verifications"
              />
            </div>
          </div>
        </div>
      </template>
    </ArrayListGrouped>
  </div>
</template>
