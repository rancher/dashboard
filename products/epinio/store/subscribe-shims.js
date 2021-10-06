export const actions = {
  watch({ state, dispatch, getters }, { type, revision }) {
    console.warn('Epinio: Watch: ', type, revision);// eslint-disable-line no-console
  }
};
