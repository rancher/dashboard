<script>
import HookOption from '@shell/components/form/HookOption';
import { _VIEW } from '@shell/config/query-params';
import { isEmpty } from '@shell/utils/object';

export default {
  emits: ['update:value'],

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
    return {
      postStart:   this.value.postStart,
      preStop:     this.value.preStop,
      hookOptions: ['postStart', 'preStop']
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
          delete this.value[prop];
        } else {
          this.value[prop] = val;
        }
      }

      this.$emit('update:value', this.value);
    },
  }
};
</script>

<template>
  <div>
    <div class="mb-20">
      <HookOption
        v-model:value="postStart"
        :mode="mode"
        :label="t('workload.container.lifecycleHook.postStart.label')"
        @update:value="update"
      />
    </div>

    <div>
      <HookOption
        v-model:value="preStop"
        :mode="mode"
        :label="t('workload.container.lifecycleHook.preStop.label')"
        @update:value="update"
      />
    </div>
  </div>
</template>
