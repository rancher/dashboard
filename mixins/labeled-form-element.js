import { _EDIT, _VIEW } from '@/config/query-params';
import $ from 'jquery';

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

    rules: {
      default:   () => [],
      type:      Array,
      // we only want functions in the rules array
      validator: rules => rules.every(rule => ['function'].includes(typeof rule))
    }
  },

  data() {
    return {
      raised:  this.mode === _VIEW || !!`${ this.value }`,
      focused: false,
      blurred: null,
    };
  },

  computed: {
    requiredField() {
      return (this.required || this.rules.some(rule => rule.name === 'required'));
    },

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

    validationMessage() {
      let ruleMessages = [];
      const value = this.value;

      for (const rule of this.rules) {
        const required = rule.name === 'required' || this.requiredField;
        // "Value" is the default value if the rule can't figure out the appropriate label on it's own. In the case of "required" we can cheat a little...
        const message = rule(required ? value.replace('Value', this.label) : value);

        if (!!message && this.blurred) {
          if (required && !this.focused) {
            ruleMessages = [message];
            break;
          } else if (ruleMessages.length === 0) {
            ruleMessages.push(message);
          }
        }
      }
      if (ruleMessages.length > 0) {
        return ruleMessages.join(', ');
      } else {
        return undefined;
      }
    }
  },

  methods: {
    resizeHandler(e) {
      // since the DD is positioned there is no way to 'inherit' the size of the input, this calcs the size of the parent and set the dd width if it is smaller. If not let it grow with the regular styles
      this.$nextTick(() => {
        const DD = $(this.$refs.select).find('ul.vs__dropdown-menu');
        const selectWidth = $(this.$refs.select).width();
        const dropWidth = DD.width();

        if (dropWidth < selectWidth) {
          DD.width(selectWidth);
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
