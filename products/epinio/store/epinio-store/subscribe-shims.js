import PollerSequential from '@/utils/poller-sequential';

const polling = {};
const POLL_INTERVAL = 10000;

export const actions = {
  unsubscribe() {
    Object.entries(polling).forEach(([type, poll]) => {
      console.warn('Epinio: Polling stopped for: ', type); // eslint-disable-line no-console
      poll.stop();
      delete polling[type];
    });
  },

  watch({ dispatch, rootGetters }, { type }) {
    if (rootGetters['type-map/isSpoofed'](type) || polling[type]) {
      // Ignore spoofed
      return;
    }

    console.warn('Epinio: Polling started for: ', type);// eslint-disable-line no-console

    polling[type] = new PollerSequential(
      async() => {
        console.debug('Epinio: Polling: ', type); // eslint-disable-line no-console
        await dispatch('findAll', { type, opt: { force: true } });
      },
      POLL_INTERVAL,
      5
    );
    polling[type].start();
  }
};
