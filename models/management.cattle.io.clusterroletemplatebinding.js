import { CREATOR_ID } from '@/config/labels-annotations';
import { _CREATE } from '@/config/query-params';
import { MANAGEMENT, NORMAN } from '@/config/types';

export default {
  detailPageHeaderActionOverride() {
    return (realMode) => {
      if (realMode === _CREATE) {
        return this.t('members.createActionLabel');
      }
    };
  },

  canCustomEdit() {
    return false;
  },

  canYaml() {
    return false;
  },

  canClone() {
    return false;
  },

  user() {
    return this.$rootGetters['management/byId'](MANAGEMENT.USER, this.userName);
  },

  principal() {
    const principalId = this.principalId.replace(/\//g, '%2F');

    return this.$dispatch('rancher/find', {
      type: NORMAN.PRINCIPAL,
      id:   this.principalId,
      opt:  { url: `/v3/principals/${ principalId }` }
    }, { root: true });
  },

  principalId() {
    // We've either set it ourselves or it's comes from native properties
    return this.principalName || this.userPrincipalName || this.groupPrincipalName;
  },

  nameDisplay() {
    return this.user?.nameDisplay || this.userName || this.principalId;
  },

  roleDisplay() {
    return this.roleTemplate.nameDisplay;
  },

  roleDescription() {
    return this.roleTemplate.description;
  },

  roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateName);
  },

  cluster() {
    return this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, this.clusterName);
  },

  clusterDisplayName() {
    return this.cluster ? this.cluster.nameDisplay : this.clusterName;
  },

  clusterDetailLocation() {
    if (this.cluster) {
      return this.cluster.detailLocation;
    }

    const name = `c-cluster-product-resource-id`;

    const params = {
      resource:  MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      id:        this.clusterName,
      product:   'explorer',
    };

    return { name, params };
  },

  listLocation() {
    return { name: 'c-cluster-product-members' };
  },

  doneOverride() {
    return this.listLocation;
  },

  parentLocationOverride() {
    return this.listLocation;
  },

  subSearch() {
    return [{ nameDisplay: this.nameDisplay }];
  },

  isSystem() {
    return !this.metadata.annotations[CREATOR_ID];
  },

  async norman() {
    const principal = await this.principal;
    const principalProperty = principal.principalType === 'group' ? 'groupPrincipalId' : 'userPrincipalId';

    return this.$dispatch(`rancher/create`, {
      type:                  NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING,
      roleTemplateId:        this.roleTemplateName,
      [principalProperty]:   principal.id,
      clusterId:             this.clusterName,
      id:                    this.id?.replace('/', ':')
    }, { root: true });
  },

  save() {
    return async() => {
      const norman = await this.norman;

      return norman.save();
    };
  },

  remove() {
    return async() => {
      const norman = await this.norman;

      await norman.remove({ url: `/v3/clusterRoleTemplateBindings/${ norman.id }` });
    };
  },
};
