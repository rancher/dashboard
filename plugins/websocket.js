import Vue from 'vue';
import VueNativeSock from 'vue-native-websocket';

export default ({ store }) => {
  const url = window.location.origin.replace(/^http(s)?:/, 'ws$1:');
  const baseUrl = '/v1';
  const namespace = 'cluster';

  Vue.use(VueNativeSock, `${ url }${ baseUrl }/subscribe`, {
    store,
    connectManually:   !store.getters['auth/loggedIn'],
    reconnection:      true,
    reconnectionDelay: 3000,
    mutations:         {
      SOCKET_ONOPEN:          'ws.open',
      SOCKET_ONCLOSE:         'ws.close',
      SOCKET_ONERROR:         'ws.error',
      SOCKET_ONMESSAGE:       'ws.message',
      SOCKET_RECONNECT:       'ws.reconnect',
      SOCKET_RECONNECT_ERROR: 'ws.reconnect-error',
    },

    passToStoreHandler(eventName, event) {
      if ( !eventName.startsWith('SOCKET_') ) {
        return;
      }

      const method = 'dispatch';
      let action = `ws.${ eventName.replace(/^SOCKET_(on)?/i, '').toLowerCase() }`;
      let msg = event;

      if (action === 'ws.message' && event.data) {
        msg = JSON.parse(event.data);
        if (msg.name) {
          action = `ws.${ msg.name }`;
        }
      }

      const fullAction = [namespace, action].filter(x => !!x).join('/');

      this.store[method](fullAction, msg);
    }
  });
};
