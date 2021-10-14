import { DEFAULT_PROJECT, SYSTEM_PROJECT } from '@/config/labels-annotations';
import { MANAGEMENT, NAMESPACE, NORMAN } from '@/config/types';
import HybridModel from '@/plugins/steve/hybrid-class';

export default class Project extends HybridModel {
  get isSystem() {
    return this.metadata?.labels?.[SYSTEM_PROJECT] === 'true';
  }

  get isDefault() {
    return this.metadata?.labels?.[DEFAULT_PROJECT] === 'true';
  }

  get namespaces() {
    // I don't know how you'd end up with a project outside of rancher, but just in case...
    if ( !this.$rootGetters['isRancher'] ) {
      return [];
    }

    const inStore = this.$rootGetters['currentProduct'].inStore;

    const all = this.$rootGetters[`${ inStore }/all`](NAMESPACE);

    return all.filter((ns) => {
      return ns.projectId === this.metadata.name;
    });
  }

  get listLocation() {
    return { name: 'c-cluster-product-projectsnamespaces' };
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  async save() {
    const norman = await this.norman;

    const newValue = await norman.save();

    newValue.doAction('setpodsecuritypolicytemplate', { podSecurityPolicyTemplateId: this.spec.podSecurityPolicyTemplateId || null });

    await this.$dispatch('management/findAll', { type: MANAGEMENT.PROJECT, opt: { force: true } }, { root: true });

    return newValue;
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove(...arguments);
    this.$commit('management/remove', this, { root: true });
  }

  get norman() {
    return this.id ? this.normanEditProject : this.normanNewProject;
  }

  async get normanNewProject() {
    const normanProject = await this.$dispatch('rancher/create', {
      type:                          NORMAN.PROJECT,
      name:                          this.spec.displayName,
      description:                   this.spec.description,
      annotations:                   this.metadata.annotations,
      labels:                        this.metadata.labels,
      clusterId:                     this.$rootGetters['currentCluster'].id,
      creatorId:                     this.$rootGetters['auth/principalId'],
      containerDefaultResourceLimit: this.spec.containerDefaultResourceLimit,
      namespaceDefaultResourceQuota: this.spec.namespaceDefaultResourceQuota,
      resourceQuota:                 this.spec.resourceQuota,
    }, { root: true });

    // The backend seemingly required both labels/annotation and metadata.labels/annotations or it doesn't save the labels and annotations
    normanProject.setAnnotations(this.metadata.annotations);
    normanProject.setLabels(this.metadata.labels);

    return normanProject;
  }

  async get normanEditProject() {
    const normanProject = await this.$dispatch('rancher/find', {
      type:       NORMAN.PROJECT,
      id:         this.id.replace('/', ':'),
    }, { root: true });

    normanProject.setAnnotations(this.metadata.annotations);
    normanProject.setLabels(this.metadata.labels);
    normanProject.description = this.spec.description;
    normanProject.containerDefaultResourceLimit = this.spec.containerDefaultResourceLimit;
    normanProject.namespaceDefaultResourceQuota = this.spec.namespaceDefaultResourceQuota;
    normanProject.resourceQuota = this.spec.resourceQuota;

    return normanProject;
  }
}
