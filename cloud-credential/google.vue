<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  watch: {
    'value.decodedData.authEncodedJson'(neu) {
      this.$emit('validationChanged', !!neu);
    }
  },

  methods: {
    async test() {
      // @TODO an actual test
      return true;
    }
  }
};
</script>

<template>
  <div>
    <LabeledInput
      :value="value.decodedData.accessToken"
      label-key="cluster.credential.google.authEncodedJson.label"
      placeholder-key="cluster.credential.digitalocean.accessToken.placeholder"
      type="multiline"
      :mode="mode"
      @input="value.setData('accessToken', $event);"
    />
    <p class="text-muted" v-html="t('cluster.credential.digitalocean.accessToken.help', {}, true)" />
  </div>
</template>
