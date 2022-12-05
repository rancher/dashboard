<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';

export default {
  components: { Loading, LabeledInput },
  mixins:     [CreateEditView],

  fetch() {
  },

  data() {
    return {};
  },

  watch: {
    'value.decodedData.accessKeyId'(neu) {
      this.$emit('validationChanged', !!neu);
    },

    'value.decodedData.accessKeySecret'(neu) {
      this.$emit('validationChanged', !!neu);
    },
  },

  methods: {
    async test() {
      try {
        const authConfig = {
          secretId:  this.value.decodedData.accessKeyId,
          secretKey: this.value.decodedData.accessKeySecret,
        };

        await this.$store.dispatch('rancher/request', {
          url:    '/meta/tke/tkeCheckCredentials',
          method: 'POST',
          data:   authConfig,
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
  <Loading
    v-if="$fetchState.pending"
    :delayed="true"
  />
  <div v-else>
    <LabeledInput
      :value="value.decodedData.accessKeyId"
      label-key="cluster.credential.tke.accessKeyId.label"
      placeholder-key="cluster.credential.tke.accessKeyId.placeholder"
      type="text"
      :mode="mode"
      @input="value.setData('accessKeyId', $event);"
    />
    <LabeledInput
      :value="value.decodedData.accessKeySecret"
      class="mt-20"
      label-key="cluster.credential.tke.accessKeySecret.label"
      placeholder-key="cluster.credential.tke.accessKeySecret.placeholder"
      type="password"
      :mode="mode"
      @input="value.setData('accessKeySecret', $event);"
    />
  </div>
</template>
