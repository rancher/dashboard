<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

const REGIONS = [
  'cn-east-3',
  'af-south-1',
  'cn-north-4',
  'cn-north-1',
  'cn-north-9',
  'cn-east-2',
  'cn-south-1',
  'eu-west-0',
  'eu-west-101',
  'tr-west-1',
  'cn-southwest-2',
  'ap-southeast-2',
  'ap-southeast-3',
  'ae-ad-1',
  'ap-southeast-1',
];

const getHuaweiRegionChoices = (regions) => {
  return regions.map((item) => {
    return {
      label: `cluster.credential.huawei.regionID.${ item.replace(/\-/g, '_') }`,
      value: item
    };
  });
};

const HUAWEI_REGION_CHOICES = getHuaweiRegionChoices(REGIONS);

export default {
  components: { LabeledInput, LabeledSelect },
  mixins:     [CreateEditView],

  data() {
    return { huaweiRegionChoices: HUAWEI_REGION_CHOICES };
  },

  watch: {
    'value.decodedData.regionID'(neu) {
      this.$emit('validationChanged', !!neu);
    },

    'value.decodedData.projectID'(neu) {
      this.$emit('validationChanged', !!neu);
    },

    'value.decodedData.accessKey'(neu) {
      this.$emit('validationChanged', !!neu);
    },

    'value.decodedData.secretKey'(neu) {
      this.$emit('validationChanged', !!neu);
    },
  },

  methods: {
    async test() {
      try {
        const authConfig = {
          projectID: this.value.decodedData.projectID,
          accessKey: this.value.decodedData.accessKey,
          secretKey: this.value.decodedData.secretKey,
          regionID:  this.value.decodedData.regionID,
        };

        await this.$store.dispatch('rancher/request', {
          url:    '/meta/cce/cceCheckCredentials',
          method: 'POST',
          data:   authConfig,
        });

        return true;
      } catch (e) {
        return false;
      }
    },
  },

  mounted() {
    if (!this.value?.decodedData?.regionID) {
      this.value.setData('regionID', 'cn-east-3');
    }
  }
};
</script>

<template>
  <div>
    <LabeledSelect
      v-model="value.decodedData.regionID"
      label-key="cluster.credential.huawei.regionID.label"
      :localized-label="true"
      :options="huaweiRegionChoices"
      :mode="mode"
      @input="value.setData('regionID', $event);"
    />
    <LabeledInput
      :value="value.decodedData.projectID"
      class="mt-20"
      label-key="cluster.credential.huawei.projectId.label"
      placeholder-key="cluster.credential.huawei.projectId.placeholder"
      type="text"
      :mode="mode"
      @input="value.setData('projectID', $event);"
    />
    <LabeledInput
      :value="value.decodedData.accessKey"
      class="mt-20"
      label-key="cluster.credential.huawei.accessKey.label"
      placeholder-key="cluster.credential.huawei.accessKey.placeholder"
      type="text"
      :mode="mode"
      @input="value.setData('accessKey', $event);"
    />
    <LabeledInput
      :value="value.decodedData.secretKey"
      class="mt-20"
      label-key="cluster.credential.huawei.secretKey.label"
      placeholder-key="cluster.credential.huawei.secretKey.placeholder"
      type="password"
      :mode="mode"
      @input="value.setData('secretKey', $event);"
    />
    <p
      v-clean-html="t('cluster.credential.huawei.regionID.help', {}, true)"
      class="text-muted mt-5"
    />
  </div>
</template>
