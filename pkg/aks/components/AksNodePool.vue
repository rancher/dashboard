<script lang="ts">
import Vue from 'vue';

import { _CREATE } from '@shell/config/query-params';

import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';

export default Vue.extend({
  name: 'AKSNodePool',

  components: { LabeledInput, LabeledSelect },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    // TODO nb aks node pool type
    pool: {
      type:     Object,
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

    canRemove: {
      type:    Boolean,
      default: true
    }
  }
});
</script>

<template>
  <div class="pool">
    <div class="remove-row row">
      <button
        v-if="canRemove"
        type="button"
        class="btn role-secondary"
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
        />
      </div>
    </div>
    <div class="row">
      <LabeledSelect
        v-model="pool.vmSize"
        :options="vmSizeOptions"
        label="VM Size"
        :loading="loadingVmSizes"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pool {
  border: 1px solid var(--link-border);
  padding: 20px;
}

.remove-row {
  display: flex;
  justify-content: flex-end;
}
</style>
