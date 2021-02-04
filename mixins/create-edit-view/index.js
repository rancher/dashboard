import { _EDIT, _YAML } from '@/config/query-params';
import impl from './impl';

export default {
  ...impl,

  props: {
    mode: {
      type:     String,
      default: _EDIT,
    },

    realMode: {
      type:     String,
      default: _EDIT,
    },

    as: {
      type:     String,
      default: _YAML,
    },

    value: {
      type:     Object,
      required: true,
    },

    originalValue: {
      type:     Object,
      default: null,
    },
  },
};
