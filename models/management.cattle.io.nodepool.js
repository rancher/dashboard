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

  providerDisplay() {
    return this.nodeTemplate?.providerDisplay;
  },
};
