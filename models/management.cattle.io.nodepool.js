import { CAPI, MANAGEMENT } from '@/config/types';

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

  provisioningCluster() {
    return this.$getters['all'](CAPI.RANCHER_CLUSTER).find(c => c.name === this.spec.clusterName);
  },

  doneOverride() {
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  CAPI.RANCHER_CLUSTER,
        namespace: this.provisioningCluster?.namespace,
        id:        this.spec.clusterName
      }
    };
  },

  scalePool(delta) {
    this.spec.quantity += delta;
    this.save();
  }

};
