import { MANAGEMENT } from '@/config/types';

export default {
  projectId() {
    // projectName is in format `local:p-v679w`. project id's are in format `local/p-v679w`,
    return this.projectName.replace(':', '/');
  },

  clusterId() {
    // projectName is in format `local:p-v679w`,
    return this.projectName.substring(0, this.projectName.lastIndexOf(':'));
  },

  project() {
    return this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, this.projectId);
  },

  cluster() {
    return this.$rootGetters['management/byId'](MANAGEMENT.CLUSTER, this.clusterId);
  },

  projectDisplayName() {
    return this.project ? this.project.nameDisplay : this.projectName;
  },

  clusterDisplayName() {
    return this.cluster ? this.cluster.nameDisplay : this.clusterId;
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

  roleTemplate() {
    return this.$rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, this.roleTemplateName);
  }

};
