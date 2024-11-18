
<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { _CREATE } from '@shell/config/query-params';

export default {
  name:       'DirectoryConfig',
  components: { LabeledInput },
  props:      {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    disableEditInput() {
      return this.mode !== _CREATE;
    }
  }
};
</script>

<template>
  <div class="row">
    <div class="col span-8">
      <h3 class="mb-20">
        {{ t('cluster.directoryConfig.title') }}
      </h3>
      <LabeledInput
        v-model="value.systemAgent"
        class="mb-20"
        :mode="mode"
        :label="t('cluster.directoryConfig.systemAgent.label')"
        :tooltip="t('cluster.directoryConfig.systemAgent.tooltip')"
        :disabled="disableEditInput"
        data-testid="rke2-directory-config-systemAgent-data-dir"
      />
      <LabeledInput
        v-model="value.provisioning"
        class="mb-20"
        :mode="mode"
        :label="t('cluster.directoryConfig.provisioning.label')"
        :tooltip="t('cluster.directoryConfig.provisioning.tooltip')"
        :disabled="disableEditInput"
        data-testid="rke2-directory-config-provisioning-data-dir"
      />
      <LabeledInput
        v-model="value.k8sDistro"
        class="mb-20"
        :mode="mode"
        :label="t('cluster.directoryConfig.k8sDistro.label')"
        :tooltip="t('cluster.directoryConfig.k8sDistro.tooltip')"
        :disabled="disableEditInput"
        data-testid="rke2-directory-config-k8sDistro-data-dir"
      />
      <div class="mb-40" />
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
