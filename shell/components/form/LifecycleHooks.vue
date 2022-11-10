<script>
import Vue from 'vue';

import HookOption from '@shell/components/form/HookOption';
import { _VIEW } from '@shell/config/query-params';
import { isEmpty } from '@shell/utils/object';

export default {
  components: { HookOption },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    // container spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
  },

  data() {
    const { postStart, preStop } = this.value;

    return {
      postStart, preStop, hookOptions: ['postStart', 'preStop']
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    update() {
      const out = {
        postStart: this.postStart,
        preStop:   this.preStop
      };

      for (const prop in out) {
        const val = out[prop];

        if (val === '' || typeof val === 'undefined' || val === null || isEmpty(val)) {
          Vue.delete(this.value, prop);
        } else {
          Vue.set(this.value, prop, val);
        }
      }

      this.$emit('input', this.value);
    },
  }
};
</script>

<template>
  <div>
    <div class="mb-20">
      <h3 class="clearfix">
        {{ t('workload.container.lifecycleHook.postStart.label') }}
      </h3>
      <HookOption
        v-model="postStart"
        :mode="mode"
        @input="update"
      />
    </div>

    <div>
      <h3 class="clearfix">
        {{ t('workload.container.lifecycleHook.preStop.label') }}
      </h3>
      <HookOption
        v-model="preStop"
        :mode="mode"
        @input="update"
      />
    </div>
  </div>
</template>
