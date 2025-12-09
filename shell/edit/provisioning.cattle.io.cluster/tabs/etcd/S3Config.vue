<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { NORMAN } from '@shell/config/types';
import FormValidation from '@shell/mixins/form-validation';

export default {
  emits: ['update:value', 'validationChanged'],

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
      fvFormRuleSets: [
        {
          path: 'endpoint', rootObject: this.config, rules: ['awsStyleEndpoint']
        },
        {
          path: 'bucket', rootObject: this.config, rules: ['required']
        },
      ]
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
  },
  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    }
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
          :label="t('cluster.rke2.etcd.s3config.bucket.label')"
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
          :label="t('cluster.rke2.etcd.s3config.folder.label')"
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
          :label="t('cluster.rke2.etcd.s3config.region.label')"
          :mode="mode"
          :placeholder="ccData.defaultRegion"
          @update:value="update"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="config.endpoint"
          :label="t('cluster.rke2.etcd.s3config.endpoint.label')"
          :mode="mode"
          :placeholder="ccData.defaultEndpoint"
          :rules="fvGetAndReportPathRules('endpoint')"
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
        :label="t('cluster.rke2.etcd.s3config.skipSSLVerify.label')"
        @update:value="update"
      />

      <LabeledInput
        v-if="!config.skipSSLVerify"
        v-model:value="config.endpointCA"
        :mode="mode"
        type="multiline"
        :label="t('cluster.rke2.etcd.s3config.endpointCA.label')"
        :placeholder="ccData.defaultEndpointCA"
        @update:value="update"
      />
    </div>
  </div>
</template>
