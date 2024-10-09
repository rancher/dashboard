<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import FormValidation from '@shell/mixins/form-validation';

export default {
  emits: ['validationChanged', 'valueChanged'],

  components: { LabeledInput },
  mixins:     [CreateEditView, FormValidation],

  data() {
    return {
      fvFormRuleSets: [
        { path: 'decodedData.token', rules: ['required'] }]
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
        await this.$store.dispatch('linode/request', {
          token:   this.value.decodedData.token,
          command: 'profile'
        });

        return true;
      } catch (e) {
        return false;
      }
    }
  }
};
</script>

<template>
  <div>
    <LabeledInput
      :value="value.decodedData.token"
      label-key="cluster.credential.linode.accessToken.label"
      placeholder-key="cluster.credential.linode.accessToken.placeholder"
      type="password"
      :mode="mode"
      :required="true"
      :rules="fvGetAndReportPathRules('decodedData.token')"
      @update:value="$emit('valueChanged', 'token', $event)"
    />
    <p
      v-clean-html="t('cluster.credential.linode.accessToken.help', {}, true)"
      class="text-muted mt-10"
    />
  </div>
</template>
