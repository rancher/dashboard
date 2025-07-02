<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelector from '@shell/components/form/FileSelector';
import FormValidation from '@shell/mixins/form-validation';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';

export default {
  emits: ['validationChanged', 'valueChanged'],

  components: {
    LabeledInput, FileSelector, ToggleSwitch
  },
  mixins: [CreateEditView, FormValidation],

  data() {
    return {
      toggler:        true,
      fvFormRuleSets: [
        { path: 'decodedData.authEncodedJson', rules: ['required'] }]
    };
  },
  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    }
  },

  methods: {
    onFileSelected(data) {
      this.$emit('valueChanged', 'authEncodedJson', data);
    },

    async test() {
      let credentials = null;
      let config = null;
      let projectId = null;

      try {
        credentials = this.value.decodedData.authEncodedJson;
        console.log(credentials);
        config = JSON.parse(credentials || '{}');
        projectId = config?.project_id; // eslint-disable-line camelcase
      } catch (error) {
        return false;
      }

      try {
        await this.$store.dispatch('management/request', {
          url:                  '/meta/gkeZones',
          method:               'POST',
          data:                 { credentials, projectId },
          redirectUnauthorized: false,
        });

        return true;
      } catch (e) {
        return false;
      }
    },
  }
};
</script>

<template>
  <div>
    <LabeledInput
      :value="value.decodedData.authEncodedJson"
      label-key="cluster.credential.gcp.authEncodedJson.label"
      placeholder-key="cluster.credential.gcp.authEncodedJson.placeholder"
      type="multiline"
      :mode="mode"
      :required="true"
      :rules="fvGetAndReportPathRules('decodedData.authEncodedJson')"
      @update:value="$emit('valueChanged', 'authEncodedJson', $event)"
    />
    <FileSelector
      class="role-primary btn-sm mt-20 mb-20"
      :label="t('generic.readFromFile')"
      @selected="onFileSelected"
    />

    <ToggleSwitch
      v-model:value="toggler"
      name="label-system-toggle"
      :on-label="t('cluster.credential.gcp.authEncodedJson.gke')"
      :off-label="t('cluster.credential.gcp.authEncodedJson.gce')"
    />
    <p
      v-clean-html="!toggler ? t('cluster.credential.gcp.authEncodedJson.helpGCE', {}, true):t('cluster.credential.gcp.authEncodedJson.helpGKE', {}, true)"
      class="text-muted"
    />
  </div>
</template>
