<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  watch: {
    'value.decodedData.token'(neu) {
      this.$emit('validationChanged', !!neu);
    }
  },

  methods: {
    async test() {
      try {
        await this.$store.dispatch('linode/request', {
          token:   this.value.decodedData.token,
          command: 'profile'
        });

        return true;
      } catch (e) {
        return false;
      }
    }
  }
};
</script>

<template>
  <div>
    <LabeledInput
      :value="value.decodedData.token"
      label-key="cluster.credential.linode.accessToken.label"
      placeholder-key="cluster.credential.linode.accessToken.placeholder"
      type="password"
      :mode="mode"
      @input="value.setData('token', $event);"
    />
    <p
      class="text-muted mt-10"
      v-html="t('cluster.credential.linode.accessToken.help', {}, true)"
    />
  </div>
</template>
