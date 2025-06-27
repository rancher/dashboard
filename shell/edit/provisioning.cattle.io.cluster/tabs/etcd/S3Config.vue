<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { NORMAN } from '@shell/config/types';
import FormValidation from '@shell/mixins/form-validation';
import { isHttpsOrHttp } from '@shell/utils/validators/setting';

export default {
  emits:      ['update:value'],
  components: {
    LabeledInput,
    Checkbox,
    SelectOrCreateAuthSecret,
  },
  mixins: [FormValidation],

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
    const config = {
      bucket:              '',
      cloudCredentialName: null,
      endpoint:            '',
      endpointCA:          '',
      folder:              '',
      region:              '',
      skipSSLVerify:       false,

      ...(this.value || {}),
    };

    return {
      config,
      s3EndpointHasError: false,
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

    isEndpointInvalid() {
      return this.s3EndpointHasError;
    }
  },

  methods: {
    update() {
      const out = { ...this.config };

      this.$emit('update:value', out);

      this.validateEndpoint(this.config.endpoint);
    },
    isHttpsOrHttp,

    validateEndpoint(value) {
      let message = '';

      if (isHttpsOrHttp(this.value.endpoint)) {
        message = this.t('cluster.credential.s3.defaultEndpoint.error');
        this.s3EndpointHasError = !!message; // Set to true if a message exists, false otherwise
      } else {
        this.s3EndpointHasError = false;
      }

      return this.s3EndpointHasError;
    },
  },

  watch: {
    'config.endpoint': {
      handler(newValue) {
        this.validateEndpoint(newValue);
      },
      immediate: true,
    },
    value: {
      handler(newValue) {
        if (newValue?.endpoint !== this.config.endpoint) {
          this.config.endpoint = newValue?.endpoint || '';
        }
        this.validateEndpoint(this.config.endpoint);
      },
      deep:      true,
      immediate: true,
    }
  },

};
</script>

<template>
  <div>
    <SelectOrCreateAuthSecret
      v-model:value="config.cloudCredentialName"
      :mode="mode"
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
          :mode="mode"
          :placeholder="ccData.defaultBucket"
          :required="!ccData.defaultBucket"
          :rules="!ccData.defaultBucket ? fvGetAndReportPathRules('bucket') : []"
          @update:value="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="config.folder"
          label="Folder"
          :mode="mode"
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
          :mode="mode"
          :placeholder="ccData.defaultRegion"
          @update:value="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="config.endpoint"
          label="Endpoint"
          :mode="mode"
          :placeholder="ccData.defaultEndpoint"
          @update:value="update"
        />
        <div
          v-if="isEndpointInvalid"
          class="mt-5 input-error-message text-error icon icon-error icon-lg"
          color="error"
        >
          {{ t('cluster.credential.s3.defaultEndpoint.error') }}
        </div>
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
</template>
