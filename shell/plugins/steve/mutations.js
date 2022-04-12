import { forgetType, resetStore } from '@shell/plugins/core-store/mutations';
import { keyForSubscribe } from '@shell/plugins/steve/subscribe';

export default {
  forgetType(state, type) {
    if ( forgetType(state, type) ) {
      delete state.inError[keyForSubscribe({ type })];
    }
  },

  reset(state) {
    resetStore(state, this.commit);
    this.commit(`${ state.config.namespace }/resetSubscriptions`);
  }
};
