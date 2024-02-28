<script lang="ts">
import { _EDIT } from '@shell/config/query-params';
import { EKSConfig } from '../types';
import { PropType, defineComponent } from 'vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import ArrayList from '@shell/components/form/ArrayList.vue';

export default defineComponent({
  name: 'EKSNetworking',

  components: {
    LabeledSelect,
    ArrayList,
    Checkbox,
    LabeledInput
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },

    publicAccess: {
      type:    Boolean,
      default: false
    },
    privateAccess: {
      type:    Boolean,
      default: false
    },
    publicAccessSources: {
      type:    Array,
      default: () => []

    }
  }
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <!-- //TODO nb validate that at least one is enabled -->
        <Checkbox
          :value="publicAccess"
          :mode="mode"
          label="Public Access"
          @input="$emit('update:publicAccess', $event)"
        />
        <Checkbox
          :value="privateAccess"
          :mode="mode"
          label="Private Access"
          @input="$emit('update:privateAccess', $event)"
        />
      </div>
      <div class="col span-6">
        <!-- //TODO nb vpcs -->
        <!-- //TODO nb input event for selects -->
        <LabeledSelect
          :mode="mode"
          label="VPC and Subnet"
          :options="[]"
        />
      </div>
    </div>
    <div class="row mb-10">
      <!-- //TODO nb verify disable state on edit -->
      <div class="col span-6">
        <ArrayList
          :value="publicAccessSources"
          :mode="mode"
          :disabled="!publicAccess"
          :add-allowed="publicAccess"
          add-label="add endpoint"
          @input="$emit('update:publicAccessSources', $event)"
        />
      </div>
    </div>
  </div>
</template>
