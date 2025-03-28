<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import FormValidation from '@shell/mixins/form-validation';

export default {
  emits: ['validationChanged', 'valueChanged'],

  components: {
    Loading, LabeledInput, LabeledSelect
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
        { path: 'decodedData.secretKey', rules: ['required'] },
      ]
    };
  },

  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    }
  },

  methods: {
    async test() {
      try {
        const client = await this.$store.dispatch('aws/ec2', {
          region:    this.value.decodedData.defaultRegion || this.$store.getters['aws/defaultRegion'],
          accessKey: this.value.decodedData.accessKey,
          secretKey: this.value.decodedData.secretKey,
        });

        await client.describeRegions({});

        return true;
      } catch (e) {
        return false;
      }
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
    <LabeledInput
      :value="value.decodedData.accessKey"
      label-key="cluster.credential.aws.accessKey.label"
      placeholder-key="cluster.credential.aws.accessKey.placeholder"
      type="text"
      :rules="fvGetAndReportPathRules('decodedData.accessKey')"
      :mode="mode"
      :required="true"
      data-testid="access-key"
      @update:value="$emit('valueChanged', 'accessKey', $event)"
    />
    <LabeledInput
      :value="value.decodedData.secretKey"
      class="mt-20"
      label-key="cluster.credential.aws.secretKey.label"
      placeholder-key="cluster.credential.aws.secretKey.placeholder"
      type="password"
      :rules="fvGetAndReportPathRules('decodedData.secretKey')"
      :mode="mode"
      :required="true"
      data-testid="secret-key"
      @update:value="$emit('valueChanged', 'secretKey', $event)"
    />
    <LabeledSelect
      :value="value.decodedData.defaultRegion"
      class="mt-20"
      label-key="cluster.credential.aws.defaultRegion.label"
      placeholder-key="cluster.credential.aws.defaultRegion.placeholder"
      :mode="mode"
      :taggable="true"
      :options="knownRegions"
      @update:value="$emit('valueChanged', 'defaultRegion', $event)"
    />
    <p
      v-clean-html="t('cluster.credential.aws.defaultRegion.help', {}, true)"
      class="text-muted mt-5"
    />
  </div>
</template>
