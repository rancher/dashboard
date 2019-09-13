import ChildHook from './child-hook';
import { _CREATE, _EDIT, _VIEW } from '@/utils/query-params';

export default {
  mixins: [ChildHook],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },

    originalValue: {
      type:     Object,
      default: null,
    },

    typeLabel: {
      type:     String,
      required: true,
    }
  },

  data() {
    return {};
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },
    isEdit() {
      return this.mode === _EDIT;
    },
    isView() {
      return this.mode === _VIEW;
    },
  },

  methods: {
    change(value) {
      this.$emit('input', value);
    }
  },
};
