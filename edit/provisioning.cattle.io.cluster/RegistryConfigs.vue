<script>
import ArrayListGrouped from '@/components/form/ArrayListGrouped';
import { set } from '@/utils/object';
import LabeledInput from '@/components/form/LabeledInput';
import Checkbox from '@/components/form/Checkbox';
import SelectOrCreateAuthSecret from '@/components/form/SelectOrCreateAuthSecret';
import CreateEditView from '@/mixins/create-edit-view';
import SecretSelector from '@/components/form/SecretSelector';
import { TYPES } from '@/models/secret';

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
  },

  data() {
    const configMap = this.value.spec.rkeConfig?.registries?.configs || {};
    const entries = [];

    for ( const hostname in configMap ) {
      entries.push({
        hostname,
        ...configMap[hostname],
      });
    }

    return { entries };
  },

  computed: {
    TLS: {
      get() {
        return TYPES.TLS;
      },
    },

    defaultAddValue() {
      return {
        hostname:             '',
        authConfigSecretName: null,
        caBundle:             '',
        insecureSkipVerify:   false,
        tlsSecretName:        null,
      };
    },
  },

  mounted() {
    window.z = this;
  },

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
    },
  }
};
</script>

<template>
  <div>
    <h3>
      Registry Configuration
    </h3>
    <ArrayListGrouped
      v-model="entries"
      add-label="Add Registry"
      :default-add-value="defaultAddValue"
      :mode="mode"
      @input="update()"
    >
      <template #default="{row}">
        <div class="row">
          <div class="col span-6">
            <LabeledInput v-model="row.value.hostname" label="Registry Hostname" :mode="mode" />

            <SelectOrCreateAuthSecret
              v-model="row.value.authConfigSecretName"
              :register-before-hook="registerBeforeHook"
              in-store="management"
              :allow-ssh="false"
              :vertical="true"
              :namespace="value.metadata.namespace"
              generate-name="registryconfig-auth-"
            />
          </div>
          <div class="col span-6">
            <SecretSelector
              v-model="row.value.tlsSecretName"
              :mode="mode"
              :types="[TLS]"
              :namespace="value.metadata.namespace"
              secret-name-label="TLS Secret"
            />

            <LabeledInput v-model="row.value.caBundle" class="mt-20" type="multiline" label="CA Cert Bundle" :mode="mode" />

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
