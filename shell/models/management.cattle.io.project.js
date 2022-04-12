import { DEFAULT_PROJECT, SYSTEM_PROJECT } from '@shell/config/labels-annotations';
import { MANAGEMENT, NAMESPACE, NORMAN } from '@shell/config/types';
import HybridModel from '@shell/plugins/steve/hybrid-class';

function clearResourceQuotas(val, type) {
  if (Object.keys(val[type].limit).length) {
    Object.keys(val[type].limit).forEach((key) => {
      if (!val[type].limit[key]) {
        delete val[type].limit[key];
      }
    });
  }

  if ( val[type]?.limit && !Object.keys(val[type].limit).length ) {
    delete val[type].limit;
  }

  if ( val[type] && !Object.keys(val[type]).length ) {
    delete val[type];
  }

  return val[type];
}

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
    this.$dispatch('management/remove', this, { root: true });
  }

  get norman() {
    return this.id ? this.normanEditProject : this.normanNewProject;
  }

  get normanNewProject() {
    return (async() => {
      const normanProject = await this.$dispatch('rancher/create', {
        type:                          NORMAN.PROJECT,
        name:                          this.spec.displayName,
        description:                   this.spec.description,
        annotations:                   this.metadata.annotations,
        labels:                        this.metadata.labels,
        clusterId:                     this.$rootGetters['currentCluster'].id,
        creatorId:                     this.$rootGetters['auth/principalId'],
        containerDefaultResourceLimit: this.spec.containerDefaultResourceLimit,
        namespaceDefaultResourceQuota: clearResourceQuotas(JSON.parse(JSON.stringify(this.spec)), 'namespaceDefaultResourceQuota'),
        resourceQuota:                 clearResourceQuotas(JSON.parse(JSON.stringify(this.spec)), 'resourceQuota'),
      }, { root: true });

      // The backend seemingly required both labels/annotation and metadata.labels/annotations or it doesn't save the labels and annotations
      normanProject.setAnnotations(this.metadata.annotations);
      normanProject.setLabels(this.metadata.labels);

      return normanProject;
    })();
  }

  get normanEditProject() {
    return (async() => {
      const normanProject = await this.$dispatch('rancher/find', {
        type:       NORMAN.PROJECT,
        id:         this.id.replace('/', ':'),
      }, { root: true });

      normanProject.setAnnotations(this.metadata.annotations);
      normanProject.setLabels(this.metadata.labels);
      normanProject.description = this.spec.description;
      normanProject.containerDefaultResourceLimit = this.spec.containerDefaultResourceLimit;
      normanProject.namespaceDefaultResourceQuota = clearResourceQuotas(JSON.parse(JSON.stringify(this.spec)), 'namespaceDefaultResourceQuota');
      normanProject.resourceQuota = clearResourceQuotas(JSON.parse(JSON.stringify(this.spec)), 'resourceQuota');

      return normanProject;
    })();
  }
}
