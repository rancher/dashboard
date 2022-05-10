<script>
import isEmpty from 'lodash/isEmpty';

import Checkbox from '@shell/components/form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import RadioGroup from '@shell/components/form/RadioGroup';

const DEFAULT_MONITORING_NAMESPACE = 'cattle-monitoring-system';

export default {
  components: {
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
      default: () => [],
    },

    value: {
      type:    Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      useExistingLabels: [
        this.t('monitoring.alerting.secrets.new'),
        this.t('monitoring.alerting.secrets.existing'),
      ],
      useExistingOptions: [false, true],
    };
  },

  computed: {
    allSecrets() {
      const { secrets } = this;

      return secrets
        .filter(
          sec => sec.metadata.namespace === DEFAULT_MONITORING_NAMESPACE
        )
        .map(sec => ({ label: sec.metadata.name, value: sec.metadata.name }));
    },

    canUseExistingSecret() {
      const { filteredSecrets } = this;

      return (
        filteredSecrets.length > 0 &&
        !this.value.alertmanager.alertmanagerSpec.useExistingSecret
      );
    },

    existingSecret() {
      return this.secrets.find(
        sec => sec?.metadata?.name ===
            'alertmanager-rancher-monitoring-alertmanager' &&
          sec?.metadata?.namespace === DEFAULT_MONITORING_NAMESPACE
      );
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
        this.$set(
          this.value.alertmanager.alertmanagerSpec,
          'useExistingSecret',
          false
        );
      }

      const { existingSecret } = this;

      if (existingSecret) {
        this.$nextTick(() => {
          this.$set(
            this.value.alertmanager.alertmanagerSpec,
            'useExistingSecret',
            true
          );
          this.$set(
            this.value.alertmanager.alertmanagerSpec,
            'configSecret',
            existingSecret.metadata.name
          );
        });
      }
    },
    'value.alertmanager.alertmanagerSpec.useExistingSecret'(useExistingSecret) {
      const { existingSecret } = this;

      if (useExistingSecret) {
        if (existingSecret?.metadata?.name) {
          this.$set(
            this.value.alertmanager.alertmanagerSpec,
            'configSecret',
            existingSecret.metadata.name
          );
        }
      } else {
        this.$set(this.value.alertmanager.alertmanagerSpec, 'configSecret', '');
      }
    },
  },

  beforeMount() {
    const amSecrets = this.value?.alertmanager?.alertmanagerSpec?.secrets ?? [];

    if (this.existingSecret && amSecrets.length <= 0) {
      this.$set(this.value.alertmanager.alertmanagerSpec, 'useExistingSecret', true);
    }
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
          <Checkbox
            v-model="value.alertmanager.enabled"
            :label="t('monitoring.alerting.enable.label')"
          />
        </div>
      </div>
      <template v-if="value.alertmanager.enabled">
        <div class="row">
          <div class="col span-6">
            <RadioGroup
              v-model="value.alertmanager.alertmanagerSpec.useExistingSecret"
              name="useExistingSecret"
              :disabled="forceCreateNewSecret"
              label-key="monitoring.alerting.secrets.radio.label"
              :tooltip="t('monitoring.alerting.secrets.info', {}, raw=true)"
              :mode="mode"
              :labels="useExistingLabels"
              :options="useExistingOptions"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-if="value.alertmanager.alertmanagerSpec.useExistingSecret"
              v-model="value.alertmanager.alertmanagerSpec.configSecret"
              class="provider"
              :label="t('monitoring.alerting.secrets.label')"
              :options="filteredSecrets"
            />
          </div>
        </div>
        <div v-if="allSecrets.length > 0" class="row">
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
