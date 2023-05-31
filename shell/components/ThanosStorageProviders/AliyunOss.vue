<script>
import Provider from '@shell/mixins/thanos-storage-provider';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

export const answers = {
  bucketName: 'thanos.objectConfig.config.bucket',
  endpoint:   'thanos.objectConfig.config.endpoint',
  accessKey:  'thanos.objectConfig.config.access_key_id',
  secretKey:  'thanos.objectConfig.config.access_key_secret'
};

const ENDPOINTS = [
  {
    value: 'oss-cn-hangzhou.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.hangzhou'
  },
  {
    value: 'oss-cn-shanghai.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.shanghai'
  },
  {
    value: 'oss-cn-qingdao.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.qingdao'
  },
  {
    value: 'oss-cn-beijing.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.beijing'
  },
  {
    value: 'oss-cn-zhangjiakou.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.zhangjiakou'
  },
  {
    value: 'oss-cn-huhehaote.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.huhehaote'
  },
  {
    value: 'oss-cn-shenzhen.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.shenzhen'
  },
  {
    value: 'oss-cn-heyuan.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.heyuan'
  },
  {
    value: 'oss-cn-chengdu.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.chengdu'
  },
  {
    value: 'oss-cn-hongkong.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.hongkong'
  },
  {
    value: 'oss-us-west-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.west-1'
  },
  {
    value: 'oss-us-east-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.east-1'
  },
  {
    value: 'oss-ap-southeast-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.southeast-1'
  },
  {
    value: 'oss-ap-southeast-2.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.southeast-2'
  },
  {
    value: 'oss-ap-southeast-3.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.southeast-3'
  },
  {
    value: 'oss-ap-southeast-5.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.southeast-5'
  },
  {
    value: 'oss-ap-northeast-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.northeast-1'
  },
  {
    value: 'oss-ap-south-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.south-1'
  },
  {
    value: 'oss-eu-central-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.eu-central-1'
  },
  {
    value: 'oss-eu-west-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.eu-west-1'
  },
  {
    value: 'oss-me-east-1.aliyuncs.com',
    label: 'globalMonitoringPage.store.aliyunoss.endpoint.me-east-1'
  },
];

export default {
  props: {
    optionLabel: {
      type:    String,
      default: 'label',
    },
    fvGetAndReportPathRules: {
      type:     Function,
      default:  () => {},
      required: true,
    },
  },

  mixins: [Provider],

  components: {
    LabeledInput,
    LabeledSelect,
  },

  data() {
    return {
      answers,
      name:            'aliyunoss',
      endpointChoices: ENDPOINTS,
      endpoint:        ENDPOINTS[0].value,
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
          :label="t('globalMonitoringPage.store.aliyunoss.bucketName.label')"
          :placeholder="t('globalMonitoringPage.store.aliyunoss.bucketName.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.bucket')"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-model="value.thanos.objectConfig.config.endpoint"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.aliyunoss.endpoint.label')"
          :options="endpointChoices"
          :option-label="optionLabel"
          :localized-label="true"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.endpoint')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.access_key_id"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.aliyunoss.accessKey.label')"
          :placeholder="t('globalMonitoringPage.store.aliyunoss.accessKey.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.access_key_id')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.access_key_secret"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.aliyunoss.secretKey.label')"
          :placeholder="t('globalMonitoringPage.store.aliyunoss.secretKey.placeholder')"
          :rules="fvGetAndReportPathRules('thanos.objectConfig.config.access_key_secret')"
        />
      </div>
    </div>
  </div>
</template>
