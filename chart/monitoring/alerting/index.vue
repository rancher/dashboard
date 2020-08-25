<script>
import isEmpty from 'lodash/isEmpty';
import once from 'lodash/once';
import jsyaml from 'js-yaml';

import ArrayList from '@/components/form/ArrayList';
import Banner from '@/components/Banner';
import CruSecret from '@/chart/monitoring/alerting/CruSecret.vue';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';

import { exceptionToErrorsArray } from '@/utils/error';
import { SECRET } from '@/config/types';

const DEFAULT_MONITORING_NAMESPACE = 'cattle-monitoring-system';

export default {
  components: {
    ArrayList,
    Banner,
    CruSecret,
    LabeledSelect,
    RadioGroup,
  },

  props: {
    mode: {
      type:    String,
      default: 'create',
    },

    newAlertManagerSecret: {
      type:    Object,
      default: () => ({}),
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
    return {
      alertmanagerConfigYaml: '',
      initNewDefaultSecret:   once(this.initSecret),
      useExistingSecret:      true,
    };
  },

  computed: {
    canUseExistingSecret() {
      const { filteredSecrets } = this;

      return filteredSecrets.length > 0;
    },

    forceCreateNewSecret() {
      const { filteredSecrets } = this;

      return isEmpty(filteredSecrets);
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

    showNewSecretEditor() {
      const { useExistingSecret, newAlertManagerSecret } = this;

      if (!useExistingSecret && !isEmpty(newAlertManagerSecret) ) {
        return true;
      }

      return false;
    },
  },

  watch: {
    filteredSecrets(newValue, oldValue) {
      if (isEmpty(newValue)) {
        this.useExistingSecret = false;
      }
    },

    useExistingSecret(useExistingSecret) {
      if (!useExistingSecret && isEmpty(this.newAlertManagerSecret)) {
        this.initNewDefaultSecret();
      }
    },

    forceCreateNewSecret(force) {
      if (force && isEmpty(this.newAlertManagerSecret)) {
        this.initNewDefaultSecret();
      }
    },
  },

  methods: {
    initSecret() {
      this.$emit('init-secret');
    },

    alertManagerYamlUpdated(str) {
      try {
        const parsed = jsyaml.safeLoad(str);

        this.alertmanagerConfigYaml = parsed;
      } catch (err) {
        console.error( 'Unable to parse Alert Manager config', exceptionToErrorsArray(err)); // eslint-disable-line no-console
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
          <RadioGroup
            v-model="value.alertmanager.enabled"
            :label="t('monitoring.alerting.enable.label')"
            :labels="[t('generic.enabled'), t('generic.disabled')]"
            :mode="mode"
            :options="[true, false]"
          />
        </div>
      </div>
      <div class="row mb-0 pb-0">
        <div class="col span-12">
          <Banner color="warning">
            <template #default>
              <t k="monitoring.alerting.secrets.warn" :raw="true" />
            </template>
          </Banner>
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <RadioGroup
            v-model="useExistingSecret"
            :disabled="forceCreateNewSecret"
            :label="t('monitoring.alerting.existing.label')"
            :labels="[t('monitoring.alerting.secrets.existing'), t('monitoring.alerting.secrets.new')]"
            :mode="mode"
            :options="[true, false]"
          >
            <template #corner>
              <i
                v-tooltip="t('monitoring.alerting.secrets.info', {}, true)"
                class="icon icon-info"
                style="font-size: 12px"
              />
            </template>
          </RadioGroup>
        </div>
        <div v-if="useExistingSecret" class="col span-6">
          <LabeledSelect
            v-if="canUseExistingSecret"
            v-model="value.alertmanager.alertmanagerSpec.configSecret"
            class="provider"
            :label="t('monitoring.alerting.secrets.label')"
            :options="filteredSecrets"
          />
        </div>
      </div>
      <div v-if="showNewSecretEditor" class="row">
        <div class="col span-12">
          <CruSecret
            v-model="newAlertManagerSecret"
            :mode="mode"
            @set-secret-values="$emit('set-secret-valeus', $event)"
            @secret-yaml-update="($event, row) => $emit('secret-yaml-update', $event, row)"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <ArrayList
            v-model="value.alertmanager.alertmanagerSpec.secrets"
            table-class="fixed"
            :mode="mode"
            :pad-left="false"
            :title="t('monitoring.alerting.secrets.additional')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.alerting-config {
  > .row {
    padding: 10px 0;
  }
}
</style>
