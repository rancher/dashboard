<script>
/**
 * The Route and Receiver resources are deprecated. Going forward,
 * routes and receivers should be configured within AlertmanagerConfigs.
 * Any updates to receiver configuration forms, such as Slack/email/PagerDuty
 * etc, should be made to the receiver forms that are based on the
 * AlertmanagerConfig resource, which has a different API. The new forms are
 * located in @shell/edit/monitoring.coreos.com.alertmanagerconfig/types.
 */
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import isEmpty from 'lodash/isEmpty';

export default {
  components: { LabeledInput, LabeledSelect },
  props:      {
    mode: {
      type:     String,
      required: true,
    },
    value: {
      type:     Object,
      required: true
    }
  },
  data() {
    this.$set(this.value, 'basic_auth', this.value.basic_auth || {});

    const authOptions = [
      {
        value: 'none',
        label: this.t('monitoringReceiver.auth.none.label')
      },
      {
        value:   'basic_auth',
        label:   this.t('monitoringReceiver.auth.basicAuth.label'),
        default: {}
      },
      {
        value:   'bearer_token',
        label:   this.t('monitoringReceiver.auth.bearerToken.label'),
        default: ''
      },
      {
        value:   'bearer_token_file',
        label:   this.t('monitoringReceiver.auth.bearerTokenFile.label'),
        default: ''
      }
    ];
    const authTypes = authOptions.map(option => option.value);
    const authType = authTypes.find(authType => !isEmpty(this.value[authType])) || authTypes[0];

    this.initializeType(authOptions, authType);

    return {
      authOptions,
      authTypes,
      authType
    };
  },
  methods: {
    initializeType(authOptions, type) {
      authOptions.forEach((authOption) => {
        if (authOption.value === type && type !== 'none') {
          this.$set(this.value, authOption.value, this.value[authOption.value] || authOption.default);
        } else if (typeof this.value[authOption.value] !== 'undefined') {
          this.$delete(this.value, authOption.value);
        }
      });
    },
  }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <h3>{{ t('monitoringReceiver.auth.label') }}</h3>
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-12">
        <LabeledSelect
          v-model="authType"
          :options="authOptions"
          label="Auth Type"
          @input="initializeType(authOptions, authType)"
        />
      </div>
    </div>
    <div
      v-if="authType === 'basic_auth'"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model="value.basic_auth.username"
          :mode="mode"
          :label="t('monitoringReceiver.auth.username')"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model="value.basic_auth.password"
          :mode="mode"
          :label="t('monitoringReceiver.auth.password')"
          type="password"
          autocomplete="password"
        />
      </div>
    </div>
    <div
      v-else-if="authType === 'bearer_token'"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model="value.bearer_token"
          :mode="mode"
          :label="t('monitoringReceiver.auth.bearerToken.label')"
          :placeholder="t('monitoringReceiver.auth.bearerToken.placeholder')"
          type="password"
          autocomplete="password"
        />
      </div>
    </div>
    <div
      v-else-if="authType === 'bearer_token_file'"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model="value.bearer_token_file"
          :mode="mode"
          :label="t('monitoringReceiver.auth.bearerTokenFile.label')"
          :placeholder="t('monitoringReceiver.auth.bearerTokenFile.placeholder')"
        />
      </div>
    </div>
  </div>
</template>
