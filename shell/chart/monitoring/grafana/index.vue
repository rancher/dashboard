<script>
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import KeyValue from '@shell/components/form/KeyValue';
import ArrayList from '@shell/components/form/ArrayList';
import StorageClassSelector from '@shell/chart/monitoring/StorageClassSelector';
import { DEFAULT_GRAFANA_STORAGE_SIZE } from '@shell/config/types';

export default {
  components: {
    ArrayList,
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

    pvcs: {
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
    const persistentStorageTypes = ['disabled', 'existing', 'pvc', 'statefulset'];
    const persistentStorageTypeLabels = [
      this.t('generic.disabled'),
      this.t('monitoring.grafana.storage.types.existing'),
      this.t('monitoring.grafana.storage.types.template'),
      this.t('monitoring.grafana.storage.types.statefulset'),
    ];

    if (this.pvcs.length < 1) {
      persistentStorageTypes.splice(1, 1);
      persistentStorageTypeLabels.splice(1, 1);
    }

    const { persistence = {} } = this.value.grafana;
    let persistentStorageType;

    switch (persistence.type) {
    case 'pvc':
      persistentStorageType = 'pvc';
      break;
    case 'statefulset':
      persistentStorageType = 'statefulset';
      break;
    default:
      persistentStorageType = persistence.existingClaim ? 'existing' : 'disabled';
    }

    return {
      persistentStorageTypes,
      persistentStorageTypeLabels,
      persistentStorageType,
    };
  },
  computed: {
    showStorageClasses() {
      const { storageClasses } = this;

      return (storageClasses || []).length >= 1;
    },
    showGrafanaResourceConfig() {
      return this.value?.grafana?.resources?.requests && this.value?.grafana?.resources?.limits;
    }
  },
  watch: {
    persistentStorageType(newType, oldType) {
      let newValsOut;
      let resetValsOut;

      switch (oldType) {
      case 'existing':
        resetValsOut = {
          existingClaim: null,
          subPath:       null,
          type:          null,
        };
        break;
      case 'pvc':
        resetValsOut = {
          accessModes:      null,
          storageClassName: null,
          size:             null,
          subPath:          null,
          annotations:      null,
          finalizers:       null,
        };
        break;
      case 'statefulset':
        resetValsOut = {
          accessModes:      null,
          storageClassName: null,
          size:             null,
          subPath:          null,
        };
        break;
      default:
        break;
      }

      switch (newType) {
      case 'existing':
        newValsOut = {
          existingClaim: null,
          subPath:       null,
          type:          null,
          enabled:       true,
        };
        break;
      case 'pvc':
        newValsOut = {
          accessModes:      null,
          storageClassName: null,
          size:             DEFAULT_GRAFANA_STORAGE_SIZE,
          subPath:          null,
          type:             'pvc',
          annotations:      null,
          finalizers:       null,
          enabled:          true,
        };
        break;
      case 'statefulset':
        newValsOut = {
          accessModes:      null,
          storageClassName: null,
          size:             DEFAULT_GRAFANA_STORAGE_SIZE,
          subPath:          null,
          type:             'statefulset',
          enabled:          true,
        };
        break;
      default:
        delete this.value.grafana['persistence'];
        break;
      }

      this.value.grafana['persistence'] = resetValsOut;
      this.value.grafana['persistence'] = newValsOut;
    },
  }
};
</script>

<template>
  <div>
    <div class="title">
      <h3>{{ t('monitoring.grafana.title') }}</h3>
    </div>
    <div class="grafana-config">
      <!-- Request and Limits -->
      <!-- Note, we use the same labels for resource config as Prometheus since they are generic -->
      <div
        v-if="showGrafanaResourceConfig"
        class="row"
      >
        <div class="col span-12 mt-5">
          <h4 class="mb-0">
            {{ t('monitoring.prometheus.config.resourceLimits') }}
          </h4>
        </div>
      </div>
      <div
        v-if="showGrafanaResourceConfig"
        class="row"
      >
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.requests.cpu"
            data-testid="input-grafana-requests-cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.requests.memory"
            data-testid="input-grafana-requests-memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.limits.cpu"
            data-testid="input-grafana-limits-cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.grafana.resources.limits.memory"
            data-testid="input-grafana-limits-memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :mode="mode"
          />
        </div>
      </div>

      <div class="row pt-10 pb-10">
        <div class="col span-12 persistent-storage-config">
          <RadioGroup
            v-model:value="persistentStorageType"
            name="persistentStorageType"
            :label="t('monitoring.grafana.storage.label')"
            :labels="persistentStorageTypeLabels"
            :mode="mode"
            :options="persistentStorageTypes"
            data-testid="radio-group-input-grafana-storage"
          />
        </div>
      </div>
      <template v-if="persistentStorageType === 'existing'">
        <div class="row">
          <div class="col span-6">
            <StorageClassSelector
              :value="value.grafana.persistence.existingClaim"
              :mode="mode"
              :options="pvcs"
              :label="t('monitoring.grafana.storage.existingClaim')"
              @updateName="(name) => value.grafana.persistence.existingClaim = name"
            />
          </div>
        </div>
      </template>
      <template v-else-if="persistentStorageType === 'pvc'">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.grafana.persistence.size"
              :label="t('monitoring.grafana.storage.size')"
              :mode="mode"
              data-testid="grafana-storage-pvc-size"
            />
          </div>
          <div class="col span-6">
            <div v-if="showStorageClasses">
              <StorageClassSelector
                :value="value.grafana.persistence.storageClassName"
                :mode="mode"
                :options="storageClasses"
                :label="t('monitoring.prometheus.storage.className')"
                @updateName="(name) => value.grafana.persistence.storageClassName = name"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.grafana.persistence.accessModes"
              :label="t('monitoring.grafana.storage.mode')"
              :localized-label="true"
              :mode="mode"
              :multiple="true"
              :options="accessModes"
              :reduce="({id})=> id"
            />
          </div>
        </div>
        <div class="mt-20">
          <div class="row">
            <div class="col span-12">
              <KeyValue
                v-model:value="value.grafana.persistence.annotations"
                :mode="mode"
                :protip="true"
                :read-allowed="false"
                :title="t('monitoring.grafana.storage.annotations')"
              >
                <template #title>
                  <h4>{{ t('monitoring.grafana.storage.annotations') }}</h4>
                </template>
              </KeyValue>
            </div>
          </div>
        </div>
        <div class="row mt-20">
          <div class="col span-12">
            <ArrayList
              v-model:value="value.grafana.persistence.finalizers"
              table-class="fixed"
              :mode="mode"
              :title="t('monitoring.grafana.storage.finalizers')"
            >
              <template #title>
                <h4>{{ t('monitoring.grafana.storage.finalizers') }}</h4>
              </template>
            </ArrayList>
          </div>
        </div>
      </template>
      <template v-else-if="persistentStorageType === 'statefulset'">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.grafana.persistence.size"
              :label="t('monitoring.grafana.storage.size')"
              :mode="mode"
              data-testid="grafana-storage-statefulset-size"
            />
          </div>
          <div class="col span-6">
            <div v-if="showStorageClasses">
              <StorageClassSelector
                :value="value.grafana.persistence.storageClassName"
                :mode="mode"
                :options="storageClasses"
                :label="t('monitoring.prometheus.storage.className')"
                @updateName="(name) => value.grafana.persistence.storageClassName = name"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.grafana.persistence.accessModes"
              :label="t('monitoring.grafana.storage.mode')"
              :localized-label="true"
              :mode="mode"
              :multiple="true"
              :options="accessModes"
              :reduce="({id})=> id"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
.grafana-config {
  & > * {
    margin-top: 10px;
  }
  // .persistent-storage-config {
  //   .radio-group {
  //     &:not(.text-label) {
  //       display: flex;
  //       justify-content: space-between;
  //     }
  //   }
  // }
}
</style>
