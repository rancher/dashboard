import { CREATOR_ID, CREATOR_OWNER_BINDING } from '@/config/labels-annotations';
import { _CREATE } from '@/config/query-params';
import { MANAGEMENT } from '@/config/types';

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

  nameDisplay() {
    return this.user?.nameDisplay;
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
    return { name: 'c-cluster-explorer-members' };
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
    return !this.metadata.annotations[CREATOR_ID] && this.metadata.annotations[CREATOR_OWNER_BINDING] !== 'true';
  }
};
