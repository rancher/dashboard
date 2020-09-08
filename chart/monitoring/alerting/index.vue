<script>
import isEmpty from 'lodash/isEmpty';

import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';

const DEFAULT_MONITORING_NAMESPACE = 'cattle-monitoring-system';

export default {
  components: {
    Banner,
    Checkbox,
    LabeledSelect,
    RadioGroup,
  },

  props: {
    mode: {
      type:    String,
      default: 'create',
    },

    secrets: {
      type:    Array,
      default: () => ([]),
    },

    value: {
      type:    Object,
      default: () => ({}),
    },
  },

  data() {
    return { useExistingSecret: true };
  },

  computed: {
    allSecrets() {
      const { secrets } = this;

      return secrets.map(sec => ({ label: sec.metadata.name, value: sec.metadata.name }));
    },

    canUseExistingSecret() {
      const { filteredSecrets, useExistingSecret } = this;

      return filteredSecrets.length > 0 && !!useExistingSecret;
    },

    filteredSecrets() {
      const { secrets } = this;
      const filtered = [];

      secrets.forEach((secret) => {
        if (
          secret.metadata.name &&
          secret.metadata.namespace === DEFAULT_MONITORING_NAMESPACE
        ) {
          filtered.push(secret.metadata.name);
        }
      });

      return filtered;
    },

    forceCreateNewSecret() {
      const { filteredSecrets } = this;

      return isEmpty(filteredSecrets);
    },
  },

  watch: {
    filteredSecrets(newValue, oldValue) {
      if (isEmpty(newValue)) {
        this.useExistingSecret = false;
      }
    },
  },
};
</script>

<template>
  <div>
    <div class="title">
      <h3><t k="monitoring.alerting.title" /></h3>
    </div>
    <div class="alerting-config">
      <div class="row">
        <div class="col span-6">
          <Checkbox v-model="value.alertmanager.enabled" :label="t('monitoring.alerting.enable.label')" />
        </div>
      </div>
      <template v-if="value.alertmanager.enabled">
        <div class="row">
          <div class="col span-12">
            <Banner color="info">
              <template #default>
                <t k="monitoring.alerting.secrets.info" :raw="true" />
              </template>
            </Banner>
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <RadioGroup
              v-model="useExistingSecret"
              :disabled="forceCreateNewSecret"
              :label="t('monitoring.alerting.secrets.radio.label')"
              :labels="[t('monitoring.alerting.secrets.new'),t('monitoring.alerting.secrets.existing')]"
              :mode="mode"
              :options="[false, true]"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-if="canUseExistingSecret"
              v-model="value.alertmanager.alertmanagerSpec.configSecret"
              class="provider"
              :label="t('monitoring.alerting.secrets.label')"
              :options="filteredSecrets"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.alertmanager.alertmanagerSpec.secrets"
              :options="allSecrets"
              :label="t('monitoring.alerting.secrets.additional.label')"
              :mode="mode"
              :multiple="true"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.alerting-config {
  > .row {
    padding: 10px 0;
  }
  .banner {
    &.info {
      margin-bottom: 0;
      margin-top: 0;
    }
  }
}
</style>
