<script>
import { get } from '@shell/utils/object';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import DrainOptions from '@shell/edit/provisioning.cattle.io.cluster/tabs/upgrade/DrainOptions';

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
  },

  computed: {
    rkeConfig() {
      return this.value.spec.rkeConfig;
    },
  },
  methods: { get }
};
</script>

<template>
  <div>
    <Banner
      v-if="get(rkeConfig, 'upgradeStrategy.controlPlaneDrainOptions.deleteEmptyDirData')"
      color="warning"
    >
      {{ t('cluster.rke2.drain.deleteEmptyDir.warning', {}, true) }}
    </Banner>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('cluster.rke2.controlPlaneConcurrency.header') }}</h3>
        <LabeledInput
          v-model:value="rkeConfig.upgradeStrategy.controlPlaneConcurrency"
          :mode="mode"
          :label="t('cluster.rke2.controlPlaneConcurrency.label')"
          :tooltip="t('cluster.rke2.controlPlaneConcurrency.toolTip')"
        />
        <div class="spacer" />
        <DrainOptions
          v-model:value="rkeConfig.upgradeStrategy.controlPlaneDrainOptions"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <h3>
          {{ t('cluster.rke2.workNode.label') }}
        </h3>
        <LabeledInput
          v-model:value="rkeConfig.upgradeStrategy.workerConcurrency"
          :mode="mode"
          :label="t('cluster.rke2.workerConcurrency.label')"
          :tooltip="t('cluster.rke2.workerConcurrency.toolTip')"
        />
        <div class="spacer" />
        <DrainOptions
          v-model:value="rkeConfig.upgradeStrategy.workerDrainOptions"
          :mode="mode"
        />
      </div>
    </div>
  </div>
</template>
