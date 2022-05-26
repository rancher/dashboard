import { _EDIT, _VIEW } from '@shell/config/query-params';

/**
 * Sets the width of a DOM element. Adapted from [youmightnotneedjquery.com](https://youmightnotneedjquery.com/#set_width)
 * @param {HTMLElement} el - The target DOM element
 * @param {function | string | number} val - The desired width represented as a Number
 */
function setWidth(el, val) {
  if (typeof val === 'function') {
    val = val();
  }

  if (typeof val === 'string') {
    el.style.width = val;

    return;
  }

  el.style.width = `${ val }px`;
}

/**
 * Gets the width of a DOM element. Adapted from [youmightnotneedjquery.com](https://youmightnotneedjquery.com/#get_width)
 * @param {HTMLElement} el - The target DOM element
 * @returns Number representing the width for the provided element
 */
function getWidth(el) {
  if (!el.length) {
    return;
  }

  return parseFloat(getComputedStyle(el).width.replace('px', ''));
}

export default {
  inheritAttrs: false,

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },

    label: {
      type:     String,
      default: null
    },

    labelKey: {
      type:     String,
      default: null
    },

    placeholderKey: {
      type:     String,
      default: null
    },

    tooltip: {
      type:    [String, Object],
      default: null
    },

    hoverTooltip: {
      type:    Boolean,
      default: true,
    },

    tooltipKey: {
      type:     String,
      default: null
    },

    required: {
      type:    Boolean,
      default: false,
    },

    disabled: {
      type:    Boolean,
      default: false,
    },

    placeholder: {
      type:    [String, Number],
      default: ''
    },

    value: {
      type:    [String, Number, Object],
      default: ''
    },
  },

  data() {
    return {
      raised:  this.mode === _VIEW || !!`${ this.value }`,
      focused: false,
      blurred: null,
    };
  },

  computed: {
    empty() {
      return !!`${ this.value }`;
    },

    isView() {
      return this.mode === _VIEW;
    },

    isDisabled() {
      return this.disabled || this.isView;
    },

    isSearchable() {
      const { searchable } = this;
      const options = ( this.options || [] );

      if (searchable || options.length >= 10) {
        return true;
      }

      return false;
    },
  },

  methods: {
    resizeHandler(e) {
      // since the DD is positioned there is no way to 'inherit' the size of the input, this calcs the size of the parent and set the dd width if it is smaller. If not let it grow with the regular styles
      this.$nextTick(() => {
        const DD = this.$refs.select.querySelectorAll('ul.vs__dropdown-menu');
        const selectWidth = getWidth(this.$refs.select);
        const dropWidth = getWidth(DD);

        if (dropWidth < selectWidth) {
          setWidth(DD, selectWidth);
        }
      });
    },
    onFocus() {
      this.$emit('on-focus');

      return this.onFocusLabeled();
    },

    onFocusLabeled() {
      this.raised = true;
      this.focused = true;
    },

    onBlur() {
      this.$emit('on-blur');

      return this.onBlurLabeled();
    },

    onBlurLabeled() {
      this.focused = false;

      if ( !this.value ) {
        this.raised = false;
      }

      this.blurred = Date.now();
    }
  }
};
