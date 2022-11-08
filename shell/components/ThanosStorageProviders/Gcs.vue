<script>
import Provider from '@shell/mixins/thanos-storage-provider';
import { LabeledInput } from '@components/Form/LabeledInput';
import FileSelector, { createOnSelected } from '@shell/components/form/FileSelector.vue';

export const answers = {
  bucketName:     'thanos.objectConfig.config.bucket',
  serviceAccount: 'thanos.objectConfig.config.service_account',
};

export default {
  mixins: [Provider],

  data() {
    return {
      answers,
      name: 'gcs',
    };
  },

  methods: { onFileSelected: createOnSelected('value.thanos.objectConfig.config.service_account') },

  components: { LabeledInput, FileSelector },
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.bucket"
          :mode="mode"
          required
          :label="t('globalMonitoringPage.store.gcs.bucketName.label')"
          :placeholder="t('globalMonitoringPage.store.gcs.bucketName.placeholder')"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <LabeledInput
          v-model="value.thanos.objectConfig.config.service_account"
          :mode="mode"
          type="multiline"
          required
          :label="t('globalMonitoringPage.store.gcs.serviceAccount.label')"
          :placeholder="t('globalMonitoringPage.store.gcs.serviceAccount.placeholder')"
        />
        <FileSelector
          class="btn btn-sm bg-primary mt-10"
          :label="t('generic.readFromFile')"
          @selected="onFileSelected"
        />
      </div>
    </div>
  </div>
</template>
