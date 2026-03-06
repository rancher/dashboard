import { CAPI, MANAGEMENT } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { Location } from 'vue-router';

interface ReferencedCluster {
  label: string;
  location: Location | null;
}

export default class Kubeconfig extends SteveModel {
  declare spec: {
    clusters?: string[];
    ttl?: number;
  };

  declare metadata: {
    name?: string;
    creationTimestamp?: string;
  };

  get _availableActions(): object[] {
    const out = super._availableActions;

    // Remove element at index 1 (the first divider), the actions that don't make sense.
    return out.filter((action: { action: string }, index: number) => index !== 1 && !['goToEdit', 'goToEditYaml', 'cloneYaml', 'download'].includes(action.action));
  }

  /**
   * Calculates the expiry timestamp from creationTimestamp + ttl.
   * Returns an ISO date string for use with LiveDate formatter.
   */
  get expiresAt(): string | null {
    const ttlSeconds = this.spec?.ttl;
    const creationTimestamp = this.metadata?.creationTimestamp;

    if (!ttlSeconds || !creationTimestamp) {
      return null;
    }

    const createdAt = new Date(creationTimestamp);
    const expiresAt = new Date(createdAt.getTime() + (ttlSeconds * 1000));

    return expiresAt.toISOString();
  }

  /**
   * Returns cluster information for display and linking.
   * Each object contains {label, location} where location is null if cluster doesn't exist.
   */
  get referencedClusters(): ReferencedCluster[] {
    const clusterIds = this.spec?.clusters || [];
    const provClusters = this.$rootGetters['management/all'](CAPI.RANCHER_CLUSTER) || [];
    const mgmtClusters = this.$rootGetters['management/all'](MANAGEMENT.CLUSTER) || [];

    return clusterIds.map((id: string) => {
      const provCluster = provClusters.find((c: any) => c.mgmt?.id === id || c.status?.clusterName === id);
      const mgmtCluster = mgmtClusters.find((c: any) => c.id === id);
      const cluster = provCluster || mgmtCluster;

      return {
        label:    cluster?.nameDisplay || this.t('"ext.cattle.io.kubeconfig".deleted', { name: id }),
        location: provCluster?.detailLocation || mgmtCluster?.detailLocation || null
      };
    });
  }

  /**
   * Returns referenced clusters sorted: existing clusters first (by name), then deleted clusters.
   */
  get sortedReferencedClusters(): ReferencedCluster[] {
    return this.referencedClusters.slice().sort((a, b) => {
      const aExists = a.location !== null;
      const bExists = b.location !== null;

      if (aExists && !bExists) {
        return -1;
      }
      if (!aExists && bExists) {
        return 1;
      }

      const aName = a.label.toLowerCase();
      const bName = b.label.toLowerCase();

      return aName.localeCompare(bName, undefined, { numeric: true });
    });
  }

  /**
   * Returns a sortable string for the clusters column.
   */
  get referencedClustersSortable(): string {
    return this.sortedReferencedClusters
      .map((c) => c.label.toLowerCase())
      .join(',');
  }
}
