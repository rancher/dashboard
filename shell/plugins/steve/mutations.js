import { forgetType, resetStore, loadAll } from '@shell/plugins/dashboard-store/mutations';
import { keyForSubscribe } from '@shell/plugins/steve/subscribe';
import { perfLoadAll } from '@shell/plugins/steve/performanceTesting';

export default {
  loadAll(state, { type, data, ctx }) {
    // Performance testing in dev and when env var is set
    if (process.env.dev && process.env.perfTest) {
      data = perfLoadAll(type, data);
    }

    return loadAll(state, {
      type, data, ctx
    });
  },

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
