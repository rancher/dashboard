<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledInput from '@shell/components/form/LabeledInput';
import FileSelector from '@shell/components/form/FileSelector';

export default {
  components: { LabeledInput, FileSelector },
  mixins:     [CreateEditView],

  watch: {
    'value.decodedData.authEncodedJson'(neu) {
      this.$emit('validationChanged', !!neu);
    }
  },

  methods: {
    onFileSelected(data) {
      this.value.setData('authEncodedJson', data);
    },

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
    <LabeledInput
      :value="value.decodedData.authEncodedJson"
      label-key="cluster.credential.gcp.authEncodedJson.label"
      placeholder-key="cluster.credential.gcp.authEncodedJson.placeholder"
      type="multiline"
      :mode="mode"
      @input="value.setData('authEncodedJson', $event);"
    />
    <FileSelector class="role-primary btn-sm mt-20 mb-20" :label="t('generic.readFromFile')" @selected="onFileSelected" />
    <p class="text-muted" v-html="t('cluster.credential.gcp.authEncodedJson.help', {}, true)" />
  </div>
</template>
