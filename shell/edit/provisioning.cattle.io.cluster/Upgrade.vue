<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import DrainOptions from './DrainOptions';

export default {
  components: {
    LabeledInput,
    Banner,
    DrainOptions
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
    get: {
      type:     Function,
      required: true,
    },
  },

  computed: {
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },
  },
};
</script>

<template>
  <div>
    <Banner
      v-if="get(rkeConfig, 'upgradeStrategy.controlPlaneDrainOptions.deleteEmptyDirData')"
      color="warning"
    >
      {{ t('cluster.rke2.deleteEmptyDir', {}, true) }}
    </Banner>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('cluster.rke2.controlPlaneConcurrency.header') }}</h3>
        <LabeledInput
          v-model="rkeConfig.upgradeStrategy.controlPlaneConcurrency"
          :mode="mode"
          :label="t('cluster.rke2.controlPlaneConcurrency.label')"
          :tooltip="t('cluster.rke2.controlPlaneConcurrency.toolTip')"
        />
        <div class="spacer" />
        <DrainOptions
          v-model="rkeConfig.upgradeStrategy.controlPlaneDrainOptions"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <h3>
          {{ t('cluster.rke2.workNode.label') }}
        </h3>
        <LabeledInput
          v-model="rkeConfig.upgradeStrategy.workerConcurrency"
          :mode="mode"
          :label="t('cluster.rke2.workerConcurrency.label')"
          :tooltip="t('cluster.rke2.workerConcurrency.toolTip')"
        />
        <div class="spacer" />
        <DrainOptions
          v-model="rkeConfig.upgradeStrategy.workerDrainOptions"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
