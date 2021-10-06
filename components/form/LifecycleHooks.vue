<script>
import Vue from 'vue';

import HookOption from '@/components/form/HookOption';
import { _VIEW } from '@/config/query-params';
import { isEmpty } from '@/utils/object';

export default {
  components: { HookOption },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    // container.lifecycle spec
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    podTemplateSpec: {
      type:     Object,
      required: true
    }
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
      <HookOption v-model="postStart" type="postStart" :mode="mode" @input="update" />
    </div>

    <div>
      <h3 class="clearfix">
        {{ t('workload.container.lifecycleHook.preStop.label') }}
      </h3>
      <HookOption
        v-model="preStop"
        type="preStop"
        :mode="mode"
        :grace-period="podTemplateSpec.terminationGracePeriodSeconds"
        @input="update"
        @update:grace-period="podTemplateSpec.terminationGracePeriodSeconds = $event"
      />
    </div>
  </div>
</template>
