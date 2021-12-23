import impl from './impl';
import { _EDIT, _YAML } from '@/config/query-params';

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

    // The model to be manipulated by the form
    value: {
      type:     Object,
      required: true,
    },

    // A clone of the model before it's been changed, for conflict resolution
    initialValue: {
      type:     Object,
      default: null,
    },

    // The 'live' equivalent of this model in the store
    liveValue: {
      type:     Object,
      default: null,
    },

    doneEvent: {
      type:    Boolean,
      default: false,
    },
  },
};
