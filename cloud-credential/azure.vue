<script>
import CreateEditView from '@/mixins/create-edit-view';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  mixins:     [CreateEditView],

  watch: {
    'value.decodedData.clientId'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.clientSecret'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.subscriptionId'(neu) {
      this.$emit('validationChanged', !!neu);
    },
    'value.decodedData.tenantId'(neu) {
      this.$emit('validationChanged', !!neu);
    },
  },

  methods: {
    async test() {
      const {
        clientId,
        clientSecret,
        subscriptionId,
        tenantId,
      } = this.value.decodedData;

      try {
        await this.$store.dispatch('management/request', {
          url:    '/meta/aksLocations',
          method: 'POST',
          data:   {
            clientId,
            clientSecret,
            subscriptionId,
            tenantId,
          },
        });

        return true;
      } catch (e) {
        return false;
      }
    },
  },
};
</script>

<template>
  <section>
    <div class="mb-10">
      <LabeledInput
        :value="value.decodedData.tenantId"
        label-key="cluster.credential.azure.tenantId.label"
        type="text"
        :mode="mode"
        @input="value.setData('tenantId', $event)"
      />
    </div>
    <div class="mb-10">
      <LabeledInput
        :value="value.decodedData.subscriptionId"
        label-key="cluster.credential.azure.subscriptionId.label"
        type="text"
        :mode="mode"
        @input="value.setData('subscriptionId', $event)"
      />
    </div>
    <div class="mb-10">
      <LabeledInput
        :value="value.decodedData.clientId"
        label-key="cluster.credential.azure.clientId.label"
        type="text"
        :mode="mode"
        @input="value.setData('clientId', $event)"
      />
    </div>
    <div>
      <LabeledInput
        :value="value.decodedData.clientSecret"
        label-key="cluster.credential.azure.clientSecret.label"
        type="password"
        :mode="mode"
        @input="value.setData('clientSecret', $event)"
      />
    </div>
  </section>
</template>
