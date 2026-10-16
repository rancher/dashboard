import { CAPI } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { findAllInNamespace, findIfExists, relatedEntry } from '@shell/utils/related-resources';

export default class CapiCluster extends SteveModel {
  /**
   * Related resources to show in the yaml editor
   * 2-3 are found here:
   * - the ClusterClass of a cluster with a managed topology (not relevant to Rancher provisioned clusters)
   * - the MachineDeployments and MachinePools naming this cluster in `spec.clusterName`
   *
   * 2 more a located using generic steve-model methods fetchSchemaRelatedResources:
   * - The infrastructure cluster - `spec.infrastructureRef`
   * - The control plane - `spec.controlPlaneRef`
   * @param {import('@shell/core/types').RelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').RelatedResource[]>}
   */
  async fetchModelRelatedResources({ dependencies = true } = {}) {
    if (!this.metadata?.uid || !dependencies) {
      return [];
    }

    const namespace = this.metadata.namespace;

    const [clusterClass, machineDeployments, machinePools] = await Promise.all([
      findIfExists(this, CAPI.CLUSTER_CLASS, this.clusterClassId),
      findAllInNamespace(this, CAPI.MACHINE_DEPLOYMENT, namespace),
      findAllInNamespace(this, CAPI.MACHINE_POOL, namespace),
    ]);

    const inThisCluster = (resource) => resource.spec?.clusterName === this.metadata.name;
    const classBanner = () => ({ color: 'warning', label: this.t('resourceYaml.resourceGraph.banners.sharedByClusters') });

    return [
      ...(clusterClass ? [relatedEntry(clusterClass, { banner: classBanner })] : []),
      ...machineDeployments.filter(inThisCluster).map((resource) => relatedEntry(resource)),
      ...machinePools.filter(inThisCluster).map((resource) => relatedEntry(resource)),
    ];
  }

  /**
   * `namespace/name` of the ClusterClass of a cluster with a managed topology, empty otherwise
   *
   * v1beta2 names it in `spec.topology.classRef`, v1beta1 in `spec.topology.class` and
   * `spec.topology.classNamespace`. Without a namespace it is in the namespace of the cluster
   *
   * @returns {string}
   */
  get clusterClassId() {
    const topology = this.spec?.topology;
    const name = topology?.classRef?.name || topology?.class;
    const namespace = topology?.classRef?.namespace || topology?.classNamespace || this.metadata?.namespace;

    return name ? `${ namespace }/${ name }` : '';
  }
}
