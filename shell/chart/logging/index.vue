<script>
import { mapGetters } from 'vuex';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import ChartPsp from '@shell/components/ChartPsp';

export default {
  components: {
    Checkbox, LabeledInput, ChartPsp, LabeledSelect
  },
  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    }
  },

  data() {
    return {
      clusterType:  this.value?.loggingOverlay ? 'tke' : '',
      clusterTypes: [{
        label: this.t('logging.install.clusterType.default'),
        value: '',
      }, {
        label: this.t('logging.install.clusterType.tke'),
        value: 'tke'
      }]
    };
  },

  watch: {
    clusterType(neu) {
      if (neu === 'tke') {
        const loggingOverlay = {
          spec: {
            fluentbit: {
              extraVolumeMounts: [
                {
                  destination: '/var/lib/containerd',
                  readOnly:    true,
                  source:      '/var/lib/containerd'
                }
              ]
            }
          }
        };

        this.$set(this.value, 'loggingOverlay', loggingOverlay);
      } else {
        this.value.loggingOverlay && (delete this.value.loggingOverlay);
      }
    },
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

      this.$set(this.value, 'additionalLoggingSources', this.value.additionalLoggingSources || {});
      this.$set(this.value.additionalLoggingSources, provider, this.value.additionalLoggingSources[provider] || {});
      this.$set(this.value.additionalLoggingSources[provider], 'enabled', true);
      this.$set(this.value, 'global', this.value.global || {});
    }

    if (provider === 'tke') {
      this.$set(this, 'clusterType', provider === 'tke' ? 'tke' : '');
    }
  },
};
</script>

<template>
  <div class="logging">
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledSelect
          v-model="clusterType"
          :label="t('logging.install.clusterType.label')"
          data-testid="input-logging-cluster-type"
          :placeholder="t('logging.install.clusterType.placeholder')"
          :localized-label="true"
          :options="clusterTypes"
        />
      </div>
    </div>
    <div
      v-if="provider === 'k3s'"
      class="row mb-20"
    >
      <div class="col span-6">
        <LabeledInput
          v-model="value.additionalLoggingSources.k3s.container_engine"
          :label="t('logging.install.k3sContainerEngine')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.global.dockerRootDirectory"
          :label="t('logging.install.dockerRootDirectory')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabeledInput
          v-model="value.systemdLogPath"
          :placeholder="t('logging.install.default')"
          :label="t('logging.install.systemdLogPath')"
          :tooltip="t('logging.install.tooltip', {}, true)"
        />
        <p
          class="mt-6"
          v-html="t('logging.install.url', {}, true)"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <Checkbox
          v-model="value.additionalLoggingSources[provider].enabled"
          :label="t('logging.install.enableAdditionalLoggingSources')"
        />
      </div>
    </div>
    <div class="row mb-20">
      <div class="col span-6">
        <ChartPsp :value="value" />
      </div>
    </div>
  </div>
</template>
