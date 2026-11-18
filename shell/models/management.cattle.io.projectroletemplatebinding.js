import { CREATOR_ID } from '@shell/config/labels-annotations';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import { NAME as EXPLORER } from '@shell/config/product/explorer';

export default class PRTB extends HybridModel {
  get canCustomEdit() {
    return false;
  }

  get canYaml() {
    return false;
  }

  get canClone() {
    return false;
  }

  get user() {
    return this.$rootGetters['management/byId'](MANAGEMENT.USER, this.userName);
  }

  get principal() {
    const principalId = encodeURIComponent(this.principalId);

    return this.$dispatch('rancher/find', {
      type: NORMAN.PRINCIPAL,
      id:   this.principalId,
      opt:  { url: `/v3/principals/${ principalId }` }
    }, { root: true });
  }

  get principalId() {
    // We've either set it ourselves or it's comes from native properties
    return this.principalName || this.userPrincipalName || this.groupPrincipalName || '';
  }

  get nameDisplay() {
    return this.user?.nameDisplay;
  }

  get projectId() {
    // projectName is in format `local:p-v679w`. project id's are in format `local/p-v679w`,
    return this.projectName?.replace(':', '/');
  }

  get clusterId() {
    // projectName is in format `local:p-v679w`,
    return this.projectName.substring(0, this.projectName.lastIndexOf(':'));
  }

  get project() {
    return this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, this.projectId);
  }

  get cluster() {
    return this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, this.clusterId);
  }

  get projectDisplayName() {
    return this.project ? this.project.nameDisplay : this.projectName;
  }

  get clusterDisplayName() {
    return this.cluster ? this.cluster.nameDisplay : this.clusterId;
  }

  get userAvatar() {
    return {
      nameDisplay: this.nameDisplay,
      userName:    this.user.username,
      avatarSrc:   this.user.avatarSrc
    };
  }

  get projectDetailLocation() {
    if (this.project) {
      return this.project.detailLocation;
    }

    return {
      name:   'c-cluster-product-resource-namespace-id',
      params: {
        cluster:   this.clusterId,
        product:   EXPLORER,
        resource:  MANAGEMENT.PROJECT,
        namespace: this.clusterId,
        id:        this.projectId.replace(/.*\//, ''),
      }
    };
  }

  get clusterDetailLocation() {
    return this.cluster?.canExplore ? { name: 'c-cluster-explorer', params: { cluster: this.clusterId } } : null;
  }

  get roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateName);
  }

  get roleDisplay() {
    return this.roleTemplate.nameDisplay;
  }

  get listLocation() {
    return { name: 'c-cluster-explorer-project-members' };
  }

  get isSystem() {
    return !this.metadata.annotations[CREATOR_ID];
  }

  get norman() {
    return (async() => {
      const principal = await this.principal;
      const principalProperty = principal?.principalType === 'group' ? 'groupPrincipalId' : 'userPrincipalId';

      return this.$dispatch(`rancher/create`, {
        type:                  NORMAN.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateId:        this.roleTemplateName,
        [principalProperty]:   principal?.id,
        projectId:             this.projectName,
        projectRoleTemplateId: '',
        id:                    this.id?.replace('/', ':')
      }, { root: true });
    })();
  }

  async save() {
    const norman = await this.norman;

    return norman.save();
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove({ url: `/v3/projectRoleTemplateBindings/${ norman.id }` });
  }
}
