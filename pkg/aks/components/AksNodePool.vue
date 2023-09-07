<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { _CREATE } from '@shell/config/query-params';
import type { AKSDiskType, AKSNodePool, AKSPoolMode } from '../types/index';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Taint from '@pkg/aks/components/Taint.vue';
import UnitInput from '@shell/components/form/UnitInput.vue';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import KeyValue from '@shell/components/form/KeyValue.vue';

import { randomStr } from '@shell/utils/string';

export default defineComponent({
  name: 'AKSNodePool',

  components: {
    LabeledInput,
    LabeledSelect,
    Taint,
    UnitInput,
    RadioGroup,
    Checkbox,
    KeyValue
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

  },

  data() {
    return {
      taints: (this.pool.nodeTaints || []).map((taint: String) => {
        return { taint, _id: randomStr() };
      }),
      osDiskTypeOptions:       ['Managed', 'Ephemeral'] as AKSDiskType[],
      modeOptions:             ['User', 'System'] as AKSPoolMode[],
      availabilityZoneOptions: [{ label: 'zone 1', value: '1' }, { label: 'zone 2', value: '2' }, { label: 'zone 3', value: '3' }],
    };
  },

  watch: {
    'pool.enableAutoScaling'(neu) {
      if (!neu) {
        delete this.pool.minCount;
        delete this.pool.maxCount;
      }
    },
    'pool.vmSize'(neu) {
      if (neu) {
        this.$emit('vmSizeSet');
      }
    }
  },

  methods: {
    addTaint() {
      this.taints.push({ taint: '', _id: randomStr() });
      this.$set(this.pool, 'nodeTaints', this.taints.map((keyedTaint: any) => keyedTaint.taint));
      this.$emit('input');
    },

    updateTaint(keyedTaint: any, idx: any) {
      this.taints[idx] = keyedTaint;
      this.$set(this.pool, 'nodeTaints', this.taints.map((keyedTaint: any) => keyedTaint.taint));
      this.$emit('input');
    },

    removeTaint(idx: number) {
      this.taints.splice(idx, 1);
    }
  },
});
</script>

<template>
  <div class="pool">
    <div class="row mb-10">
      <div class="col span-3">
        <LabeledInput
          v-model="pool.name"
          :mode="mode"
          label-key="generic.name"
          required
          :disabled="!pool._isNewOrUnprovisioned"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model="pool.vmSize"
          :options="vmSizeOptions"
          label-key="aks.nodePools.vmSize.label"
          :loading="loadingVmSizes"
          :mode="mode"
          :disabled="!pool._isNewOrUnprovisioned"
          :rules="[()=>pool._validSize === false ? 'This size is not avaiable in the selected region' : undefined]"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model="pool.availabilityZones"
          :options="availabilityZoneOptions"
          label-key="aks.nodePools.availabilityZones.label"
          :mode="mode"
          :multiple="true"
          :taggable="true"
          :disabled="!pool._isNewOrUnprovisioned"
        />
      </div>
      <div class="col span-2">
        <RadioGroup
          v-model="pool.mode"
          :mode="mode"
          :options="modeOptions"
          :name="`${pool._id}-mode`"
          :disabled="!pool._isNewOrUnprovisioned"
          :row="true"
          label-key="generic.mode"
          @input="$emit('validationChanged')"
        >
          <template #label>
            <span class="text-label">Mode</span>
          </template>
        </RadioGroup>
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-3">
        <LabeledSelect
          v-model="pool.osType"
          :options="[]"
          label-key="aks.nodePools.osType.label"
          mode="view"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model="pool.osDiskType"
          :options="osDiskTypeOptions"
          label-key="aks.nodePools.osDiskType.label"
          :mode="mode"
          :disabled="!pool._isNewOrUnprovisioned"
        />
      </div>
      <div class="col span-3">
        <UnitInput
          v-model="pool.osDiskSizeGB"
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
          v-model.number="pool.count"
          type="number"
          :mode="mode"
          label-key="aks.nodePools.count.label"
          :disabled="pool.enableAutoScaling"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model.number="pool.maxPods"
          type="number"
          :mode="mode"
          label-key="aks.nodePools.maxPods.label"
        />
      </div>
      <div class="col span-3">
        <LabeledInput
          v-model="pool.maxSurge"
          :mode="mode"
          label-key="aks.nodePools.maxSurge.label"
        />
      </div>
      <div class="col span-2">
        <Checkbox
          v-model="pool.enableAutoScaling"
          :mode="mode"
          label-key="aks.nodePools.enableAutoScaling.label"
        />
      </div>
    </div>
    <div class="row mb-10">
      <template v-if="pool.enableAutoScaling">
        <div class="col span-3">
          <LabeledInput
            v-model.number="pool.minCount"
            type="number"
            :mode="mode"
            label-key="aks.nodePools.minCount.label"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
            v-model.number="pool.maxCount"
            type="number"
            :mode="mode"
            label-key="aks.nodePools.maxCount.label"
          />
        </div>
      </template>
    </div>
    <div class="row mb-10">
      <div class="col span-12">
        <div class="text-label">
          {{ t('aks.nodePools.taints.label') }}
        </div>
        <table
          v-if="taints && taints.length"
          class="taints"
        >
          <tr>
            <th>
              <label class="text-label">
                {{ t('aks.nodePools.taints.key') }}
              </label>
            </th>
            <th>
              <label class="text-label">
                {{ t('aks.nodePools.taints.value') }}
              </label>
            </th>
            <th>
              <label class="text-label">
                {{ t('aks.nodePools.taints.effect') }}
              </label>
            </th>
            <th />
          </tr>
          <Taint
            v-for="(keyedTaint, i) in taints"
            :key="keyedTaint._id"
            :taint="keyedTaint.taint"
            :mode="mode"
            @input="e=>updateTaint({_id:keyedTaint._id, taint: e}, i)"
            @remove="removeTaint(i)"
          />
        </table>
        <button
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
        </div>
        <KeyValue
          v-model="pool.labels"
          :mode="mode"
          :value-can-be-empty="true"
          add-label-key="Add Label"
          :read-allowed="false"
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
  th,::v-deep td{
    text-align: left;
    padding-right: 10px;
    font-weight: inherit;
  }
  th>* {
    margin: 0px;
  }
}
</style>
