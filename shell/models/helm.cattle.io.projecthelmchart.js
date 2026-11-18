import SteveModel from '@shell/plugins/steve/steve-class';
import { NAMESPACE, MANAGEMENT, HELM } from '@shell/config/types';

export default class ProjectHelmChart extends SteveModel {
  applyDefaults() {
    if ( !this.spec ) {
      this['spec'] = { helmApiVersion: 'monitoring.cattle.io/v1alpha1' };
      this['metadata'] = { name: 'project-monitoring' };
    }
  }

  get projectId() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const all = this.$rootGetters[`${ inStore }/all`](NAMESPACE);

    return all.find((namespace) => namespace.id === this.namespace)?.projectId;
  }

  get projectDisplayName() {
    const clusterId = this.$rootGetters['currentCluster']?.id;
    const project = this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ this.projectId }`);

    return project?.spec.displayName;
  }

  get nameDisplay() {
    return this.projectDisplayName || super.nameDisplay;
  }

  get namespaces() {
    const inStore = this.$rootGetters['currentProduct'].inStore;
    const all = this.$rootGetters[`${ inStore }/all`](NAMESPACE);
    const namespaces = all.filter((namespace) => namespace.projectId === this.projectId);

    return [...namespaces];
  }

  get parentNameOverride() {
    return this.$rootGetters['i18n/t'](`typeLabel."${ HELM.PROJECTHELMCHART }"`, { count: 1 })?.trim();
  }
}
