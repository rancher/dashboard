import { DEFAULT_PROJECT, SYSTEM_PROJECT } from '@shell/config/labels-annotations';
import { MANAGEMENT, NAMESPACE, NORMAN } from '@shell/config/types';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import isEmpty from 'lodash/isEmpty';

function clearUnusedResourceQuotas(spec, types) {
  types.forEach((type) => {
    if (spec[type]?.limit && !isEmpty(spec[type].limit)) {
      Object.keys(spec[type].limit).forEach((key) => {
        if (!spec[type].limit[key]) {
          delete spec[type].limit[key];
        }
      });
    }

    if (spec[type]?.usedLimit && !isEmpty(spec[type].usedLimit)) {
      Object.keys(spec[type].usedLimit).forEach((key) => {
        if (!spec[type].usedLimit[key]) {
          delete spec[type].usedLimit[key];
        }
      });
    }

    if ( spec[type]?.limit && isEmpty(spec[type].limit) ) {
      spec[type].limit = null;
    }

    if ( spec[type]?.usedLimit && isEmpty(spec[type].usedLimit) ) {
      spec[type].usedLimit = null;
    }

    if ( spec[type] && !isEmpty(spec[type]) && Object.keys(spec[type]).every( k => spec[type][k] === null ) ) {
      spec[type] = null;
    }
  });

  return spec;
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
      const clearedResourceQuotas = clearUnusedResourceQuotas(this.spec, ['resourceQuota', 'namespaceDefaultResourceQuota']);

      const normanProject = await this.$dispatch('rancher/create', {
        type:                          NORMAN.PROJECT,
        name:                          this.spec.displayName,
        description:                   this.spec.description,
        annotations:                   this.metadata.annotations,
        labels:                        this.metadata.labels,
        clusterId:                     this.$rootGetters['currentCluster'].id,
        creatorId:                     this.$rootGetters['auth/principalId'],
        containerDefaultResourceLimit: this.spec.containerDefaultResourceLimit,
      }, { root: true });

      // The backend seemingly required both labels/annotation and metadata.labels/annotations or it doesn't save the labels and annotations
      normanProject.setAnnotations(this.metadata.annotations);
      normanProject.setLabels(this.metadata.labels);
      normanProject.setResourceQuotas(clearedResourceQuotas);

      return normanProject;
    })();
  }

  get normanEditProject() {
    return (async() => {
      const normanProject = await this.$dispatch('rancher/find', {
        type:       NORMAN.PROJECT,
        id:         this.id.replace('/', ':'),
      }, { root: true });

      const clearedResourceQuotas = clearUnusedResourceQuotas(this.spec, ['resourceQuota', 'namespaceDefaultResourceQuota']);

      normanProject.setAnnotations(this.metadata.annotations);
      normanProject.setLabels(this.metadata.labels);
      normanProject.setResourceQuotas(clearedResourceQuotas);
      normanProject.description = this.spec.description;
      normanProject.containerDefaultResourceLimit = this.spec.containerDefaultResourceLimit;

      return normanProject;
    })();
  }

  // users with permissions for projectroletemplatebindings should be able to manage members on projects
  get canUpdate() {
    return super.canUpdate || this.canUpdateProjectBindings;
  }

  get canUpdateProjectBindings() {
    const schema = this.$rootGetters[`rancher/schemaFor`](NORMAN.PROJECT_ROLE_TEMPLATE_BINDING);

    return schema?.collectionMethods.includes('POST');
  }

  get canEditYaml() {
    return this.schema?.resourceMethods?.find(x => x === 'blocked-PUT') ? false : super.canUpdate;
  }
}
