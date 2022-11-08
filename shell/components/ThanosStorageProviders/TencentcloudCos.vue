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
  mixins:     [Provider],
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
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.region"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.tencentcloudcos.region.label')"
          :placeholder="t('globalMonitoringPage.store.tencentcloudcos.region.placeholder')"
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
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.secret_key"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.tencentcloudcos.secretKey.label')"
          :placeholder="t('globalMonitoringPage.store.tencentcloudcos.secretKey.placeholder')"
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
        />
      </div>
    </div>
  </div>
</template>
