<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { NORMAN } from '@shell/config/types';

export default {
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

      this.$emit('input', out);
    },
  },
};
</script>

<template>
  <div>
    <SelectOrCreateAuthSecret
      v-model="config.cloudCredentialName"
      :register-before-hook="registerBeforeHook"
      in-store="management"
      :allow-ssh="false"
      :allow-basic="false"
      :allow-s3="true"
      :namespace="namespace"
      generate-name="etcd-backup-s3-"
      @input="update"
    />

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model="config.bucket"
          label="Bucket"
          :placeholder="ccData.defaultBucket"
          :required="!ccData.defaultBucket"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="config.folder"
          label="Folder"
          :placeholder="ccData.defaultFolder"
          @input="update"
        />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          v-model="config.region"
          label="Region"
          :placeholder="ccData.defaultRegion"
          @input="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="config.endpoint"
          label="Endpoint"
          :placeholder="ccData.defaultEndpoint"
          @input="update"
        />
      </div>
    </div>

    <div
      v-if="!ccData.defaultSkipSSLVerify"
      class="mt-20"
    >
      <Checkbox
        v-model="config.skipSSLVerify"
        :mode="mode"
        label="Accept any certificate (insecure)"
        @input="update"
      />

      <LabeledInput
        v-if="!config.skipSSLVerify"
        v-model="config.endpointCA"
        type="multiline"
        label="Endpoint CA Cert"
        :placeholder="ccData.defaultEndpointCA"
        @input="update"
      />
    </div>
  </div>
</template>
