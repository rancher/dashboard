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

    // primary pool cannot be deleted and mode cannot be selected
    isPrimaryPool: {
      type:    Boolean,
      default: false
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
        console.log('vm size touched');
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
    <div v-if="pool._validSize===false">
      size invalid!
    </div>
    <div class="remove-row row">
      <button
        v-if="!isPrimaryPool"
        type="button"
        class="btn role-link"
        @click="$emit('remove')"
      >
        remove pool
      </button>
    </div>
    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model="pool.name"
          :mode="mode"
          label="Name"
          required
          :disabled="!pool._isNew"
        />
      </div>
      <div class="col span-4">
        <LabeledSelect
          v-model="pool.availabilityZones"
          :options="availabilityZoneOptions"
          label="availability zones"
          :mode="mode"
          :multiple="true"
          :taggable="true"
          :disabled="!pool._isNew"
        />
      </div>
      <div class="col span-2">
        <RadioGroup
          v-model="pool.mode"
          :mode="mode"
          :options="modeOptions"
          :name="`${pool._id}-mode`"
          :disabled="!pool._isNew"
        >
          <template #label>
            <span class="text-label">mode</span>
          </template>
        </RadioGroup>
      </div>
    </div>

    <div class="row">
      <div class="col span-3">
        <LabeledSelect
          v-model="pool.vmSize"
          :options="vmSizeOptions"
          label="VM Size"
          :loading="loadingVmSizes"
          :mode="mode"
          :disabled="!pool._isNew"
          :rules="[()=>pool._validSize === false ? 'This size is not avaiable in the selected region' : undefined]"
        />
      </div>
      <div class="col span-3">
        <!-- //todo nb when is this ever editable...? -->
        <LabeledSelect
          v-model="pool.osType"
          :options="[]"
          label="operating system"
          mode="view"
        />
      </div>
      <div class="col span-3">
        <LabeledSelect
          v-model="pool.osDiskType"
          :options="osDiskTypeOptions"
          label="os disk type"
          :mode="mode"
          :disabled="!pool._isNew"
        />
      </div>
      <div class="col span-3">
        <UnitInput
          v-model="pool.osDiskSizeGB"
          label="os disk size"
          :mode="mode"
          suffix="GB"
          :disabled="!pool._isNew"
          type="number"
        />
      </div>
    </div>

    <div class="row">
      <div class="col span-4">
        <LabeledInput
          v-model.number="pool.count"
          type="number"
          :mode="mode"
          label="node count"
          :disabled="pool.enableAutoScaling"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model.number="pool.maxPods"
          type="number"
          :mode="isPrimaryPool ? 'view' : mode"
          label="max pods per node"
        />
      </div>
      <div class="col span-4">
        <LabeledInput
          v-model="pool.maxSurge"
          :mode="mode"
          label="max surge"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-2">
        <Checkbox
          v-model="pool.enableAutoScaling"
          :mode="mode"
          label="enable auto scaling"
        />
      </div>
      <template v-if="pool.enableAutoScaling">
        <div class="col span-4">
          <LabeledInput
            v-model.number="pool.minCount"
            type="number"
            :mode="mode"
            label="minimum pods"
          />
        </div>
        <div class="col span-4">
          <LabeledInput
            v-model.number="pool.maxCount"
            type="number"
            :mode="mode"
            label="maximum pods"
          />
        </div>
      </template>
    </div>

    <div>
      <div>taints</div>
      <!-- //todo nb less hacky way of styling labels -->
      <div
        v-if="taints.length"
        class="row taints-labels"
      >
        <label class="text-label">
          key
        </label>
        <label class="text-label">
          value
        </label>
        <label class="text-label">
          effect
        </label>
        <div>
          <!-- <button
            type="button"
            class="btn role-link btn-sm"
            :style="{visibility: 'hidden'}"
          >
            remove
          </button> -->
        </div>
      </div>
      <Taint
        v-for="(keyedTaint, i) in taints"
        :key="keyedTaint._id"
        :taint="keyedTaint.taint"
        :mode="mode"
        @input="e=>updateTaint({_id:keyedTaint._id, taint: e}, i)"
        @remove="removeTaint(i)"
      />
      <button
        type="button"
        class="btn role-tertiary"
        @click="addTaint"
      >
        add taint
      </button>
    </div>
    <div>
      <div>labels</div>
      <KeyValue
        v-model="pool.labels"
        :mode="mode"
        :value-can-be-empty="true"
        add-label="add label"
        :read-allowed="false"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// .pool {
//   border: 1px solid var(--link-border);
//   padding: 20px;
// }

.remove-row {
  display: flex;
  justify-content: flex-end;
}

.taints-labels{
  display: flex;
  justify-content: space-between;

  &>label {
    flex-grow: 1;
    margin-right: 10px
  }
}
</style>
