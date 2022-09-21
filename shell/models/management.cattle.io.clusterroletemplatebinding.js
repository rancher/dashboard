import { CREATOR_ID } from '@shell/config/labels-annotations';
import { _CREATE } from '@shell/config/query-params';
import { MANAGEMENT, NORMAN } from '@shell/config/types';
import HybridModel from '@shell/plugins/steve/hybrid-class';
import { HARVESTER_NAME } from '@shell/config/product/harvester-manager';

export default class CRTB extends HybridModel {
  detailPageHeaderActionOverride(realMode) {
    if (realMode === _CREATE) {
      return this.t('members.createActionLabel');
    }
  }

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
    const principalId = this.principalId.replace(/\//g, '%2F');

    return this.$dispatch('rancher/find', {
      type: NORMAN.PRINCIPAL,
      id:   this.principalId,
      opt:  { url: `/v3/principals/${ principalId }` }
    }, { root: true });
  }

  get principalId() {
    // We've either set it ourselves or it's comes from native properties
    return this.principalName || this.userPrincipalName || this.groupPrincipalName;
  }

  get nameDisplay() {
    return this.user?.nameDisplay || this.userName || this.principalId;
  }

  get roleDisplay() {
    return this.roleTemplate?.nameDisplay;
  }

  get roleDescription() {
    return this.roleTemplate?.description;
  }

  get roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateName);
  }

  get cluster() {
    return this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, this.clusterName);
  }

  get clusterDisplayName() {
    return this.cluster ? this.cluster.nameDisplay : this.clusterName;
  }

  /**
   * This is used in a table formatter on the management.cattle.io.user detail view which exists outside harvester so no override on this route as there is with listLocation
   */
  get clusterDetailLocation() {
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
  }

  get listLocation() {
    // Harvester uses these resource directly... but has different routes
    if (this.$rootGetters['currentProduct'].inStore === HARVESTER_NAME) {
      return { name: `${ HARVESTER_NAME }-c-cluster-members` };
    }

    return { name: 'c-cluster-product-members' };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get subSearch() {
    return [{ nameDisplay: this.nameDisplay }];
  }

  get isSystem() {
    return !this.metadata.annotations[CREATOR_ID];
  }

  get norman() {
    return (async() => {
      const principal = await this.principal;
      const principalProperty = principal.principalType === 'group' ? 'groupPrincipalId' : 'userPrincipalId';

      return this.$dispatch(`rancher/create`, {
        type:                  NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING,
        roleTemplateId:        this.roleTemplateName,
        [principalProperty]:   principal.id,
        clusterId:             this.clusterName,
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

    await norman.remove({ url: `/v3/clusterRoleTemplateBindings/${ norman.id }` });
  }
}
