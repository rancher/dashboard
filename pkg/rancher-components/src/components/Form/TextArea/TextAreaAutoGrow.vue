<script lang="ts">
import Vue from 'vue';
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';

declare module 'vue/types/vue' {
  interface Vue {
    queueResize(): void;
  }
}

export default Vue.extend({
  inheritAttrs: false,

  props: {
    mode: {
      type:    String,
      default: _EDIT
    },

    minHeight: {
      type:    Number,
      default: 25
    },
    maxHeight: {
      type:    Number,
      default: 200
    },
    placeholder: {
      type:    String,
      default: ''
    },
    spellcheck: {
      type:    Boolean,
      default: true
    },

    disabled: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      curHeight: this.minHeight,
      overflow:  'hidden'
    };
  },

  computed: {
    isDisabled(): boolean {
      return this.disabled || this.mode === _VIEW;
    },

    style(): string {
      // This sets the height to one-line for SSR pageload so that it's already right
      // (unless the input is long)
      return `height: ${ this.curHeight }px; overflow: ${ this.overflow };`;
    }
  },

  watch: {
    $attrs: {
      deep: true,
      handler() {
        this.queueResize();
      }
    }
  },

  created() {
    this.queueResize = debounce(this.autoSize, 100);
  },

  mounted() {
    (this.$refs.ta as HTMLElement).style.height = `${ this.curHeight }px`;
    this.$nextTick(() => {
      this.autoSize();
    });
  },

  methods: {
    onInput(val: any[]) {
      this.$emit('input', val);
      this.queueResize();
    },

    focus() {
      (this.$refs?.ta as HTMLElement).focus();
    },

    autoSize() {
      const el = this.$refs.ta as HTMLElement;

      if (!el) {
        return;
      }

      el.style.height = '1px';

      const border = parseInt(getComputedStyle(el).getPropertyValue('borderTopWidth'), 10) || 0 + parseInt(getComputedStyle(el).getPropertyValue('borderBottomWidth'), 10) || 0;
      const neu = Math.max(this.minHeight, Math.min(el.scrollHeight + border, this.maxHeight));

      el.style.overflowY = el.scrollHeight > neu ? 'auto' : 'hidden';
      el.style.height = `${ neu }px`;

      this.curHeight = neu;
    }
  }
});
</script>

<template>
  <textarea
    ref="ta"
    :disabled="isDisabled"
    :style="style"
    :placeholder="placeholder"
    class="no-resize no-ease"
    v-bind="$attrs"
    :spellcheck="spellcheck"
    @paste="$emit('paste', $event)"
    @input="onInput($event.target.value)"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
  />
</template>
