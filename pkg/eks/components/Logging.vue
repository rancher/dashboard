<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { EKSConfig } from '../types';
import { _EDIT } from '@shell/config/query-params';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { removeObject } from '@shell/utils/array';

export default defineComponent({
  name: 'EKSLogging',

  components: { Checkbox },

  props: {
    config: {
      type:     Object as PropType<EKSConfig>,
      required: true
    },

    loggingTypes: {
      type:    Array,
      default: () => []
    },

    mode: {
      type:    String,
      default: _EDIT
    },
  },

  methods: {
    typeEnabled(type: string) {
      return this.loggingTypes.includes(type);
    },

    toggleType(type:string) {
      const out = [...this.loggingTypes];

      if (this.loggingTypes.includes(type)) {
        removeObject(out, type);
      } else {
        out.push(type);
      }

      this.$emit('update:loggingTypes', out);
    }
  },
});
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-3">
        <Checkbox
          :value="typeEnabled('audit')"
          :mode="mode"
          label="Audit"
          @input="toggleType('audit')"
        />
      </div>
      <div class="col span-3">
        <!-- //TODO nb tooltip -->

        <Checkbox
          :value="typeEnabled('api')"
          :mode="mode"

          label="API"
          @input="toggleType('api')"
        />
      </div>

      <div class="col span-3">
        <Checkbox
          :value="typeEnabled('scheduler')"
          :mode="mode"

          label="Scheduler"
          @input="toggleType('scheduler')"
        />
      </div>

      <div class="col span-3">
        <Checkbox
          :value="typeEnabled('controllerManager')"
          :mode="mode"

          label="Controller Manager"
          @input="toggleType('controllerManager')"
        />
      </div>
      <div class="col span-3">
        <Checkbox
          :value="typeEnabled('authenticator')"
          :mode="mode"

          label="Authenticator"
          @input="toggleType('authenticator')"
        />
      </div>
    </div>
  </div>
</template>
