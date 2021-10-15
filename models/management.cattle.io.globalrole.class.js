import { DESCRIPTION } from '@/config/labels-annotations';
import { SCHEMA, NORMAN } from '@/config/types';
import { CATTLE_API_GROUP, SUBTYPE_MAPPING } from '@/models/management.cattle.io.roletemplate.class';
import { uniq } from '@/utils/array';
import Vue from 'vue';
import { get } from '@/utils/object';
import HybridModel from '@/plugins/steve/hybrid-class';
import Role from './rbac.authorization.k8s.io.role.class';

const BASE = 'user-base';
const USER = 'user';
const ADMIN = 'admin';
const SPECIAL = [BASE, ADMIN, USER];

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;

export default class GlobalRole extends HybridModel {
  get customValidationRules() {
    return Role.customValidationRules();
  }

  get details() {
    const out = this._details;

    out.unshift({
      label:         this.t('resourceDetail.detailTop.name'),
      content:       get(this, 'name')
    });

    return out;
  }

  get nameDisplay() {
    return this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.label`, this.displayName || this.metadata?.name || this.id);
  }

  get descriptionDisplay() {
    return this.description || this.metadata?.annotations?.[DESCRIPTION] || this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.description`, this.t(`rbac.globalRoles.unknownRole.description`));
  }

  get isSpecial() {
    return SPECIAL.includes(this.id);
  }

  get subtype() {
    return GLOBAL;
  }

  get default() {
    return !!this.newUserDefault;
  }

  updateDefault(value) {
    Vue.set(this, 'newUserDefault', value);
  }

  get allResources() {
    return this.$getters['all'](SCHEMA).filter(r => r.attributes?.kind);
  }

  get globalResources() {
    return this.allResources.filter(r => r.attributes.group.includes(CATTLE_API_GROUP));
  }

  get resources() {
    return uniq(this.globalResources.map(r => r.attributes?.resource)).sort();
  }

  get listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ GLOBAL }`
    };
  }

  get detailLocation() {
    return {
      ...this._detailLocation,
      name: `c-cluster-auth-roles-resource-id`,
    };
  }

  get doneOverride() {
    return this.listLocation;
  }

  get parentLocationOverride() {
    return this.listLocation;
  }

  get basicNorman() {
    if (this.id) {
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.GLOBAL_ROLE }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.GLOBAL_ROLE, name: this.displayName }, { root: true });
  }

  get norman() {
    return (async() => {
      const norman = await this.basicNorman;

      norman.rules = this.rules;
      norman.newUserDefault = this.newUserDefault;
      norman.id = this.id;
      norman.name = this.displayName;
      norman.description = this.description;

      return norman;
    })();
  }

  async save() {
    const norman = await this.norman;

    return norman.save();
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove();
  }
}
