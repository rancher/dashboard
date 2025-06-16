<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { NORMAN } from '@shell/config/types';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { isHttpsOrHttp } from '@shell/utils/validators/setting';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource.vue';

export default {
  emits: ['update:value'],

  components: {
    LabeledInput,
    Checkbox,
    SelectOrCreateAuthSecret,
    CruResource,
  },
  mixins: [CreateEditView, FormValidation],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    namespace: {
      type:     String,
      required: true,
    },

    value: {
      type:    Object,
      default: null,
    },

    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },

  data() {
    return {
      config: {
        bucket:              '',
        cloudCredentialName: null,
        endpoint:            '',
        endpointCA:          '',
        folder:              '',
        region:              '',
        skipSSLVerify:       false,
        ...(this.value || {}),
      },
      fvRules: {
        endpoint: [
          (value) => {
            if (!value) {
              return true; // Assuming optional if empty
            }
            // If it's NOT HTTPS or HTTP, return an error message
            if (isHttpsOrHttp(value)) {
            // needs to change to correct way of returning errors
              return 'Endpoint cannot start with http:// or https://';
            }
          },
        ],
      }
    };
  },

  computed: {
    ccData() {
      if ( this.config.cloudCredentialName ) {
        const cred = this.$store.getters['rancher/byId'](NORMAN.CLOUD_CREDENTIAL, this.config.cloudCredentialName);

        if ( cred ) {
          return cred.decodedData;
        }
      }

      return {};
    },
    isEdit() {
      return this.mode === _EDIT;
    },
    isView() {
      return this.mode === _VIEW;
    },

  },

  methods: {
    update() {
      const out = { ...this.config };

      this.$emit('update:value', out);
    },
  },

  watch: {
    fvFormIsValid: {
      handler(newValue) {
        this.$emit('update:configIsValid', !!newValue);
      },
      immediate: true,
    },
  }
};
</script>

<template>
  <CruResource
    ref="cruresource"
    :mode="mode"
    :resource="value"
    :validation-passed="fvFormIsValid"
    :errors="errors"
  >
    <div>
      <SelectOrCreateAuthSecret
        v-model:value="config.cloudCredentialName"
        :register-before-hook="registerBeforeHook"
        in-store="management"
        :allow-ssh="false"
        :allow-basic="false"
        :allow-s3="true"
        :namespace="namespace"
        generate-name="etcd-backup-s3-"
        :cache-secrets="true"
        @update:value="update"
      />

      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="config.bucket"
            label="Bucket"
            :disabled="isView"
            :placeholder="ccData.defaultBucket"
            :required="!ccData.defaultBucket"
            @update:value="update"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="config.folder"
            label="Folder"
            :disabled="isView"
            :placeholder="ccData.defaultFolder"
            @update:value="update"
          />
        </div>
      </div>

      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="config.region"
            label="Region"
            :disabled="isView"
            :placeholder="ccData.defaultRegion"
            @update:value="update"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="config.endpoint"
            label="Endpoint"
            :disabled="isView"
            :placeholder="ccData.defaultEndpoint"
            :rules="fvRules.endpoint"
            @update:value="update"
          />
        </div>
      </div>

      <div
        v-if="!ccData.defaultSkipSSLVerify"
        class="mt-20"
      >
        <Checkbox
          v-model:value="config.skipSSLVerify"
          :mode="mode"
          label="Accept any certificate (insecure)"
          @update:value="update"
        />

        <LabeledInput
          v-if="!config.skipSSLVerify"
          v-model:value="config.endpointCA"
          type="multiline"
          label="Endpoint CA Cert"
          :placeholder="ccData.defaultEndpointCA"
          @update:value="update"
        />
      </div>
    </div>
  </CruResource>
</template>
