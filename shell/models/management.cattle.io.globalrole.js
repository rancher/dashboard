import { DESCRIPTION } from '@shell/config/labels-annotations';
import { SCHEMA, NORMAN } from '@shell/config/types';
import { CATTLE_API_GROUP, SUBTYPE_MAPPING, CREATE_VERBS } from '@shell/models/management.cattle.io.roletemplate';
import { uniq } from '@shell/utils/array';
import { get } from '@shell/utils/object';
import SteveDescriptionModel from '@shell/plugins/steve/steve-description-class';
import { AS, MODE, _CLONE, _UNFLAG } from '@shell/config/query-params';

const BASE = 'user-base';
const USER = 'user';
const ADMIN = 'admin';
const SPECIAL = [BASE, ADMIN, USER];

const GLOBAL = SUBTYPE_MAPPING.GLOBAL.key;

export default class GlobalRole extends SteveDescriptionModel {
  get customValidationRules() {
    return [
      {
        path:       'rules',
        validators: [`roleTemplateRules:${ this.type }`],
        nullable:   false,
        type:       'array',
      },
    ];
  }

  get details() {
    const out = this._details;

    out.unshift({
      label:   this.t('resourceDetail.detailTop.name'),
      content: get(this, 'name')
    });

    return out;
  }

  get nameDisplay() {
    // i18n-uses rbac.globalRoles.role.*.label
    const path = `rbac.globalRoles.role.${ this.id }.label`;
    const label = this.displayName || this.metadata?.name || this.id;

    return this.$rootGetters['i18n/withFallback'](path, label);
  }

  get descriptionDisplay() {
    return this.description ||
    this.metadata?.annotations?.[DESCRIPTION] ||
    // i18n-uses rbac.globalRoles.role.*.description
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
    return this.$getters['all'](SCHEMA).filter((r) => r.attributes?.kind);
  }

  get globalResources() {
    return this.allResources.filter((r) => r.attributes.group.includes(CATTLE_API_GROUP));
  }

  get resources() {
    return uniq(this.globalResources.map((r) => r.attributes?.resource)).sort();
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
      norman.inheritedClusterRoles = this.inheritedClusterRoles;

      return norman;
    })();
  }

  get canCreate() {
    const schema = this.$getters['schemaFor'](this.type);

    return schema?.resourceMethods.find((verb) => CREATE_VERBS.has(verb));
  }

  /**
   * Resource action redirects to the detail page with a query parameter 'clone'
   * When the query parameter is present, the view will fetch the resource to clone define in the parameter
   * E.g.: /my-id?mode=clone
   * @param {*} moreQuery
   */
  goToClone(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:      _CLONE,
      [AS]:        _UNFLAG,
      roleContext: GLOBAL,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  async save() {
    const norman = await this.norman;

    for (const rule of norman.rules) {
      if (rule.nonResourceURLs && rule.nonResourceURLs.length) {
        delete rule.resources;
        delete rule.apiGroups;
      } else {
        delete rule.nonResourceURLs;
      }
    }

    return norman.save();
  }

  async remove() {
    const norman = await this.norman;

    await norman.remove();
  }
}
