<script>
import Provider from '@shell/mixins/thanos-storage-provider';
import { LabeledInput } from '@components/Form/LabeledInput';

export const answers = {
  bucketName: 'thanos.objectConfig.config.bucket',
  endpoint:   'thanos.objectConfig.config.endpoint',
  accessKey:  'thanos.objectConfig.config.access_key',
  secretKey:  'thanos.objectConfig.config.secret_key'
};

export default {
  mixins: [Provider],

  props: {
    fvGetAndReportPathRules: {
      type:     Function,
      default:  () => {},
      required: true,
    },
  },

  data() {
    return {
      answers,
      name: 's3'
    };
  },

  components: { LabeledInput }
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.bucket"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.s3.bucketName.label')"
          :placeholder="t('globalMonitoringPage.store.s3.bucketName.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.bucket')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.endpoint"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.s3.endpoint.label')"
          :placeholder="t('globalMonitoringPage.store.s3.endpoint.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.endpoint')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.access_key"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.s3.accessKey.label')"
          :placeholder="t('globalMonitoringPage.store.s3.accessKey.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.access_key')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.secret_key"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.s3.secretKey.label')"
          :placeholder="t('globalMonitoringPage.store.s3.secretKey.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.secret_key')"
        />
      </div>
    </div>
  </div>
</template>
