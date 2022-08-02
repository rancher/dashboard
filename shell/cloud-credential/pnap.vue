<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  watch: {
    'value.decodedData.clientIdentifier'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.clientSecret'(neu) {
      this.$emit('validationChanged', !!neu);
    }
  },

  methods: {
    test() {
      return true;
    }
  }
};
</script>

<template>
  <div>
    <LabeledInput
      :value="value.decodedData.clientIdentifier"
      label-key="cluster.credential.pnap.clientIdentifier.label"
      placeholder-key="cluster.credential.pnap.clientIdentifier.placeholder"
      type="text"
      :mode="mode"
      @input="value.setData('clientIdentifier', $event);"
    />
    <LabeledInput
      :value="value.decodedData.clientSecret"
      label-key="cluster.credential.pnap.clientSecret.label"
      placeholder-key="cluster.credential.pnap.clientSecret.placeholder"
      type="text"
      :mode="mode"
      @input="value.setData('clientSecret', $event);"
    />
    <p class="text-muted mt-10" v-html="t('cluster.credential.pnap.clientSecret.help', {}, true)" />
  </div>
</template>
