<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';

export default {
  components: { Checkbox, LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  computed: {
    ...mapGetters(['currentCluster']),
    provider() {
      return (this.currentCluster.status.provider || '').split('.')[0];
    }
  },

  created() {
    const provider = this.provider;

    if ( !this.value._setSources ) {
      // Save a note so that form -> yaml -> form doesn't reset these
      Object.defineProperty(this.value, '_setSources', { enumerable: false, value: true });

      this.value['additionalLoggingSources'] = this.value.additionalLoggingSources || {};
      this.value.additionalLoggingSources[provider] = this.value.additionalLoggingSources[provider] || {};
      this.value.additionalLoggingSources[provider]['enabled'] = true;
      this.value['global'] = this.value.global || {};
    }
  },
};
</script>

<template>
  <div class="logging">
    <div
      v-if="provider === 'k3s'"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.additionalLoggingSources.k3s.container_engine"
          :label="t('logging.install.k3sContainerEngine')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.global.dockerRootDirectory"
          :label="t('logging.install.dockerRootDirectory')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.systemdLogPath"
          :placeholder="t('logging.install.default')"
          :label="t('logging.install.systemdLogPath')"
          :tooltip="t('logging.install.tooltip', {}, true)"
        />
        <p
          v-clean-html="t('logging.install.url', {}, true)"
          class="mt-6"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <Checkbox
          v-model:value="value.additionalLoggingSources[provider].enabled"
          :label="t('logging.install.enableAdditionalLoggingSources')"
        />
      </div>
    </div>
  </div>
</template>
