<script>
import Provider from '@shell/mixins/thanos-storage-provider';
import { LabeledInput } from '@components/Form/LabeledInput';

export const answers = {
  bucketName: 'thanos.objectConfig.config.bucket',
  region:     'thanos.objectConfig.config.region',
  secretKey:  'thanos.objectConfig.config.secret_key',
  secretId:   'thanos.objectConfig.config.secret_id',
  appid:      'thanos.objectConfig.config.app_id'
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

  components: { LabeledInput },

  data() {
    return {
      answers,
      name: 'tencentcloudcos',
    };
  },
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
          :label="t('globalMonitoringPage.store.tencentcloudcos.bucketName.label')"
          :placeholder="t('globalMonitoringPage.store.tencentcloudcos.bucketName.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.bucket')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.region"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.tencentcloudcos.region.label')"
          :placeholder="t('globalMonitoringPage.store.tencentcloudcos.region.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.region')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.secret_id"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.tencentcloudcos.secretId.label')"
          :placeholder="t('globalMonitoringPage.store.tencentcloudcos.secretId.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.secret_id')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.secret_key"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.tencentcloudcos.secretKey.label')"
          :placeholder="t('globalMonitoringPage.store.tencentcloudcos.secretKey.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.secret_key')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.app_id"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.tencentcloudcos.appid.label')"
          :placeholder="t('globalMonitoringPage.store.tencentcloudcos.appid.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.app_id')"
        />
      </div>
    </div>
  </div>
</template>
