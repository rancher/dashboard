import { DESCRIPTION } from '@/config/labels-annotations';
import { SCHEMA, NORMAN } from '@/config/types';
import { CATTLE_API_GROUP, SUBTYPE_MAPPING } from '@/models/management.cattle.io.roletemplate';
import { uniq } from '@/utils/array';
import Vue from 'vue';
import { get } from '@/utils/object';
import Role from './rbac.authorization.k8s.io.role';

const BASE = 'user-base';
const USER = 'user';
const ADMIN = 'admin';
const SPECIAL = [BASE, ADMIN, USER];

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;

export default {
  customValidationRules() {
    return Role.customValidationRules();
  },

  details() {
    const out = this._details;

    out.unshift({
      label:         this.t('resourceDetail.detailTop.name'),
      content:       get(this, 'name')
    });

    return out;
  },

  nameDisplay() {
    return this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.label`, this.displayName || this.metadata?.name || this.id);
  },

  descriptionDisplay() {
    return this.description || this.metadata?.annotations?.[DESCRIPTION] || this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.description`, this.t(`rbac.globalRoles.unknownRole.description`));
  },

  isSpecial() {
    return SPECIAL.includes(this.id);
  },

  subtype() {
    return GLOBAL;
  },

  default() {
    return !!this.newUserDefault;
  },

  updateDefault() {
    return (value) => {
      Vue.set(this, 'newUserDefault', value);
    };
  },

  allResources() {
    return this.$getters['all'](SCHEMA).filter(r => r.attributes?.kind);
  },

  globalResources() {
    return this.allResources.filter(r => r.attributes.group.includes(CATTLE_API_GROUP));
  },

  resources() {
    return uniq(this.globalResources.map(r => r.attributes?.kind)).sort();
  },

  listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ GLOBAL }`
    };
  },

  detailLocation() {
    return {
      ...this._detailLocation,
      name: `c-cluster-auth-roles-resource-id`,
    };
  },

  doneOverride() {
    return this.listLocation;
  },

  parentLocationOverride() {
    return this.listLocation;
  },

  basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.GLOBAL_ROLE }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.GLOBAL_ROLE, name: this.displayName }, { root: true });
  },

  async norman() {
    const norman = await this.basicNorman;

    norman.rules = this.rules;
    norman.newUserDefault = this.newUserDefault;
    norman.id = this.id;
    norman.name = this.displayName;
    norman.description = this.description;

    return norman;
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

      await norman.remove();
    };
  }
};
