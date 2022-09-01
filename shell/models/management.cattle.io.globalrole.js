import { DESCRIPTION } from '@shell/config/labels-annotations';
import { SCHEMA, NORMAN } from '@shell/config/types';
import { CATTLE_API_GROUP, SUBTYPE_MAPPING } from '@shell/models/management.cattle.io.roletemplate';
import { uniq } from '@shell/utils/array';
import { get } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';
import Role from './rbac.authorization.k8s.io.role';

const BASE = 'user-base';
const USER = 'user';
const ADMIN = 'admin';
const SPECIAL = [BASE, ADMIN, USER];

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;

export default class GlobalRole extends SteveModel {
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
    const path = `rbac.globalRoles.role.${ this.id }.label`;
    const label = this.displayName || this.metadata?.name || this.id;

    return this.$rootGetters['i18n/withFallback'](path, label);
  }

  get descriptionDisplay() {
    return this.description ||
    this.metadata?.annotations?.[DESCRIPTION] ||
    this.$rootGetters['i18n/withFallback'](`rbac.globalRoles.role.${ this.id }.description`, this.t(`rbac.globalRoles.unknownRole.description`));
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

  /**
   * Due to issues in the Steve API, we need to switch to Norman API for handle and save this model
   */
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
