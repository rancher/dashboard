
<script>
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import { _CREATE } from '@shell/config/query-params';

export default {
  name:       'DirectoryConfig',
  components: {
    Checkbox,
    LabeledInput,
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
  },
  data() {
    let atLeastOneDirWithAnIdentifier = false;
    let allDirsWithSameIdentifier = false;

    if (this.value.systemAgent.length || this.value.provisioning.length || this.value.k8sDistro.length) {
      atLeastOneDirWithAnIdentifier = true;
      if (this.value.systemAgent === this.value.provisioning && this.value.provisioning === this.value.k8sDistro &&
      this.value.systemAgent === this.value.k8sDistro) {
        allDirsWithSameIdentifier = true;
      }
    }

    return {
      isSettingCommonConfig: !(atLeastOneDirWithAnIdentifier && !allDirsWithSameIdentifier),
      commonConfig:          allDirsWithSameIdentifier ? this.value.systemAgent : '',
    };
  },
  watch: {
    commonConfig(neu) {
      if (neu && neu.length && this.isSettingCommonConfig) {
        this.value.systemAgent = neu;
        this.value.provisioning = neu;
        this.value.k8sDistro = neu;
      }
    }
  },
  computed: {
    disableEditInput() {
      return this.mode !== _CREATE;
    }
  },
  methods: {
    handleCommonConfig(val) {
      this.isSettingCommonConfig = val;

      if (val) {
        this.value.systemAgent = '';
        this.value.provisioning = '';
        this.value.k8sDistro = '';
      } else {
        this.commonConfig = '';
      }
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-8">
      <h3 class="mb-20">
        {{ t('cluster.directoryConfig.title') }}
      </h3>
      <Checkbox
        class="mb-10"
        :value="isSettingCommonConfig"
        :mode="mode"
        :label="t('cluster.directoryConfig.checkboxText')"
        :disabled="disableEditInput"
        data-testid="rke2-directory-config-individual-config-checkbox"
        @input="handleCommonConfig"
      />
      <LabeledInput
        v-if="isSettingCommonConfig"
        v-model="commonConfig"
        class="mb-20"
        :mode="mode"
        :label="t('cluster.directoryConfig.common.label')"
        :tooltip="t('cluster.directoryConfig.common.tooltip')"
        :disabled="disableEditInput"
        data-testid="rke2-directory-config-common-data-dir"
      />
      <div v-if="!isSettingCommonConfig">
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
      </div>
      <div class="mb-40" />
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>
