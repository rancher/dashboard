<script>
import { mapGetters } from 'vuex';

import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import MatchExpressions from '@shell/components/form/MatchExpressions';
import StorageClassSelector from '@shell/chart/monitoring/StorageClassSelector';
import { RadioGroup } from '@components/Form/Radio';

import { set } from '@shell/utils/object';
import { simplify, convert } from '@shell/utils/selector';
import { POD } from '@shell/config/types';

export default {
  components: {
    Banner,
    Checkbox,
    LabeledInput,
    LabeledSelect,
    MatchExpressions,
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

    prometheusPods: {
      type:    Array,
      default: () => ([]),
    },

    storageClasses: {
      type:    Array,
      default: () => ([]),
    },

    value: {
      type:    Object,
      default: () => ({}),
    },

    filteredWorkloads: {
      type:    Array,
      default: () => ([]),
    },
  },

  data() {
    return { enablePersistentStorage: !!this.value?.prometheus?.prometheusSpec?.storageSpec?.volumeClaimTemplate?.spec };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    matchExpressions: {
      get() {
        const selector = this.value?.prometheus?.prometheusSpec?.storageSpec?.volumeClaimTemplate?.spec?.selector;
        let matchExpressions;

        if (selector && selector?.matchExpressions) {
          matchExpressions = convert((selector?.matchLabels || {}), selector?.matchExpressions);

          return matchExpressions;
        } else {
          return [];
        }
      }
    },

    mappedFilteredWorkloads() {
      return this.filteredWorkloads.map((wl) => ({
        label: wl.id,
        link:  {
          name:   'c-cluster-product-resource-namespace-id',
          params: {
            cluster:   this.currentCluster.id,
            product:   'explorer',
            resource:  wl.type,
            namespace: wl.metadata.namespace,
            id:        wl.metadata.name
          },
        }
      }));
    },

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

    showStorageClasses() {
      const { storageClasses } = this;

      return (storageClasses || []).length >= 1;
    },
  },

  watch: {
    enablePersistentStorage(enabled) {
      if (!!enabled) {
        this.value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate = {
          spec: {
            accessModes: ['ReadWriteOnce'],
            resources:   { requests: { storage: '50Gi' } },
          }
        };
      } else {
        delete this.value.prometheus.prometheusSpec.storageSpec['volumeClaimTemplate'];
      }
    },
  },

  methods: {
    set,

    matchChanged(expressions) {
      const { matchLabels, matchExpressions } = simplify(expressions);
      const storageSpec = this.value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec;

      if (!storageSpec?.selector) {
        storageSpec['selector'] = { matchExpressions: [], matchLabels: {} };
      }

      storageSpec.selector['matchLabels'] = matchLabels;
      storageSpec.selector['matchExpressions'] = matchExpressions;

      // Remove an empty selector object if present
      // User can add a selector and then remove the selector - this will leave an empty structure as above
      // We want to ensure we remove .selector.matchExpressions, .selector.matchLabels, and .selector if empty
      // See: https://github.com/rancher/dashboard/issues/10016

      if (storageSpec.selector.matchExpressions?.length === 0) {
        delete storageSpec.selector.matchExpressions;
      }

      if (storageSpec.selector.matchLabels && Object.keys(storageSpec.selector.matchLabels).length === 0) {
        delete storageSpec.selector.matchLabels;
      }

      if (Object.keys(storageSpec.selector).length === 0) {
        delete storageSpec.selector;
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
    <!-- https://github.com/rancher/dashboard/issues/1167 -->
    <Banner
      v-if="mappedFilteredWorkloads.length"
      color="warning"
    >
      <template #default>
        <t
          k="monitoring.prometheus.warningInstalled"
          :raw="true"
        />
        <div
          v-for="(wl, i) in mappedFilteredWorkloads"
          :key="i"
          class="mt-10"
        >
          <router-link
            :to="wl.link"
            class="btn role-tertiary"
          >
            {{ wl.label }}
          </router-link>
        </div>
      </template>
    </Banner>
    <div class="prometheus-config">
      <div class="row">
        <div class="col span-6 col-full-height">
          <Checkbox
            v-model:value="value.prometheus.prometheusSpec.enableAdminAPI"
            :label="t('monitoring.prometheus.config.adminApi')"
          />
        </div>
        <div class="col span-6 col-full-height">
          <RadioGroup
            v-model:value="value.prometheus.prometheusSpec.ignoreNamespaceSelectors"
            :mode="mode"
            name="ignoreNamespaceSelectors"
            label-key="monitoring.prometheus.config.ignoreNamespaceSelectors.label"
            :tooltip="t('monitoring.prometheus.config.ignoreNamespaceSelectors.help', {}, true)"
            :labels="[t('monitoring.prometheus.config.ignoreNamespaceSelectors.radio.enforced'),t('monitoring.prometheus.config.ignoreNamespaceSelectors.radio.ignored')]"
            :options="[false, true]"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.scrapeInterval"
            :label="t('monitoring.prometheus.config.scrape')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.evaluationInterval"
            :label="t('monitoring.prometheus.config.evaluation')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.retention"
            :label="t('monitoring.prometheus.config.retention')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.retentionSize"
            :label="t('monitoring.prometheus.config.retentionSize')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-12 mt-5">
          <h4 class="mb-0">
            {{ t('monitoring.prometheus.config.resourceLimits') }}
          </h4>
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.requests.cpu"
            :label="t('monitoring.prometheus.config.requests.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.requests.memory"
            :label="t('monitoring.prometheus.config.requests.memory')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.limits.cpu"
            :label="t('monitoring.prometheus.config.limits.cpu')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.prometheus.prometheusSpec.resources.limits.memory"
            :label="t('monitoring.prometheus.config.limits.memory')"
            :mode="mode"
          />
        </div>
      </div>
      <div
        class="row row-full-height container-flex-center"
        style="min-height: 55px;"
      >
        <div class="col span-6">
          <Checkbox
            v-model:value="enablePersistentStorage"
            data-testid="checkbox-chart-enable-persistent-storage"
            :label="t('monitoring.prometheus.storage.label')"
          />
        </div>
      </div>
      <template v-if="enablePersistentStorage">
        <div class="row">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage"
              :label="t('monitoring.prometheus.storage.size')"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <div
              v-if="showStorageClasses"
              data-testid="select-chart-prometheus-storage-class"
            >
              <StorageClassSelector
                :mode="mode"
                :options="storageClasses"
                :value="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName"
                :label="t('monitoring.prometheus.storage.className')"
                @updateName="(name) => value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName = name"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.accessModes"
              :label="t('monitoring.prometheus.storage.mode')"
              :localized-label="true"
              :mode="mode"
              :multiple="true"
              :options="accessModes"
              :reduce="({id})=> id"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <div class="mb-5 mt-5">
              <h4 class=" mb-10">
                {{ t('monitoring.prometheus.storage.selector') }}
              </h4>
            </div>
            <Banner
              color="warning"
              :label="t('monitoring.prometheus.storage.selectorWarning', {}, true)"
            />
            <MatchExpressions
              :initial-empty-row="false"
              :mode="mode"
              :value="matchExpressions"
              :show-remove="false"
              @update:value="matchChanged($event)"
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
