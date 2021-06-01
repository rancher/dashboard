<script>
import Checkbox from '@/components/form/Checkbox';
import LabeledInput from '@/components/form/LabeledInput';
import SelectOrCreateAuthSecret from '@/components/form/SelectOrCreateAuthSecret';

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
      type:     Object,
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

  methods: {
    update() {
      this.$emit('input', { ...this.config });
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
      :allow-aws="true"
      :namespace="namespace"
      generate-name="etcd-backup-s3-"
    />

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput v-model="config.bucket" label="Bucket" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="config.folder" label="Folder" />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput v-model="config.region" label="Region" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="config.endpoint" label="Endpoint" />
      </div>
    </div>

    <div class="mt-20">
      <Checkbox v-model="config.skipSSLVerify" :mode="mode" label="Accept any certificate (insecure)" />

      <LabeledInput v-if="!config.skipSSLVerify" v-model="config.endpointCA" type="multiline" label="Endpoint CA Cert" />
    </div>
  </div>
</template>
