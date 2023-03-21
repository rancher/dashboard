import { MACVLAN_STORE } from '../../types';
import getters from './getters';
import mutations from './mutations';
import actions from './actions';

const emptyForm = {
  apiVersion: 'macvlan.cluster.cattle.io/v1',
  kind:       'MacvlanSubnet',
  metadata:   {
    name:      '',
    namespace: 'kube-system',
    labels:    { project: '' },
  },
  spec: {
    master:            '',
    vlan:              0,
    cidr:              '',
    mode:              'bridge',
    gateway:           '',
    ranges:            [],
    routes:            [],
    podDefaultGateway: {
      enable:      false,
      serviceCidr: ''
    }
  }
};

const elementalFactory = () => {
  return {
    state() {
      return {
        macvlanList: [], macvlanIpList: [], macvlan: {}, existedMasterMacvlan: [], emptyForm,
      };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config = { namespace: MACVLAN_STORE };

export default {
  specifics: elementalFactory(),
  config
};
