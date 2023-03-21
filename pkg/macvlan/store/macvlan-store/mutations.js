import { removeObject } from '@shell/utils/array';

export default {
  setMacvlanList(state, val) {
    state.macvlanList = val;
  },
  addMacvlanList(state, val) {
    state.macvlanList = state.macvlanList.concat(val);
  },
  setExistedMasterMacvlan(state, val) {
    state.existedMasterMacvlan = val;
  },
  setMacvlanIpList(state, val) {
    state.macvlanIpList = val;
  },
  addMacvlanIpList(state, val) {
    state.macvlanIpList = state.macvlanIpList.concat(val);
  },
  setMacvlan(state, val) {
    state.macvlan = val;
  },
  removeMacvlan(state, val) {
    removeObject(state.macvlanList, val);
  },
};
