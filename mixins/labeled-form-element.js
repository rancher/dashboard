export default {
  inheritAttrs: false,

  props: {
    type: {
      type:    String,
      default: 'text',
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
      type:    String,
      default: ''
    }
  },

  data() {
    return {
      raised:  this.value,
      focused: false
    };
  },

  computed: {
    empty() {
      return !!this.value;
    }
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
