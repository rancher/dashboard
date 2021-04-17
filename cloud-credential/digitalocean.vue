<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';
import { CAPI } from '@/config/labels-annotations';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  data() {
    // Mark the token as the public/api key field for display
    this.value.setAnnotation(CAPI.PUBLIC_DATA, 'prefix:accessToken');
  },

  watch: {
    'value.decodedData.accessToken'(neu) {
      this.$emit('validationChanged', !!neu);
    }
  },

  methods: {
    async test() {
      try {
        await this.$store.dispatch('digitalocean/request', {
          token:   this.value.decodedData.accessToken,
          command: 'regions'
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
      :value="value.decodedData.accessToken"
      label-key="cluster.credential.digitalocean.accessToken.label"
      placeholder-key="cluster.credential.digitalocean.accessToken.placeholder"
      type="password"
      :mode="mode"
      @input="value.setData('accessToken', $event);"
    />
    <p class="text-muted" v-html="t('cluster.credential.digitalocean.accessToken.help', {}, true)" />
  </div>
</template>
