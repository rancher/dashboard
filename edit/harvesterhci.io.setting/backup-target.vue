<script>
import Tip from '@/components/Tip';
import Password from '@/components/form/Password';
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

export default {
  name: 'HarvesterEditBackupTarget',

  components: {
    LabeledInput, LabeledSelect, Tip, Password
  },

  mixins: [CreateEditView],

  data() {
    let parseDefaultValue = {};

    try {
      parseDefaultValue = JSON.parse(this.value.value);
    } catch (error) {
      parseDefaultValue = JSON.parse(this.value.default);
    }

    if (!parseDefaultValue.type) {
      parseDefaultValue.type = 's3';
    }

    return {
      parseDefaultValue,
      errors: []
    };
  },

  computed: {
    typeOption() {
      return [{
        value: 'nfs',
        label: 'NFS'
      }, {
        value: 's3',
        label: 'S3'
      }];
    },

    virtualHostedStyleType() {
      return [{
        value: true,
        label: 'True'
      }, {
        value: false,
        label: 'False'
      }];
    },

    isS3() {
      return this.parseDefaultValue.type === 's3';
    },

    endpointPlaceholder() {
      return this.isS3 ? '' : 'nfs://server:/path/';
    }
  },

  watch: {
    'parseDefaultValue.type'(neu) {
      delete this.parseDefaultValue.accessKeyId;
      delete this.parseDefaultValue.secretAccessKey;
      delete this.parseDefaultValue.bucketName;
      delete this.parseDefaultValue.bucketRegion;
      delete this.parseDefaultValue.endpoint;
    }
  },

  created() {
    this.update();
  },

  methods: {
    update() {
      const value = JSON.stringify(this.parseDefaultValue);

      this.$set(this.value, 'value', value);
    }
  }
};
</script>

<template>
  <div class="row" @input="update">
    <div class="col span-12">
      <LabeledSelect v-model="parseDefaultValue.type" class="mb-20" :label="t('harvester.fields.type')" :options="typeOption" @input="update" />

      <LabeledInput v-model="parseDefaultValue.endpoint" class="mb-5" :placeholder="endpointPlaceholder" :mode="mode" label="Endpoint" />
      <Tip class="mb-20" icon="icon icon-info" :text="t('harvester.backup.backupTargetTip')" />

      <template v-if="isS3">
        <LabeledInput
          v-model="parseDefaultValue.bucketName"
          class="mb-20"
          :mode="mode"
          label="Bucket Name"
          required
        />

        <LabeledInput
          v-model="parseDefaultValue.bucketRegion"
          class="mb-20"
          :mode="mode"
          label="Bucket Region"
          required
        />

        <LabeledInput
          v-model="parseDefaultValue.accessKeyId"
          :placeholder="t('harvester.setting.placeholder.accessKeyId')"
          class="mb-20"
          :mode="mode"
          label="Access Key ID"
          required
        />

        <Password
          v-model="parseDefaultValue.secretAccessKey"
          class="mb-20"
          :mode="mode"
          :placeholder="t('harvester.setting.placeholder.secretAccessKey')"
          label="Secret Access Key"
          required
        />

        <LabeledSelect v-model="parseDefaultValue.virtualHostedStyle" class="mb-20" label="Virtual Hosted-Style" :options="virtualHostedStyleType" @input="update" />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
p {
  display: flex;
  align-items: center;
}
.icon-h-question {
  font-size: 24px;
}
.tip {
  font-size: 15px;
}
</style>
