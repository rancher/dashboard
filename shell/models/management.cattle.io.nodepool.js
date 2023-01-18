import { CAPI, MANAGEMENT, NORMAN } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import HybridModel from '@shell/plugins/steve/hybrid-class';

export default class MgmtNodePool extends HybridModel {
  get nodeTemplate() {
    const id = (this.spec?.nodeTemplateName || '').replace(/:/, '/');
    const template = this.$getters['byId'](MANAGEMENT.NODE_TEMPLATE, id);

    return template;
  }

  get provider() {
    return this.nodeTemplate?.provider;
  }

  get providerName() {
    return this.nodeTemplate?.nameDisplay;
  }

  get providerDisplay() {
    return this.nodeTemplate?.providerDisplay;
  }

  get providerLocation() {
    return this.nodeTemplate?.providerLocation;
  }

  get providerSize() {
    return this.nodeTemplate?.providerSize;
  }

  get provisioningCluster() {
    return this.$getters['all'](CAPI.RANCHER_CLUSTER).find(c => c.name === this.spec.clusterName);
  }

  get doneOverride() {
    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        resource:  CAPI.RANCHER_CLUSTER,
        namespace: this.provisioningCluster?.namespace,
        id:        this.spec.clusterName
      }
    };
  }

  get scale() {
    return this.norman.quantity;
  }

  scalePool(delta) {
    this.norman.quantity += delta;

    if ( this.scaleTimer ) {
      clearTimeout(this.scaleTimer);
    }

    this.scaleTimer = setTimeout(() => {
      try {
        this.norman.save();
      } catch (error) {
        this.$dispatch('growl/fromError', {
          title: 'Error scaling pool',
          error
        }, { root: true });
      }
    }, 1000);
  }

  get nodes() {
    const nodePoolName = this.id.replace('/', ':');

    return this.$getters['all'](MANAGEMENT.NODE).filter(node => node.spec.nodePoolName === nodePoolName);
  }

  get nodeSummary() {
    // Use three buckets of states rather than actual states.
    // These are used in `stateParts` which is show in the same context as `stateParts` for machine deployments (rke2 pools))
    // Using actual states here would look strange when against bucket states for RKE2
    const res = {
      pending:     0,
      unavailable: 0,
      ready:       0,
    };

    if (!this.nodes) {
      return res;
    }

    return this.nodes.reduce((res, n) => {
      if (n.metadata.state.error ) {
        res.unavailable++;
      } else if (n.metadata.state.transitioning) {
        res.pending++;
      } else if (n.state !== 'active') {
        res.unavailable++;
      } else {
        res.ready++;
      }

      return res;
    }, { ...res });
  }

  get desired() {
    return this.spec?.quantity || 0;
  }

  get pending() {
    return this.nodeSummary.pending;
  }

  get ready() {
    return this.nodeSummary.ready;
  }

  get unavailable() {
    return this.nodeSummary.unavailable;
  }

  get stateParts() {
    const out = [
      {
        label:     'Pending',
        color:     'bg-info',
        textColor: 'text-info',
        value:     this.pending,
        sort:      1,
      },
      {
        label:     'Unavailable',
        color:     'bg-error',
        textColor: 'text-error',
        value:     this.unavailable,
        sort:      3,
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
  }

  get norman() {
    const id = this.id.replace('/', ':');

    return this.$rootGetters['rancher/byId'](NORMAN.NODE_POOL, id);
  }

  get canDelete() {
    return this.norman?.hasLink('remove');
  }

  get canUpdate() {
    return this.norman?.hasLink('update');
  }

  remove() {
    return this.norman?.remove();
  }
}
