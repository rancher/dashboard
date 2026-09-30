import { CAPI } from '@shell/config/types';
import SteveModel from '@shell/plugins/steve/steve-class';
import { findAllOf, findCapiReference, findIfExists, relatedEntry } from '@shell/utils/editable-related-resources';

export default class CapiCluster extends SteveModel {
  /**
   * The resources related to this cluster, to edit by YAML alongside it
   *
   * Dependencies: the infrastructure cluster and control plane in `spec.infrastructureRef` and
   * `spec.controlPlaneRef`, the ClusterClass of a cluster with a managed topology, and the
   * MachineDeployments and MachinePools naming this cluster in `spec.clusterName`
   *
   * The MachineDeployments and MachinePools use this cluster, so by the usual rule they would be
   * dependents. They are dependencies because a dependent is not expanded, and their bootstrap and
   * infrastructure references are only found by expanding them. Each belongs to one cluster, so
   * this adds nothing of another cluster to the tree
   *
   * @param {import('@shell/core/types').EditableRelatedResourcesFetchOptions} [options]
   * @returns {Promise<import('@shell/core/types').EditableRelatedResource[]>}
   */
  async fetchOwnEditableRelatedResources({ dependencies = true } = {}) {
    if (!this.metadata?.uid || !dependencies) {
      return [];
    }

    const namespace = this.metadata.namespace;

    const [infrastructure, controlPlane, clusterClass, machineDeployments, machinePools] = await Promise.all([
      findCapiReference(this, this.spec?.infrastructureRef, namespace),
      findCapiReference(this, this.spec?.controlPlaneRef, namespace),
      findIfExists(this, CAPI.CLUSTER_CLASS, this.clusterClassId),
      findAllOf(this, CAPI.MACHINE_DEPLOYMENT, namespace),
      findAllOf(this, CAPI.MACHINE_POOL, namespace),
    ]);

    const inThisCluster = (resource) => resource.spec?.clusterName === this.metadata.name;
    const classBanner = () => ({ color: 'warning', label: this.t('resourceYaml.resourceGraph.banners.sharedByClusters') });

    return [
      ...[infrastructure, controlPlane].filter(Boolean).map((resource) => relatedEntry(resource)),
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
