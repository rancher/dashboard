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
      :allow-aws="true"
      :namespace="namespace"
      generate-name="etcd-backup-s3-"
      @input="update"
    />

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput v-model="config.bucket" label="Bucket" @input="update" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="config.folder" label="Folder" @input="update" />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput v-model="config.region" label="Region" @input="update" />
      </div>
      <div class="col span-6">
        <LabeledInput v-model="config.endpoint" label="Endpoint" @input="update" />
      </div>
    </div>

    <div class="mt-20">
      <Checkbox v-model="config.skipSSLVerify" :mode="mode" label="Accept any certificate (insecure)" @input="update" />

      <LabeledInput v-if="!config.skipSSLVerify" v-model="config.endpointCA" type="multiline" label="Endpoint CA Cert" @input="update" />
    </div>
  </div>
</template>
