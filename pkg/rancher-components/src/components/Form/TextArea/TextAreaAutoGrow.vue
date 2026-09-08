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

// CSS properties the mirror div must copy from the textarea for its text to
// wrap identically. Anything that affects glyph metrics or wrapping belongs
// here — anything that only affects color or interaction does not.
const MIRROR_STYLE_PROPS = [
  'boxSizing',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'fontFamily', 'fontSize', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
  'lineHeight', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent',
  'tabSize',
] as const;

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
    },

    /**
     * Recalculate the height when the value is changed programmatically (e.g.
     * populated from a file) and when the window is resized, not just on user
     * input. Opt-in to avoid changing the behaviour of existing usages.
     */
    resizeOnValueChangeAndResizeWindow: {
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
      overflow:  'hidden',
      // Non-reactive: this is a DOM node reference. Vue won't wrap it.
      mirror:    null as HTMLDivElement | null,
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
    // Recalculate the height when the value is changed programmatically (e.g.
    // populated from a file), not just on user input. Opt-in via resizeOnValueChangeAndResizeWindow.
    value() {
      if (this.resizeOnValueChangeAndResizeWindow) {
        this.queueResize();
      }
    },

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

    // Width changes alter text wrapping, so the required height can change when
    // the window is resized. Opt-in via resizeOnValueChangeAndResizeWindow.
    if (this.resizeOnValueChangeAndResizeWindow) {
      window.addEventListener('resize', this.queueResize);
    }
  },

  beforeUnmount() {
    if (this.resizeOnValueChangeAndResizeWindow) {
      window.removeEventListener('resize', this.queueResize);
    }

    if (this.mirror) {
      this.mirror.remove();
      this.mirror = null;
    }
  },

  methods: {
    /**
     * Emits the input event and resizes the Text Area.
     *
     * autoSize runs synchronously (not via the debounced queueResize) so the
     * height change lands in the same frame as the keypress. Debouncing here
     * causes the browser to paint an interim frame where content overflows
     * the still-too-short textarea — the caret scrolls into view, then the
     * height catches up 100ms later and the text visibly jumps back down.
     * See #6041.
     */
    onInput(event: Event): void {
      const val = (event?.target as HTMLInputElement)?.value;

      this.$emit('update:value', val);
      this.autoSize();
    },

    /**
     * Gives focus to the Text Area.
     */
    focus(): void {
      (this.$refs?.ta as HTMLElement).focus();
    },

    /**
     * Sets the overflowY and height of the Text Area based on the content
     * entered.
     *
     * The required height is measured against a hidden mirror div rather
     * than by shrinking the textarea to 1px — that shrink+regrow trick
     * flashed the surrounding layout up and back down every time the height
     * changed. The mirror never touches the visible textarea, so autoSize
     * is now visually invisible except for the final height change.
     * See #6041.
     */
    autoSize(): void {
      const el = this.$refs.ta as HTMLTextAreaElement;

      if (!el) {
        return;
      }

      const contentHeight = this.measureContentHeight(el);
      const neu = Math.max(this.minHeight, Math.min(contentHeight, this.maxHeight));
      const overflows = contentHeight > this.maxHeight;

      // Preserve scrollTop in the overflow case so the caret does not jump
      // back to the top when the textarea has hit its cap.
      const previousScrollTop = el.scrollTop;

      el.style.overflowY = overflows ? 'auto' : 'hidden';
      el.style.height = `${ neu }px`;
      if (overflows) {
        el.scrollTop = previousScrollTop;
      }

      this.overflow = overflows ? 'auto' : 'hidden';
      this.curHeight = neu;
    },

    /**
     * Measures the required content height for the given textarea by mirroring
     * its text into an off-screen div sized to match the textarea's rendering.
     * Returns the border-box height needed to display all content without
     * scrolling.
     */
    measureContentHeight(el: HTMLTextAreaElement): number {
      const cs = getComputedStyle(el);

      let mirror = this.mirror;

      if (!mirror) {
        mirror = document.createElement('div');
        mirror.setAttribute('aria-hidden', 'true');
        document.body.appendChild(mirror);
        this.mirror = mirror;
      }

      const style = mirror.style;

      // Position off-screen; visibility:hidden still lays out.
      style.position = 'absolute';
      style.top = '0';
      style.left = '-9999px';
      style.visibility = 'hidden';
      style.pointerEvents = 'none';
      // Textarea wraps like `pre-wrap` and breaks long words.
      style.whiteSpace = 'pre-wrap';
      style.overflowWrap = 'break-word';
      // Match the textarea's width so wrapping is identical.
      style.width = `${ el.clientWidth }px`;
      style.height = 'auto';

      for (const prop of MIRROR_STYLE_PROPS) {
        style[prop] = cs[prop];
      }

      // Textareas need a trailing space so a final newline contributes a
      // measurable line — otherwise the last empty line collapses.
      mirror.textContent = `${ el.value || '' } `;

      const border = (parseInt(cs.borderTopWidth, 10) || 0) +
                     (parseInt(cs.borderBottomWidth, 10) || 0);

      return mirror.scrollHeight + border;
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
