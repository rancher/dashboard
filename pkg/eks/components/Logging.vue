<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EKSConfig } from '../types';
import { _EDIT } from '@shell/config/query-params';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';

export default defineComponent({
  name: 'EKSLogging',

  components: { Checkbox },

  props: {
    config: {
      type:     Object as PropType<EKSConfig>,
      required: true
    },

    mode: {
      type:    String,
      default: _EDIT
    },
  },
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="Audit"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="API"
        />
      </div>

      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="Scheduler"
        />
      </div>

      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="Controller Manager"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :mode="mode"
          label="Authenticator"
        />
      </div>
    </div>
  </div>
</template>
