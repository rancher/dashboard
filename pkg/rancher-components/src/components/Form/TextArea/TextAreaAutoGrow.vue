<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@shell/config/query-params';

export default {
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
    isDisabled() {
      return this.disabled || this.mode === _VIEW;
    },

    style() {
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
    this.$refs.ta.style.height = `${ this.curHeight }px`;
    this.$nextTick(() => {
      this.autoSize();
    });
  },

  methods: {
    onInput(val) {
      this.$emit('input', val);
      this.queueResize();
    },

    focus() {
      this.$refs.ta.focus();
    },

    autoSize() {
      const el = this.$refs.ta;

      if (!el) {
        return;
      }

      el.style.height = '1px';

      const border = parseInt(getComputedStyle(el)['borderTopWidth'], 10) || 0 + parseInt(getComputedStyle(el)['borderBottomWidth'], 10) || 0;
      const neu = Math.max(this.minHeight, Math.min(el.scrollHeight + border, this.maxHeight));

      el.style.overflowY = el.scrollHeight > neu ? 'auto' : 'hidden';
      el.style.height = `${ neu }px`;

      this.curHeight = neu;
    }
  }
};
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

<style lang='scss' scoped>
</style>
