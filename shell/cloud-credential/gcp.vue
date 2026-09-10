<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FileSelectorTextArea from '@shell/components/form/FileSelectorTextArea.vue';
import FormValidation from '@shell/mixins/form-validation';

export default {
  emits: ['validationChanged', 'valueChanged'],

  components: { FileSelectorTextArea },
  mixins:     [CreateEditView, FormValidation],

  data() {
    return {
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
    async test() {
      let credentials = null;
      let config = null;
      let projectId = null;

      try {
        credentials = this.value.decodedData.authEncodedJson;
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
    <FileSelectorTextArea
      class="mb-20"
      :value="value.decodedData.authEncodedJson"
      label-key="cluster.credential.gcp.authEncodedJson.label"
      placeholder-key="cluster.credential.gcp.authEncodedJson.placeholder"
      :mode="mode"
      :required="true"
      :rules="fvGetAndReportPathRules('decodedData.authEncodedJson')"
      @update:value="$emit('valueChanged', 'authEncodedJson', $event)"
    />
    <p
      v-clean-html="t('cluster.credential.gcp.authEncodedJson.help.shared', {}, true)"
      class="text-muted"
    />
    <p
      v-clean-html="t('cluster.credential.gcp.authEncodedJson.help.gke', {}, true)"
      class="text-muted mt-20"
    />
    <p
      v-clean-html="t('cluster.credential.gcp.authEncodedJson.help.gce', {}, true)"
      class="text-muted mt-20"
    />
  </div>
</template>
