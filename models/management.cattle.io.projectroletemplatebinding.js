import { MANAGEMENT } from '@/config/types';

export default {
  projectId() {
    // projectName is in format `local:p-v679w`. project id's are in format `local/p-v679w`,
    return this.projectName.replace(':', '/');
  },
  project() {
    return this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, this.projectId);
  },

  projectDisplayName() {
    return this.project ? this.project.nameDisplay : this.projectName;
  },

  projectDetailLocation() {
    if (this.project) {
      return this.project.detailLocation;
    }

    const name = `c-cluster-product-resource-id`;

    const params = {
      resource:  MANAGEMENT.PROJECT,
      id:        this.projectId,
      product:   'explorer',
    };

    return { name, params };
  },

  roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateName);
  }

};
