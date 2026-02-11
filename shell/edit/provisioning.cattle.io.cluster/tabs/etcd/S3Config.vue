<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import { NORMAN } from '@shell/config/types';
import FormValidation from '@shell/mixins/form-validation';
import UnitInput from '@shell/components/form/UnitInput';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { _CREATE } from '@shell/config/query-params';
import { RETENTION_DEFAULT } from '@shell/edit/provisioning.cattle.io.cluster/defaults';

export default {
  emits: ['update:value', 'validationChanged'],

  components: {
    LabeledInput,
    Checkbox,
    SelectOrCreateAuthSecret,
    UnitInput,
    RadioGroup
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
    localRetentionCount: {
      type:    Number,
      default: null,
    }
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
        retention:           null,
        ...(this.value || {}),
      },
      differentRetention: false,
      fvFormRuleSets:     [
        {
          path: 'endpoint', rootObject: this.config, rules: ['awsStyleEndpoint']
        },
        {
          path: 'bucket', rootObject: this.config, rules: ['required']
        },
      ]
    };
  },
  mounted() {
    this.differentRetention = !(this.mode === _CREATE || this.value?.retention === this.localRetentionCount);
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

    localCountToUse() {
      return this.localRetentionCount === null || this.localRetentionCount === undefined ? RETENTION_DEFAULT : this.localRetentionCount;
    },
    retentionOptionsOptions() {
      return [
        { label: this.t('cluster.rke2.etcd.s3config.snapshotRetention.options.localDefined', { count: this.localCountToUse }), value: false }, { label: this.t('cluster.rke2.etcd.s3config.snapshotRetention.options.manual'), value: true }
      ];
    }
  },
  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    },
    localRetentionCount(neu) {
      if (!this.differentRetention) {
        this.config.retention = this.localCountToUse;
        this.update();
      }
    }
  },

  methods: {
    update() {
      const out = { ...this.config };

      this.$emit('update:value', out);
    },
    resetRetention() {
      this.config.retention = this.localCountToUse;
      this.update();
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
    <div class="row mt-20">
      <div class="col span-6">
        <h4>{{ t('cluster.rke2.etcd.s3config.snapshotRetention.title') }}</h4>
        <RadioGroup
          v-model:value="differentRetention"
          name="s3config-retention"
          :mode="mode"
          :options="retentionOptionsOptions"
          :row="true"
          @update:value="resetRetention"
        />
        <UnitInput
          v-if="differentRetention"
          v-model:value="config.retention"
          :label="t('cluster.rke2.etcd.s3config.snapshotRetention.label')"
          :mode="mode"
          :suffix="t('cluster.rke2.snapshots.s3Suffix')"
          class="mt-10"
          @update:value="update"
        />
      </div>
    </div>
  </div>
</template>
