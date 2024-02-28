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
    config: {
      type:     Object as PropType<EKSConfig>,
      required: true
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
          :mode="mode"
          label="Public Access"
        />
        <Checkbox
          :mode="mode"
          label="Private Access"
        />
      </div>
      <div class="col span-6">
        <!-- //TODO nb vpcs -->
        <LabeledSelect
          :mode="mode"
          label="VPC and Subnet"
          :options="[]"
        />
      </div>
    </div>
    <div class="row mb-10">
      <!-- //TODO nb disable if !publicAccess -->
      <div class="col span-6">
        <ArrayList
          :mode="mode"
          add-label="add endpoint"
        />
      </div>
    </div>
  </div>
</template>
