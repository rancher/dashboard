<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { NORMAN } from '@shell/config/types';

export default {
  emits: ['update:value'],

  components: {
    LabeledInput,
    Checkbox,
    SelectOrCreateAuthSecret,
  },

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

    return { config };
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
  },

  methods: {
    update() {
      const out = { ...this.config };

      this.$emit('update:value', out);
    },
  },
};
</script>

<template>
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
          :placeholder="ccData.defaultBucket"
          :required="!ccData.defaultBucket"
          @update:value="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="config.folder"
          label="Folder"
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
          :placeholder="ccData.defaultRegion"
          @update:value="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="config.endpoint"
          label="Endpoint"
          :placeholder="ccData.defaultEndpoint"
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
</template>
