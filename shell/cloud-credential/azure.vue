<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import { azureEnvironments } from '@shell/machine-config/azure';
import { parseAzureError } from '@shell/utils/azure';
import LabeledSelect from '@shell/components/form/LabeledSelect';

export default {
  components: { LabeledInput, LabeledSelect },
  mixins:     [CreateEditView],

  data() {
    if ( !this.value.decodedData.environment ) {
      this.value.setData('environment', 'AzurePublicCloud');
    }

    return { azureEnvironments };
  },

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
    'value.decodedData.environment'(neu) {
      this.$emit('validationChanged', !!neu);
    },
  },

  methods: {
    async test() {
      const {
        clientId,
        clientSecret,
        subscriptionId,
        environment,
      } = this.value.decodedData;

      try {
        await this.$store.dispatch('management/request', {
          url:    '/meta/aksCheckCredentials',
          method: 'POST',
          data:   {
            clientId,
            clientSecret,
            subscriptionId,
            environment,
          },
          redirectUnauthorized: false,
        });

        return true;
      } catch (e) {
        if (e.error) {
          const parsed = parseAzureError(e.error);

          if (parsed) {
            return { errors: [parsed] };
          }
        }

        // Can't parse error, so go with the generic 'auth failed' error message
        return false;
      }
    },
  },
};
</script>

<template>
  <section>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledSelect
          :value="value.decodedData.environment"
          :mode="mode"
          :options="azureEnvironments"
          option-key="value"
          option-label="value"
          :searchable="false"
          :required="true"
          :label="t('cluster.credential.azure.environment.label')"
          data-testid="azure-cloud-credentials-environment"
          @input="value.setData('environment', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.subscriptionId"
          label-key="cluster.credential.azure.subscriptionId.label"
          type="text"
          :mode="mode"
          :required="true"
          data-testid="azure-cloud-credentials-subscription-id"
          @input="value.setData('subscriptionId', $event)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.clientId"
          label-key="cluster.credential.azure.clientId.label"
          type="text"
          :mode="mode"
          :required="true"
          data-testid="azure-cloud-credentials-client-id"
          @input="value.setData('clientId', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.clientSecret"
          label-key="cluster.credential.azure.clientSecret.label"
          type="password"
          :mode="mode"
          :required="true"
          data-testid="azure-cloud-credentials-client-secret"
          @input="value.setData('clientSecret', $event)"
        />
      </div>
    </div>
  </section>
</template>
