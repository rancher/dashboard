<script>
import Vue from 'vue';

import HookOption from '@/components/form/HookOption';
import { _VIEW } from '@/config/query-params';

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
    return {
      showHooks:    [],
      hookOptions:  ['postStart', 'preStop'],
    };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    remove(row) {
      const idx = this.showHooks.indexOf(row);

      this.showHooks.splice(idx, 1);
      delete this.value[row];
      this.update();
    },

    update() {
      for (const prop in this.value) {
        const val = this.value[prop];

        if (val === '' || typeof val === 'undefined' || val === null) {
          Vue.delete(this.value, prop);
        } else {
          Vue.set(this.value, prop, val);
        }
      }

      this.$emit('input', this.value);
    },

    addLifecycleHook(option) {
      const newHook = { [option]: {} };

      if (!this.checkForHook(option)) {
        Object.assign(this.value, newHook);
        this.showHooks.push(option);
      }
    },

    checkForHook(opt) {
      return opt in this.value;
    }
  }
};
</script>

<template>
  <div @input="update">
    <template>
      <div class="mb-20">
        <template v-if="showHooks.includes('postStart')">
          <HookOption :value="value.postStart" :mode="mode" />
        </template>
        <div>
          <template>
            <button
              v-if="!isView"
              v-t="'workload.container.lifecycleHook.postStart.add'"
              type="button"
              class="btn role-tertiary"
              @click.stop="addLifecycleHook('postStart')"
            >
            </button>
            <button
              v-if="!isView && showHooks.includes('postStart')"
              type="button"
              class="btn role-link"
              :disabled="mode==='view'"
              @click.stop="remove('postStart')"
            >
              <t k="generic.remove" />
            </button>
          </template>
        </div>
      </div>

      <div>
        <template v-if="showHooks.includes('preStop')">
          <HookOption v-model="value.preStop" :mode="mode" />
        </template>
        <div>
          <template>
            <button
              v-if="!isView"
              v-t="'workload.container.lifecycleHook.preStop.add'"
              type="button"
              class="btn role-tertiary"
              @click.stop="addLifecycleHook('preStop')"
            >
            </button>
            <button
              v-if="!isView && showHooks.includes('preStop')"
              type="button"
              class="btn role-link"
              :disabled="mode==='view'"
              @click.stop="remove('preStop')"
            >
              <t k="generic.remove" />
            </button>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>
