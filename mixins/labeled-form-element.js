import { _VIEW } from '@/config/query-params';

export default {
  inheritAttrs: false,
  inject:       { disableInputs: { default: false } },

  props: {
    mode: {
      type:    String,
      default: 'edit',
    },

    label: {
      type:     String,
      required: true,
    },

    required: {
      type:    Boolean,
      default: false,
    },

    placeholder: {
      type:    String,
      default: ''
    },

    value: {
      type:    [String, Number],
      default: ''
    }
  },

  data() {
    return {
      raised:  this.mode === _VIEW || !!`${ this.value }` || this.disableInputs,
      focused: false
    };
  },

  computed: {
    empty() {
      return !!`${ this.value }`;
    },

    isView() {
      return this.mode === _VIEW || this.disableInputs;
    },

    notView() {
      return (this.mode !== _VIEW && !this.disableInputs);
    },
  },

  methods: {
    onFocus() {
      return this.onFocusLabeled();
    },

    onFocusLabeled() {
      this.raised = true;
      this.focused = true;
    },

    onBlur() {
      return this.onBlurLabeled();
    },

    onBlurLabeled() {
      this.focused = false;

      if ( !this.value ) {
        this.raised = false;
      }
    }
  }
};
