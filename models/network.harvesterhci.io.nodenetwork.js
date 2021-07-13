import { findBy } from '@/utils/array';
import { get } from '@/utils/object';

export default {
  message() {
    const conditions = get(this, 'status.conditions');

    return (findBy(conditions, 'type', 'Ready') || {}).message ;
  },

  isReady() {
    const conditions = get(this, 'status.conditions');

    return (findBy(conditions, 'type', 'Ready') || {})?.status === 'True';
  },

  physicalNics() {
    return this?.status?.physicalNICs || [];
  },

  attachNodeName() {
    return this.getLabelValue('network.harvesterhci.io/nodename');
  },

  linkMessage() {
    return {
      name:    this.attachNodeName,
      message: this.message,
      to:      `node/${ this.attachNodeName }?mode=edit`
    };
  }
};
