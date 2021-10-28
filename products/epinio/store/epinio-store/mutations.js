export default {
  reset(state) {
    for ( const type of Object.keys(state.types) ) {
      this.commit(`${ state.config.namespace }/forgetType`, type);
    }
  },

};
