<script lang="ts">
import { defineComponent, inject, PropType } from 'vue';
import { debounce } from 'lodash';
import { _EDIT, _VIEW } from '@shell/config/query-params';

interface NonReactiveProps {
  queueResize(): void;
}

const provideProps: NonReactiveProps = {
  queueResize() {
    // noop
  }
};

export default defineComponent({
  inheritAttrs: false,

  props: {
    value: {
      type:     String,
      required: true
    },

    class: {
      type:    [String, Array, Object] as PropType<string | unknown[] | Record<string, boolean>>,
      default: ''
    },

    /**
     * Sets the edit mode for Text Area.
     * @values _EDIT, _VIEW
     */
    mode: {
      type:    String,
      default: _EDIT
    },

    /**
     * Sets the Minimum height for Text Area. Prevents the height from becoming
     * smaller than the value specified in minHeight.
     */
    minHeight: {
      type:    Number,
      default: 25
    },

    /**
     * Sets the maximum height for Text Area. Prevents the height from becoming
     * larger than the value specified in maxHeight.
     */
    maxHeight: {
      type:    Number,
      default: 200
    },

    /**
     * Text that appears in the Text Area when it has no value set.
     */
    placeholder: {
      type:    String,
      default: ''
    },

    /**
     * Specifies whether Text Area is subject to spell checking by the
     * underlying browser/OS.
     */
    spellcheck: {
      type:    Boolean,
      default: true
    },

    /**
     * Disables the Text Area.
     */
    disabled: {
      type:    Boolean,
      default: false
    }
  },

  emits: ['update:value', 'paste', 'focus', 'blur'],

  setup() {
    const queueResize = inject('queueResize', provideProps.queueResize);

    return { queueResize };
  },

  data() {
    return {
      curHeight: this.minHeight,
      overflow:  'hidden'
    };
  },

  computed: {
    /**
     * Determines if the Text Area should be disabled.
     */
    isDisabled(): boolean {
      return this.disabled || this.mode === _VIEW;
    },

    /**
     * Sets the height to one-line for SSR pageload so that it's already right
     * (unless the input is long)
     */
    style(): string {
      return `height: ${ this.curHeight }px; overflow: ${ this.overflow };`;
    },

    className(): string | unknown[] | Record<string, boolean> {
      return this.class;
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
    /**
     * Emits the input event and resizes the Text Area.
    */
    onInput(event: Event): void {
      const val = (event?.target as HTMLInputElement)?.value;

      this.$emit('update:value', val);
      this.queueResize();
    },

    /**
     * Gives focus to the Text Area.
     */
    focus(): void {
      (this.$refs?.ta as HTMLElement).focus();
    },

    /**
     * Sets the overflowY and height of the Text Area based on the content
     * entered (calculated via scroll height).
     */
    autoSize(): void {
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
    :value="value"
    :data-testid="$attrs['data-testid'] ? $attrs['data-testid'] : 'text-area-auto-grow'"
    :disabled="isDisabled"
    :style="style"
    :placeholder="placeholder"
    :class="className"
    class="no-resize no-ease"
    v-bind="$attrs"
    :spellcheck="spellcheck"
    @paste="$emit('paste', $event)"
    @input="onInput($event)"
    @focus="$emit('focus', $event)"
    @blur="$emit('blur', $event)"
  />
</template>
