import { MANAGEMENT } from '@/config/types';

export default {
  nodeTemplate() {
    const id = (this.spec?.nodeTemplateName || '').replace(/:/, '/');
    const template = this.$getters['byId'](MANAGEMENT.NODE_TEMPLATE, id);

    return template;
  },

  provider() {
    return this.nodeTemplate?.provider;
  },

  providerName() {
    return this.nodeTemplate?.nameDisplay;
  },

  providerDisplay() {
    return this.nodeTemplate?.providerDisplay;
  },

  providerLocation() {
    return this.nodeTemplate?.providerLocation;
  },

  providerSize() {
    return this.nodeTemplate?.providerSize;
  },

};
