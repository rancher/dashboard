import { _VIEW } from '@/config/query-params';

export default {
  inheritAttrs: false,

  props: {
    mode: {
      type:    String,
      default: 'edit',
    },

    label: {
      type:     String,
      default: null
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
      type:    [String, Number, Object],
      default: ''
    },

    i18nLabel: {
      type:    String,
      default: null
    }
  },

  data() {
    return {
      raised:  this.mode === _VIEW || !!`${ this.value }`,
      focused: false,
    };
  },

  computed: {
    empty() {
      return !!`${ this.value }`;
    },

    isView() {
      return this.mode === _VIEW;
    },

    notView() {
      return (this.mode !== _VIEW);
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
