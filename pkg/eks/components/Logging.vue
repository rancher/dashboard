<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapGetters } from 'vuex';
import { EKSConfig } from '../types';
import { _EDIT } from '@shell/config/query-params';

import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import { removeObject } from '@shell/utils/array';

export default defineComponent({
  name: 'EKSLogging',

  emits: ['update:loggingTypes'],

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

  computed: { ...mapGetters({ t: 'i18n/t' }) },

  methods: {
    typeEnabled(type: string) {
      return (this.loggingTypes || []).includes(type);
    },

    toggleType(type:string) {
      const out = [...(this.loggingTypes || [])];

      if (out.includes(type)) {
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
    <div
      :style="{'justify-content':'space-between'}"
      class="row mb-10"
    >
      <div class="col span-2">
        <Checkbox
          :value="typeEnabled('audit')"
          :mode="mode"
          label-key="eks.audit.label"
          :tooltip="t('eks.audit.tooltip')"
          @update:value="toggleType('audit')"
        />
      </div>
      <div class="col span-2">
        <Checkbox
          :value="typeEnabled('api')"
          :mode="mode"
          label-key="eks.api.label"
          :tooltip="t('eks.api.tooltip')"
          @update:value="toggleType('api')"
        />
      </div>

      <div class="col span-2">
        <Checkbox
          :value="typeEnabled('scheduler')"
          :mode="mode"
          label-key="eks.scheduler.label"
          :tooltip="t('eks.scheduler.tooltip')"
          @update:value="toggleType('scheduler')"
        />
      </div>

      <div class="col span-2">
        <Checkbox
          :value="typeEnabled('controllerManager')"
          :mode="mode"
          label-key="eks.controllerManager.label"
          :tooltip="t('eks.controllerManager.tooltip')"
          @update:value="toggleType('controllerManager')"
        />
      </div>
      <div class="col span-2">
        <Checkbox
          :value="typeEnabled('authenticator')"
          :mode="mode"
          label-key="eks.authenticator.label"
          :tooltip="t('eks.authenticator.tooltip')"
          @update:value="toggleType('authenticator')"
        />
      </div>
    </div>
  </div>
</template>
