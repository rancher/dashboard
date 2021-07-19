import { NODE } from '@/config/types';
import { parseSi } from '@/utils/units';

export default {
  cpuUsage() {
    return parseSi(this?.usage?.cpu || '0');
  },

  cpuCapacity() {
    return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.allocatable?.cpu || '0');
  },

  cpuUsagePercentage() {
    return ((this.cpuUsage * 10000) / this.cpuCapacity).toString();
  },

  memoryUsage() {
    return parseSi(this?.usage?.memory || '0');
  },

  memoryCapacity() {
    return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.capacity?.memory || '0');
  },

  memoryUsagePercentage() {
    return ((this.ramUsage * 10000) / this.ramCapacity).toString();
  },

  storageUsage() {
    return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.capacity?.['ephemeral-storage']) - parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.allocatable?.['ephemeral-storage']);
  },

  storageTotal() {
    return parseSi(this.$rootGetters[`${ this.inStore }/byId`](NODE, this.id)?.status?.capacity?.['ephemeral-storage']);
  },

  inStore() {
    return this.$rootGetters['currentProduct'].inStore;
  },
};
