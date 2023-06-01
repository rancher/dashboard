import { EpinioInfo, EpinioVersion } from '../../types';

export default {

  singleProductCNSI(state: any, singleProductCNSI: any) {
    state.singleProductCNSI = singleProductCNSI;
  },

  info(state: any, info: EpinioInfo) {
    state.info = info;
  },

  version(state: any, version: EpinioVersion) {
    state.version = version;
  }
};
