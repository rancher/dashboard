<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';

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
          accessKeyID:     this.value.decodedData.accessKeyId,
          accessKeySecret: this.value.decodedData.accessKeySecret,
          acceptLanguage:  'zh-CN',
        };

        await this.$store.dispatch('rancher/request', {
          url:    '/meta/ack/ackCheckCredentials',
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
  <Loading v-if="$fetchState.pending" :delayed="true" />
  <div v-else>
    <LabeledInput
      :value="value.decodedData.accessKeyId"
      label-key="cluster.credential.aliyun.accessKey.label"
      placeholder-key="cluster.credential.aliyun.accessKey.placeholder"
      type="text"
      :mode="mode"
      @input="value.setData('accessKeyId', $event);"
    />
    <LabeledInput
      :value="value.decodedData.accessKeySecret"
      class="mt-20"
      label-key="cluster.credential.aliyun.secretKey.label"
      placeholder-key="cluster.credential.aliyun.secretKey.placeholder"
      type="password"
      :mode="mode"
      @input="value.setData('accessKeySecret', $event);"
    />
  </div>
</template>
