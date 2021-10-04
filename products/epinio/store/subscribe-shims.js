import { rcWarn } from '@/utils/rc-logs';

export const actions = {
  watch({ state, dispatch, getters }, { type, revision }) {
    rcWarn('Epinio: Watch: ', type, revision);
  }
};
