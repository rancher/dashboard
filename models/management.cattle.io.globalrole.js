import { DESCRIPTION } from '@/config/labels-annotations';
import { SCHEMA } from '@/config/types';
import { CATTLE_API_GROUP, SUBTYPE_MAPPING } from '@/models/management.cattle.io.roletemplate';
import { uniq } from '@/utils/array';
import Vue from 'vue';
import { get } from '@/utils/object';

const BASE = 'user-base';
const USER = 'user';
const ADMIN = 'admin';
const SPECIAL = [BASE, ADMIN, USER];

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;

export default {
  customValidationRules() {
    return [
      {
        path:           'rules',
        validators:     ['roleTemplateRules'],
        nullable:       false,
        type:           'array',
      },
    ];
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

  description() {
    return this.metadata?.annotations?.[DESCRIPTION] || this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.description`, this.t(`rbac.globalRoles.unknownRole.description`));
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

};
