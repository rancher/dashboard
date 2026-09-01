<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import FormValidation from '@shell/mixins/form-validation';

export default {
  emits: ['validationChanged', 'valueChanged'],

  components: { LabeledInput },
  mixins:     [CreateEditView, FormValidation],

  data() {
    return { fvFormRuleSets: [{ path: 'decodedData.accessToken', rules: ['required'] }] };
  },
  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    }
  },

  methods: {
    async test() {
      try {
        await this.$store.dispatch('digitalocean/request', {
          token:   this.value.decodedData.accessToken,
          command: 'regions'
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
      :value="value.decodedData.accessToken"
      label-key="cluster.credential.digitalocean.accessToken.label"
      placeholder-key="cluster.credential.digitalocean.accessToken.placeholder"
      type="password"
      :mode="mode"
      :required="true"
      :rules="fvGetAndReportPathRules('decodedData.accessToken')"
      @update:value="$emit('valueChanged', 'accessToken', $event)"
    />
    <p
      v-clean-html="t('cluster.credential.digitalocean.accessToken.help', {}, true)"
      class="text-muted mt-10"
    />
  </div>
</template>
