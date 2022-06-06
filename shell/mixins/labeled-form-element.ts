import Vue from 'vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { getWidth, setWidth } from '@shell/utils/width';

interface LabeledFormElement {
  raised: boolean;
  focused: boolean;
  blurred: number | null;
}

export default Vue.extend({
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

    options: {
      default:   null,
      type:      Array
    },

    searchable: {
      default: false,
      type:    Boolean
    },
  },

  data(): LabeledFormElement {
    return {
      raised:  this.mode === _VIEW || !!`${ this.value }`,
      focused: false,
      blurred: null,
    };
  },

  computed: {
    empty(): boolean {
      return !!`${ this.value }`;
    },

    isView(): boolean {
      return this.mode === _VIEW;
    },

    isDisabled(): boolean {
      return this.disabled || this.isView;
    },

    isSearchable(): boolean {
      const { searchable } = this;
      const options = ( this.options || [] );

      if (searchable || options.length >= 10) {
        return true;
      }

      return false;
    },
  },

  methods: {
    resizeHandler() {
      // since the DD is positioned there is no way to 'inherit' the size of the input, this calcs the size of the parent and set the dd width if it is smaller. If not let it grow with the regular styles
      this.$nextTick(() => {
        const DD = (this.$refs.select as HTMLElement).querySelectorAll('ul.vs__dropdown-menu');
        const selectWidth = getWidth(this.$refs.select as Element) || 0;
        const dropWidth = getWidth(DD) || 0;

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
});
