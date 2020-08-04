<script>
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import RadioGroup from '@/components/form/RadioGroup';
import KeyValue from '@/components/form/KeyValue';
import StorageClassSelector from '@/chart/monitoring/StorageClassSelector';

export default {
  components: {
    KeyValue,
    LabeledInput,
    LabeledSelect,
    RadioGroup,
    StorageClassSelector,
  },
  props: {
    accessModes: {
      type:     Array,
      required: true,
    },

    mode: {
      type:    String,
      default: 'create',
    },

    storageClasses: {
      type:    Array,
      default: () => {
        return [];
      },
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },
  },

  data() {
    return {
      volumeModes: [
        {
          id:    'Filesystem',
          label: 'monitoring.volume.modes.file',
        },
        {
          id:    'Block',
          label: 'monitoring.volume.modes.block',
        },
      ],
      enablePersistantStorage: false,
    };
  },

  watch: {
    enablePersistantStorage(enabled) {
      if (!!enabled) {
        this.$set(
          this.value.prometheus.prometheusSpec.storageSpec,
          'volumeClaimTemplate',
          { spec: { resources: { requests: { storage: '50Gi' } } } }
        );
      } else {
        this.$delete(
          this.value.prometheus.prometheusSpec.storageSpec,
          'volumeClaimTemplate'
        );
      }
    },
  },
};
</script>

<template>
  <div>
    <div class="title">
      <h3>{{ t('monitoring.prometheus.title') }}</h3>
    </div>
    <div class="prometheus-config">
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.scrapeInterval"
            :label="t('monitoring.prometheus.config.scrape')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.evaluationInterval"
            :label="t('monitoring.prometheus.config.evaluation')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.retention"
            :label="t('monitoring.prometheus.config.retention')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.retentionSize"
            :label="t('monitoring.prometheus.config.retentionSize')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row pt-10 pb-10">
        <div class="col span-6">
          <RadioGroup
            v-model="value.prometheus.prometheusSpec.enableAdminAPI"
            :label="t('monitoring.prometheus.config.adminApi')"
            :labels="[t('generic.disabled'), t('generic.enabled')]"
            :mode="mode"
            :options="[false, true]"
          />
        </div>
        <div class="col span-6">
          <RadioGroup
            v-model="enablePersistantStorage"
            :label="t('monitoring.prometheus.storage.label')"
            :labels="[t('generic.disabled'), t('generic.enabled')]"
            :mode="mode"
            :options="[false, true]"
          />
        </div>
      </div>
      <template v-if="enablePersistantStorage">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes"
              :label="t('monitoring.prometheus.storage.mode')"
              :localized-label="true"
              :mode="mode"
              :options="accessModes"
              :reduce="({id})=> id"
            />
          </div>
          <div class="col span-6">
            <StorageClassSelector
              :mode="mode"
              :options="storageClasses"
              :value="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName"
              :label="t('monitoring.prometheus.storage.className')"
              @updateName="(name) => $set(value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec, 'storageClassName', name)"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.volumeMode"
              :label="t('monitoring.prometheus.storage.volumeMode')"
              :localized-label="true"
              :mode="mode"
              :options="volumeModes"
              :reduce="({id})=> id"
            />
          </div>
          <div class="col span-6">
            <LabeledInput
              v-model="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.volumeName"
              :label="t('monitoring.prometheus.storage.volumeName')"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage"
              :label="t('monitoring.prometheus.storage.size')"
              :mode="mode"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <div class="mb-5 mt-5">
              <label class="text-label mb-10">{{ t('monitoring.prometheus.storage.selector') }}</label>
            </div>
            <KeyValue
              v-model="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.selector"
              :mode="mode"
              :pad-left="false"
              :protip="false"
              :read-allowed="false"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.prometheus-config {
  & > * {
    margin-top: 10px;
  }
}
</style>
