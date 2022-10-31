<script>
import Tab from '@shell/components/Tabbed/Tab';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { Tab, LabeledInput },

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
};
</script>

<template>
  <Tab name="privateRegistry" label-key="cluster.import.privateRegistry.title">
    <div class="title">
      <h1>{{ t('cluster.import.privateRegistry.title') }}</h1>
      <h2>{{ t('cluster.import.privateRegistry.description') }}</h2>
    </div>
    <div class="mt-20">
      <LabeledInput
        v-model="value.spec.systemDefaultRegistry"
        :label="t('cluster.import.privateRegistry.label')"
        :placeholder="t('cluster.import.privateRegistry.placeholder')"
      />
    </div>
  </Tab>
</template>

<style lang="scss" scoped>
.title {
  h1 {
    font-size: 14px;
  }
  h2 {
    font-size: 12px;
    margin-bottom: 0;
    opacity: 0.8;
  }
}
</style>
