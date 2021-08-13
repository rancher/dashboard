import { CAPI, MANAGEMENT, NORMAN } from '@/config/types';
import { sortBy } from '@/utils/sort';

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

  scalePool() {
    return (delta) => {
      this.normanPool.quantity += delta;
      this.normanPool.save();
    };
  },

  nodes() {
    const nodePoolName = this.id.replace('/', ':');

    return this.$getters['all'](MANAGEMENT.NODE).filter(node => node.spec.nodePoolName === nodePoolName);
  },

  desired() {
    return this.spec?.quantity || 0;
  },

  pending() {
    return Math.max(0, this.desired - (this.nodes?.length || 0));
  },

  ready() {
    return Math.max(0, (this.nodes?.length || 0) - (this.pending || 0));
  },

  stateParts() {
    const out = [
      {
        label:     'Pending',
        color:     'bg-info',
        textColor: 'text-info',
        value:     this.pending,
        sort:      1,
      },
      {
        label:     'Ready',
        color:     'bg-success',
        textColor: 'text-success',
        value:     this.ready,
        sort:      4,
      },
    ].filter(x => x.value > 0);

    return sortBy(out, 'sort:desc');
  },

  normanPool() {
    const id = this.id.replace('/', ':');

    return this.$rootGetters['rancher/byId'](NORMAN.NODE_POOL, id);
  },

};
