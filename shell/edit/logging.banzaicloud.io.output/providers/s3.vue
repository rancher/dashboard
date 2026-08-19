<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SecretSelector from '@shell/components/form/SecretSelector';

export default {
  components: {
    Checkbox, LabeledInput, LabeledSelect, SecretSelector
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    disabled: {
      type:    Boolean,
      default: false
    },
    mode: {
      type:     String,
      required: true,
    },
    namespace: {
      type:     String,
      required: true
    }
  },

  async fetch() {
    const regions = await this.$store.dispatch('aws/defaultRegions');
    const current = this.value.s3_region;

    // An Output can point at an S3-compatible service with a region that AWS
    // does not know about, so keep it as an option instead of showing nothing.
    this.knownRegions = current && !regions.includes(current) ? [current, ...regions] : regions;
  },

  data() {
    return { knownRegions: [] };
  },

  computed: {
    overwrite: {
      get() {
        return this.value.overwrite === 'true';
      },
      set(value) {
        this.value['overwrite'] = value.toString();
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.target') }}</h3>
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.s3_region"
          :mode="mode"
          :disabled="disabled"
          :options="knownRegions"
          :taggable="true"
          :searchable="true"
          :tooltip="t('logging.s3.regionTooltip')"
          data-testid="s3-region"
          :label="t('logging.s3.region')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.s3_endpoint"
          :mode="mode"
          :disabled="disabled"
          :tooltip="t('logging.s3.endpointTooltip')"
          :label="t('logging.s3.endpoint')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.s3_bucket"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.s3.bucket')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.path"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.s3.path')"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6 offset-6">
        <Checkbox
          v-model:value="overwrite"
          :mode="mode"
          :disabled="disabled"
          :label="t('logging.s3.overwriteExistingPath')"
        />
      </div>
    </div>
    <div class="spacer" />
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('logging.output.sections.access') }}</h3>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.aws_key_id"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.s3.keyId')"
          :show-key-selector="true"
        />
      </div>
      <div class="col span-6">
        <SecretSelector
          v-model:value="value.aws_sec_key"
          :mode="mode"
          :namespace="namespace"
          :disabled="disabled"
          :secret-name-label="t('logging.s3.secretKey')"
          :show-key-selector="true"
        />
      </div>
    </div>
  </div>
</template>
