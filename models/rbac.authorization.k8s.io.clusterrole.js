import { CATTLE_API_GROUP, SUBTYPE_MAPPING } from '@/models/management.cattle.io.roletemplate';
import { uniq } from '@/utils/array';
import Role from './rbac.authorization.k8s.io.role';

export default {
  ...Role,

  subtype() {
    return SUBTYPE_MAPPING.RBAC_CLUSTER_ROLE.key;
  },

  namespaceResources() {
    return this.allResources.filter(r => r.attributes.namespaced && !r.attributes.group.includes(CATTLE_API_GROUP));
  },

  resources() {
    return uniq(this.namespaceResources.map(r => r.attributes?.kind)).sort();
  },
};
