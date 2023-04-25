<script lang="ts">
import Vue from 'vue';
import { AsyncButtonCallback } from './AsyncButton.vue';

export default Vue.extend({
  props: {
    label: {
      type:    String,
      default: undefined,
    },
    labelKey: {
      type:    String,
      default: undefined,
    },
    disabled: {
      type:    Boolean,
      default: false,
    },
    tabIndex: {
      type:    Number,
      default: null,
    },

    /**
     * Inherited global identifier prefix for tests
     * Define a term based on the parent component to avoid conflicts on multiple components
     */
    componentTestid: {
      type:    String,
      default: 'busy-button'
    },
  },

  data(): {busy: boolean} {
    return { busy: false };
  },

  computed: {
    displayLabel(): string {
      if (this.labelKey) {
        const t = this.$store.getters['i18n/t'];

        return t(this.labelKey);
      }

      return this.label;
    }
  },

  methods: {
    clicked($event: MouseEvent) {
      if ($event) {
        $event.stopPropagation();
        $event.preventDefault();
      }

      if ( this.disabled ) {
        return;
      }

      const cb: AsyncButtonCallback = () => {
        this.busy = false;
      };

      this.$set(this, 'busy', true);

      this.$emit('click', cb);
    },

    focus() {
      (this.$refs.btn as HTMLElement).focus();
    }
  }
});
</script>

<template>
  <button
    ref="btn"
    class="btn role-primary"
    :disabled="disabled"
    :tab-index="tabIndex"
    :data-testid="componentTestid + '-async-button'"
    @click="clicked"
  >
    <i
      v-if="busy"
      class="icon icon-lg icon-spinner icon-spin"
    />
    <span
      v-else
      class="icon-spacer"
    />
    <span v-clean-html="displayLabel" />
    <span class="icon-spacer" />
  </button>
</template>
<style lang="scss" scoped>
  .icon-spacer {
    width: 24px;
  }
</style>
