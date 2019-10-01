import { base64Decode, base64Encode } from '@/utils/crypto/index';

export const state = () => {
  return {
    socket:     {},
    containers: [],
    container:  {},
    resource:   null,
    mode:       null,
    backlog:    [],
    toSend:     [],
  };
};

export const actions = {
  closeSocket({ commit, state }) {
    return new Promise((resolve) => {
      if (state.socket) {
        state.socket.close();
        commit('clearBacklog');
        commit('socketOpened', { socket: {} });
      }
      resolve();
    });
  },
  defineSocket({ dispatch, state }, payload) {
    const resource = payload.resource ? payload.resource : state.resource;
    const action = payload.action ? payload.action : state.mode;
    const containers = resource.spec.containers.filter((container) => {
      return container.name !== 'istio';
    });
    const currentContainer = payload.container ? payload.container : containers[0];
    const showLast = payload.showLast ? payload.showLast : false;
    let protocol = null;
    let url = null;

    switch (action) {
    case 'openShell':
      protocol = 'base64.channel.k8s.io';
      url = `${ window.location.origin.replace('https', 'wss') }/api/v1/namespaces/${ resource.metadata.namespace }/pods/${ resource.metadata.name }/exec?container=${ currentContainer.name }&stdout=1&stdin=1&stderr=1&tty=1&command=sh`;
      break;
    case 'openLogs':
      protocol = 'base64.binary.k8s.io';
      url = `${ window.location.origin.replace('https', 'wss') }/api/v1/namespaces/${ resource.metadata.namespace }/pods/${ resource.metadata.name }/log?container=${ currentContainer.name }&tailLines=500&follow=true&timestamps=true&previous=${ showLast }`;
      break;
    default:
      protocol = 'base64.channel.k8s.io';
      url = `${ window.location.origin.replace('https', 'wss') }/api/v1/namespaces/${ resource.metadata.namespace }/pods/${ resource.metadata.name }/exec?container=${ currentContainer.name }`;
    }
    console.log('socket url: ', url);
    dispatch('openSocket', {
      url,
      resource,
      containers,
      container: currentContainer,
      mode:      action,
      protocol,
      showLast
    });
  },
  openSocket({ commit, state }, payload) {
    commit('socketOpened', { ...payload });
    const socket = new WebSocket(payload.url, payload.protocol);

    socket.onmessage = (e) => {
      decodeMsg(socket.protocol, e.data).then((message) => {
        commit('addBacklog', { log: message });
      })
        .catch(err => console.error(err));
    };
    socket.onopen = () => {
      state.toSend.forEach(msg => socket.send(msg));
      commit('socketOpened', { socket, ...payload });
    };
    socket.onclose = (msg) => {
      console.log('socket closed: ', msg);
    };
  },
};

export const mutations = {
  closeModal(state) {
    state.mode = null;
  },
  socketOpened(state, payload) {
    for (const prop in payload) {
      state[prop] = payload[prop];
    }
  },
  addBacklog(state, payload) {
    state.backlog.push(payload.log);
  },
  clearBacklog(state) {
    state.backlog = [];
  },
  sendInput(state, payload) {
    if (state.socket.readyState === 1) {
      state.socket.send(0 + base64Encode(payload.input));
    } else {
      state.toSend.push(0 + base64Encode(payload.input));
    }
  }
};

const decodeMsg = (protocol, msg) => {
  return new Promise((resolve, reject) => {
    if (protocol === 'base64.binary.k8s.io') {
      resolve(base64Decode(msg));
    } else {
      const type = msg[0];
      const message = base64Decode(msg.slice(1));

      if (type === '2') {
        reject(message);
      }
      resolve(message);
    }
  });
};
