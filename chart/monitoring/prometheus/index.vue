<script>
import { mapGetters } from 'vuex';

import Banner from '@/components/Banner';
import Checkbox from '@/components/form/Checkbox';
import KeyValue from '@/components/form/KeyValue';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import StorageClassSelector from '@/chart/monitoring/StorageClassSelector';
import { POD } from '@/config/types';

export default {
  components: {
    Banner,
    Checkbox,
    KeyValue,
    LabeledInput,
    LabeledSelect,
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

    prometheusPods: {
      type:     Array,
      default: () => ([]),
    },

    storageClasses: {
      type:     Array,
      default: () => ([]),
    },

    value: {
      type:     Object,
      default: () => ({}),
    },

    warnUser: {
      type:    Boolean,
      default: false,
    }
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

  computed: {
    ...mapGetters(['currentCluster']),

    podsAndNamespaces() {
      const { prometheusPods } = this;
      const pods = [];

      prometheusPods.forEach((pod) => {
        pods.push({
          label: pod.id,
          link:  {
            name:   'c-cluster-product-resource-namespace-id',
            params: {
              cluster: this.currentCluster.id, product: 'explorer', resource: POD, namespace: pod.metadata.namespace, id: pod.metadata.name
            },
          }
        });
      });

      return pods;
    },
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
    <Banner v-if="warnUser" color="warning">
      <template #default>
        <t k="monitoring.prometheus.warningInstalled" :raw="true" />
        <div v-for="pn in podsAndNamespaces" :key="pn.label" class="mt-10">
          <nuxt-link :to="pn.link" class="btn role-tertiary">
            {{ pn.label }}
          </nuxt-link>
        </div>
      </template>
    </Banner>
    <div class="prometheus-config">
      <div class="row">
        <div class="col span-6 col-full-height">
          <Checkbox v-model="value.prometheus.prometheusSpec.enableAdminAPI" :label="t('monitoring.prometheus.config.adminApi')" />
        </div>
      </div>
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
            v-model="value.prometheus.prometheusSpec.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row row-full-height container-flex-center" style="min-height: 55px;">
        <div class="col span-6">
          <Checkbox v-model="enablePersistantStorage" :label="t('monitoring.prometheus.storage.label')" />
        </div>
        <div v-if="enablePersistantStorage" class="col span-6">
          <LabeledInput
            v-model="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage"
            :label="t('monitoring.prometheus.storage.size')"
            :mode="mode"
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
