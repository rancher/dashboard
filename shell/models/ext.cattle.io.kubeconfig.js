import { CAPI, MANAGEMENT, EXT } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { downloadFile } from '@shell/utils/download';

export default class Kubeconfig extends SteveModel {
  get _availableActions() {
    const out = super._availableActions;

    // Remove element at index 1 (the first divider), the actions that don't make sense.
    return out.filter((action, index) => index !== 1 && !['goToEdit', 'goToEditYaml', 'cloneYaml', 'download'].includes(action.action));
  }

  /**
   * Calculates the expiry timestamp from creationTimestamp + ttl (in seconds).
   * Returns an ISO date string for use with LiveDate formatter.
   */
  get expiresAt() {
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
   * Returns a sortable string for the clusters column.
   * Sorts by cluster name first (alphanumeric), then by cluster ID (alphanumeric).
   */
  get clustersSortable() {
    const clusterIds = this.spec?.clusters || [];
    // Kubeconfig stores management cluster IDs, so look up provisioning clusters by mgmtClusterId
    const provClusters = this.$rootGetters['management/all'](CAPI.RANCHER_CLUSTER) || [];
    const mgmtClusters = this.$rootGetters['management/all'](MANAGEMENT.CLUSTER) || [];

    const sortableNames = clusterIds.map((id) => {
      // First try to find provisioning cluster by management cluster ID
      const provCluster = provClusters.find((c) => c.mgmt?.id === id || c.status?.clusterName === id);
      // Also check management clusters directly
      const mgmtCluster = mgmtClusters.find((c) => c.id === id);

      const cluster = provCluster || mgmtCluster;

      if (cluster) {
        // Cluster exists: use name for primary sort, id for secondary
        return `${ cluster.nameDisplay?.toLowerCase() || '' }\u0000${ id.toLowerCase() }`;
      }

      // Cluster doesn't exist: sort by ID (after all named clusters)
      return `\uffff${ id.toLowerCase() }`;
    });

    // Sort and join for consistent ordering
    return sortableNames.sort().join(',');
  }

  /**
   * Downloads the kubeconfig file.
   * Note: status.value is not persisted for security reasons (contains tokens),
   * so we must fetch the individual resource to get the generated content.
   */
  async download() {
    const filename = `${ this.metadata?.name || 'kubeconfig' }.yaml`;

    // status.value is only populated on individual GET requests, not in list responses
    // Fetch the full resource to get the generated kubeconfig content
    const fullResource = await this.$dispatch('management/find', {
      type: EXT.KUBECONFIG,
      id:   this.id,
      opt:  { force: true }
    }, { root: true });

    const content = fullResource?.status?.value;

    if (content) {
      await downloadFile(filename, content, 'application/yaml');
    }
  }
}
