<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapGetters } from 'vuex';

import { _CREATE, _VIEW } from '@shell/config/query-params';
import type { AKSDiskType, AKSNodePool, AKSPoolMode } from '../types/index';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Taint from '@pkg/aks/components/Taint.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';
import Banner from '@components/Banner/Banner.vue';

import { randomStr } from '@shell/utils/string';

export default defineComponent({
  name: 'AKSNodePool',

  emits: ['vmSizeSet', 'update:value', 'validationChanged'],

  components: {
    LabeledInput,
    LabeledSelect,
    Taint,
    UnitInput,
    RadioGroup,
    Checkbox,
    KeyValue,
    Banner
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    pool: {
      type:     Object as PropType<AKSNodePool>,
      required: true
    },

    vmSizeOptions: {
      type:    Array,
      default: () => []
    },

    // vm sizes are fetched in the parent component to avoid repeating the request for every node pool
    loadingVmSizes: {
      type:    Boolean,
      default: false
    },

    canUseAvailabilityZones: {
      type:    Boolean,
      default: true
    },

    validationRules: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    clusterVersion: {
      type:    String,
      default: ''
    },

    originalClusterVersion: {
      type:    String,
      default: ''
    }
  },

  data() {
    return {
      taints: (this.pool.nodeTaints || []).map((taint: String) => {
        return { taint, _id: randomStr() };
      }),
      osDiskTypeOptions:       ['Managed', 'Ephemeral'] as AKSDiskType[],
      modeOptions:             ['User', 'System'] as AKSPoolMode[],
      availabilityZoneOptions: [{ label: 'zone 1', value: '1' }, { label: 'zone 2', value: '2' }, { label: 'zone 3', value: '3' }],

      originalOrchestratorVersion: this.pool.orchestratorVersion
    };
  },

  watch: {
    'pool.enableAutoScaling'(neu) {
      if (!neu) {
        delete this.pool.minCount;
        delete this.pool.maxCount;
      } else {
        this.pool['minCount'] = 1;
        this.pool['maxCount'] = 3;
      }
    },

    'pool.vmSize'(neu) {
      if (neu) {
        this.$emit('vmSizeSet');
      }
    },

    validAZ(neu) {
      this.pool['_validAZ'] = neu;
      this.$emit('update:value');
    }
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    validAZ(): Boolean {
      return !this.pool.availabilityZones || !this.pool.availabilityZones.length || this.canUseAvailabilityZones;
    },

    isView() {
      return this.mode === _VIEW;
    },

    clusterWillUpgrade() {
      return this.originalClusterVersion !== this.clusterVersion;
    },

    // offer a k8s version upgrade if the node pool is not on the same version as the cluster and the cluster is not currently being upgraded
    upgradeAvailable(): boolean {
      if (this.mode === _CREATE || this.pool._isNewOrUnprovisioned) {
        return false;
      }

      return this.clusterVersion !== this.originalOrchestratorVersion && !!this.originalOrchestratorVersion;
    },

    willUpgrade: {
      get() {
        return this.upgradeAvailable && this.pool.orchestratorVersion === this.clusterVersion;
      },
      set(neu: boolean) {
        if (neu) {
          this.pool['orchestratorVersion'] = this.clusterVersion;
        } else {
          this.pool['orchestratorVersion'] = this.originalOrchestratorVersion;
        }
      }
    },

    upgradeLabel(): string {
      return this.t('aks.nodePools.orchestratorVersion.upgrade', { from: this.originalOrchestratorVersion, to: this.clusterVersion });
    },
  },

  methods: {
    addTaint(): void {
      this.taints.push({ taint: '', _id: randomStr() });
      this.pool['nodeTaints'] = this.taints.map((keyedTaint: any) => keyedTaint.taint);
      this.$emit('update:value');
    },

    updateTaint(keyedTaint: any, idx: any): void {
      this.taints[idx] = keyedTaint;
      this.pool['nodeTaints'] = this.taints.map((keyedTaint: any) => keyedTaint.taint);
      this.$emit('update:value');
    },

    removeTaint(idx: number): void {
      const neu = [...this.taints];

      neu.splice(idx, 1).map((keyedTaint) => keyedTaint.taint);

      this['taints'] = neu;
      this.pool['nodeTaints'] = neu.map((taint) => taint.taint);
    },

    availabilityZonesSupport() {
      return this.validAZ ? undefined : this.t('aks.errors.availabilityZones');
    },

    poolCountValidator() {
      const canBeZero: boolean = this.pool.mode === 'User';

      return (val: number) => this.validationRules?.count?.[0](val, canBeZero);
    }
  },
});
</script>

<template>
  <div
    class="pool"
  >
    <div class="row mb-10">
      <div
        v-if="upgradeAvailable && !clusterWillUpgrade"
        class="col span-6"
      >
        <Checkbox
          v-model:value="willUpgrade"
          :mode="mode"
          :label="upgradeLabel"
          data-testid="aks-pool-upgrade-checkbox"
        />
      </div>
      <div
        v-else
        class="col span-3"
      >
        <LabeledInput
          v-model:value="pool.orchestratorVersion"
          :mode="mode"
          label-key="aks.nodePools.orchestratorVersion.label"
          disabled
          data-testid="aks-pool-version-display"
        />
      </div>

      <div
        v-if="clusterWillUpgrade && upgradeAvailable"
        class="col span-6"
      >
        <Banner
          class="mt-0"
          color="info"
          label-key="aks.nodePools.orchestratorVersion.warning"
          data-testid="aks-pool-upgrade-banner"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledInput
          v-model:value="pool.name"
          :mode="mode"
          label-key="generic.name"
          required
          :disabled="!pool._isNewOrUnprovisioned"
          :rules="validationRules.name"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model:value="pool.vmSize"
          :options="vmSizeOptions"
          label-key="aks.nodePools.vmSize.label"
          :loading="loadingVmSizes"
          :mode="mode"
          :disabled="!pool._isNewOrUnprovisioned"
          :rules="[()=>pool._validation && pool._validation._validSize === false ? t('aks.errors.vmSizes.available') : undefined]"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model:value="pool.availabilityZones"
          :options="availabilityZoneOptions"
          label-key="aks.nodePools.availabilityZones.label"
          :mode="mode"
          :multiple="true"
          :taggable="true"
          :disabled="!pool._isNewOrUnprovisioned || (!canUseAvailabilityZones && !(pool.availabilityZones && pool.availabilityZones.length))"
          :require-dirty="false"
          :rules="validationRules.az"
        />
      </div>
      <div class="col span-2">
        <RadioGroup
          v-model:value="pool.mode"
          :mode="mode"
          :options="modeOptions"
          :name="`${pool._id}-mode`"
          :row="true"
          label-key="generic.mode"
          @update:value="$emit('validationChanged')"
        >
          <template #label>
            <span class="text-label">{{ t('aks.nodePools.mode.label') }}</span>
          </template>
        </RadioGroup>
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-3">
        <LabeledSelect
          v-model:value="pool.osDiskType"
          :options="osDiskTypeOptions"
          label-key="aks.nodePools.osDiskType.label"
          :mode="mode"
          :disabled="!pool._isNewOrUnprovisioned"
        />
      </div>
      <div class="col span-3">
        <UnitInput
          v-model:value="pool.osDiskSizeGB"
          label-key="aks.nodePools.osDiskSize.label"
          :mode="mode"
          suffix="GB"
          :disabled="!pool._isNewOrUnprovisioned"
          type="number"
        />
      </div>
    </div>

    <div
      :style="{'display': 'flex', 'align-items':'center'}"
      class="row mb-10"
    >
      <div class="col span-3">
        <LabeledInput
          v-model:value.number="pool.count"
          type="number"
          :mode="mode"
          label-key="aks.nodePools.count.label"
          :rules="[poolCountValidator()]"
          :min="pool.mode === 'User' ? 0 : 1"
          :max="1000"
          data-testid="aks-pool-count-input"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value.number="pool.maxPods"
          type="number"
          :mode="mode"
          label-key="aks.nodePools.maxPods.label"
          :disabled="!pool._isNewOrUnprovisioned"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model:value="pool.maxSurge"
          :mode="mode"
          label-key="aks.nodePools.maxSurge.label"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          v-model:value="pool.enableAutoScaling"
          :mode="mode"
          label-key="aks.nodePools.enableAutoScaling.label"
        />
      </div>
      <template v-if="pool.enableAutoScaling">
        <div class="col span-3">
          <LabeledInput
            v-model:value.number="pool.minCount"
            type="number"
            :mode="mode"
            label-key="aks.nodePools.minCount.label"
            :rules="validationRules.min"
            :min="0"
            :max="1000"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            v-model:value.number="pool.maxCount"
            type="number"
            :mode="mode"
            label-key="aks.nodePools.maxCount.label"
            :rules="validationRules.max"
            :min="0"
            :max="1000"
          />
        </div>
      </template>
    </div>
    <Banner
      v-if="pool._validation && pool._validation._validMinMax === false"
      color="error"
      label-key="aks.errors.poolMinMax"
    />
    <div class="row mb-10">
      <div class="col span-12">
        <div class="text-label">
          {{ t('aks.nodePools.taints.label') }}
          <i
            v-clean-tooltip="t('aks.nodePools.taints.tooltip')"
            class="icon icon-info"
          />
        </div>
        <table
          v-if="(taints && taints.length) || isView"
          class="taints"
        >
          <thead>
            <tr>
              <th>
                <label class="text-label">
                  {{ t('aks.nodePools.taints.key') }}
                  <span class="text-error">*</span>
                </label>
              </th>
              <th>
                <label class="text-label">
                  {{ t('aks.nodePools.taints.value') }}
                  <span class="text-error">*</span>
                </label>
              </th>
              <th>
                <label class="text-label">
                  {{ t('aks.nodePools.taints.effect') }}
                </label>
              </th>
              <th />
            </tr>
          </thead>
          <template v-if="taints && taints.length">
            <Taint
              v-for="(keyedTaint, i) in taints"
              :key="i"
              :taint="keyedTaint.taint"
              :mode="mode"
              :rules="validationRules.taints"
              :data-testid="`aks-pool-taint-${i}`"
              @update:value="e=>updateTaint({_id:keyedTaint._id, taint: e}, i)"
              @remove="removeTaint(i)"
            />
          </template>
          <template v-else>
            <tr>
              <td :style="{'width': '40%'}">
                <div class="text-muted">
                  &mdash;
                </div>
              </td>
              <td :style="{'width': '40%'}">
                <div class="text-muted">
                  &mdash;
                </div>
              </td>

              <td :style="{'width': '15%'}">
                <div class="text-muted">
                  &mdash;
                </div>
              </td>
            </tr>
          </template>
        </table>
        <button
          v-if="!isView"
          type="button"
          class="btn role-tertiary mt-20"
          @click="addTaint"
        >
          {{ t('aks.nodePools.taints.addTaint') }}
        </button>
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <div class="text-label">
          {{ t('labels.labels.title') }}
          <i
            v-clean-tooltip="t('aks.nodePools.labels.tooltip')"
            class="icon icon-info"
          />
        </div>
        <KeyValue
          v-model:value="pool.nodeLabels"
          :mode="mode"
          :value-can-be-empty="true"
          :add-label="t('aks.nodePools.labels.add')"
          :read-allowed="false"
          data-testid="aks-node-labels-input"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.remove-row {
  display: flex;
  justify-content: flex-end;
}
.taints {
  width: 100%;
  th,:deep() td{
    text-align: left;
    padding-right: 10px;
    font-weight: inherit;
  }
  th>* {
    margin: 0px;
  }
}
</style>
