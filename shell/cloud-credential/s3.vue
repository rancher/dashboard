<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: {
    Loading, Checkbox, LabeledInput, LabeledSelect
  },
  mixins: [CreateEditView],

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
    return { knownRegions: null };
  },

  watch: {
    'value.decodedData.accessKey'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.secretKey'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.defaultBucket'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.defaultFolder'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.defaultRegion'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.defaultEndpointCA'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.defaultEndpoint'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.defaulSkipSSLVerify'(neu) {
      this.$emit('validationChanged', !!neu);
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" :delayed="true" />
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
          @input="value.setData('accessKey', $event);"
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
          @input="value.setData('secretKey', $event);"
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
          @input="value.setData('defaultBucket', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.defaultFolder"
          :mode="mode"
          label-key="cluster.credential.s3.defaultFolder.label"
          placeholder-key="cluster.credential.s3.defaultFolder.placeholder"
          @input="value.setData('defaultFolder', $event)"
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
          @input="value.setData('defaultRegion', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.defaultEndpoint"
          :mode="mode"
          label-key="cluster.credential.s3.defaultEndpoint.label"
          placeholder-key="cluster.credential.s3.defaultEndpoint.placeholder"
          @input="value.setData('defaultEndpoint', $event)"
        />
      </div>
    </div>

    <div class="mt-20">
      <Checkbox
        :value="value.decodedData.defaultSkipSSLVerify"
        :mode="mode"
        label-key="cluster.credential.s3.defaultSkipSSLVerify.label"
        @input="value.setData('defaultSkipSSLVerify', $event)"
      />

      <LabeledInput
        v-if="!value.decodedData.defaultSkipSSLVerify"
        :value="value.decodedData.defaultEndpointCA"
        type="multiline"
        label-key="cluster.credential.s3.defaultEndpointCA.label"
        placeholder-key="cluster.credential.s3.defaultEndpointCA.placeholder"
        @input="value.setData('defaultEndpointCA', $event)"
      />
    </div>
  </div>
</template>
