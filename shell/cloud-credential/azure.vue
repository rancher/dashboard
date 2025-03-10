<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import { azureEnvironments } from '@shell/machine-config/azure';
import { parseAzureError } from '@shell/utils/azure';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import FormValidation from '@shell/mixins/form-validation';

export default {
  emits: ['validationChanged', 'valueChanged'],

  components: { LabeledInput, LabeledSelect },
  mixins:     [CreateEditView, FormValidation],

  data() {
    if ( !this.value.decodedData.environment ) {
      this.value.setData('environment', 'AzurePublicCloud');
    }

    return {
      azureEnvironments,
      fvFormRuleSets: [
        { path: 'decodedData.clientId', rules: ['required'] },
        { path: 'decodedData.clientSecret', rules: ['required'] },
        { path: 'decodedData.subscriptionId', rules: ['required'] },
      ]
    };
  },

  watch: {
    fvFormIsValid(newValue) {
      this.$emit('validationChanged', !!newValue);
    }
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
            throw ( new Error(parsed));
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
          :label="t('cluster.credential.azure.environment.label')"
          data-testid="azure-cloud-credentials-environment"
          @update:value="$emit('valueChanged', 'environment', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.subscriptionId"
          label-key="cluster.credential.azure.subscriptionId.label"
          type="text"
          :mode="mode"
          :required="true"
          :rules="fvGetAndReportPathRules('decodedData.subscriptionId')"
          data-testid="azure-cloud-credentials-subscription-id"
          @update:value="$emit('valueChanged', 'subscriptionId', $event)"
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
          :rules="fvGetAndReportPathRules('decodedData.clientId')"
          data-testid="azure-cloud-credentials-client-id"
          @update:value="$emit('valueChanged', 'clientId', $event)"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.clientSecret"
          label-key="cluster.credential.azure.clientSecret.label"
          type="password"
          :mode="mode"
          :required="true"
          :rules="fvGetAndReportPathRules('decodedData.clientSecret')"
          data-testid="azure-cloud-credentials-client-secret"
          @update:value="$emit('valueChanged', 'clientSecret', $event)"
        />
      </div>
    </div>
  </section>
</template>
