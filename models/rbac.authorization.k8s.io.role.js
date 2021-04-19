import { SCHEMA } from '@/config/types';
import { CATTLE_API_GROUP, SUBTYPE_MAPPING } from '@/models/management.cattle.io.roletemplate';
import { uniq } from '@/utils/array';

export default {
  nameWithinProduct() {
    return this.$rootGetters['i18n/withFallback'](`rbac.displayRole.${ this.name }`, this.name);
  },

  subtype() {
    return SUBTYPE_MAPPING.RBAC_ROLE.key;
  },

  allResources() {
    return this.$getters['all'](SCHEMA).filter(r => r.attributes?.kind);
  },

  clusterResources() {
    return this.allResources.filter(r => !r.attributes.namespaced && !r.attributes.group.includes(CATTLE_API_GROUP));
  },

  resources() {
    return uniq(this.clusterResources.map(r => r.attributes?.kind)).sort();
  },
};
