<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import FormValidation from '@shell/mixins/form-validation';

export default {
  emits: ['validationChanged', 'valueChanged'],

  components: {
    Loading, Checkbox, LabeledInput, LabeledSelect
  },
  mixins: [CreateEditView, FormValidation],

  async fetch() {
    let cur = (this.value.decodedData.defaultRegion || '').toLowerCase();

    if ( !cur ) {
      cur = this.$store.getters['aws/defaultRegion'];
      this.value.setData('defaultRegion', cur);
    }

    this.knownRegions = await this.$store.dispatch('aws/defaultRegions');

    if ( !this.knownRegions.includes(cur) ) {
      this.knownRegions.unshift(cur);
    }
  },

  data() {
    return {
      knownRegions:   null,
      fvFormRuleSets: [
        { path: 'decodedData.accessKey', rules: ['required'] },
        { path: 'decodedData.secretKey', rules: ['required'] }]
    };
  },
  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    }
  }
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    :delayed="true"
  />
  <div v-else>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.accessKey"
          :required="true"
          label-key="cluster.credential.s3.accessKey.label"
          placeholder-key="cluster.credential.s3.accessKey.placeholder"
          type="text"
          :mode="mode"
          :rules="fvGetAndReportPathRules('decodedData.accessKey')"
          @update:value="$emit('valueChanged', 'accessKey', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.secretKey"
          :required="true"
          label-key="cluster.credential.s3.secretKey.label"
          placeholder-key="cluster.credential.s3.secretKey.placeholder"
          type="password"
          :mode="mode"
          :rules="fvGetAndReportPathRules('decodedData.secretKey')"
          @update:value="$emit('valueChanged', 'secretKey', $event)"
        />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.defaultBucket"
          :mode="mode"
          label-key="cluster.credential.s3.defaultBucket.label"
          placeholder-key="cluster.credential.s3.defaultBucket.placeholder"
          @update:value="value.setData('defaultBucket', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.defaultFolder"
          :mode="mode"
          label-key="cluster.credential.s3.defaultFolder.label"
          placeholder-key="cluster.credential.s3.defaultFolder.placeholder"
          @update:value="value.setData('defaultFolder', $event)"
        />
      </div>
    </div>

    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          :value="value.decodedData.defaultRegion"
          label-key="cluster.credential.s3.defaultRegion.label"
          placeholder-key="cluster.credential.s3.defaultRegion.placeholder"
          :mode="mode"
          :taggable="true"
          :options="knownRegions"
          @update:value="value.setData('defaultRegion', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.defaultEndpoint"
          :mode="mode"
          label-key="cluster.credential.s3.defaultEndpoint.label"
          placeholder-key="cluster.credential.s3.defaultEndpoint.placeholder"
          @update:value="value.setData('defaultEndpoint', $event)"
        />
      </div>
    </div>

    <div class="mt-20">
      <Checkbox
        :value="value.decodedData.defaultSkipSSLVerify"
        :mode="mode"
        label-key="cluster.credential.s3.defaultSkipSSLVerify.label"
        @update:value="value.setData('defaultSkipSSLVerify', $event)"
      />

      <LabeledInput
        v-if="!value.decodedData.defaultSkipSSLVerify"
        :value="value.decodedData.defaultEndpointCA"
        type="multiline"
        label-key="cluster.credential.s3.defaultEndpointCA.label"
        placeholder-key="cluster.credential.s3.defaultEndpointCA.placeholder"
        @update:value="value.setData('defaultEndpointCA', $event)"
      />
    </div>
  </div>
</template>
