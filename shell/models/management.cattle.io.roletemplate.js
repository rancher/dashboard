import Vue from 'vue';
import { get } from '@shell/utils/object';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { NORMAN } from '@shell/config/types';
import SteveDescriptionModel from '@shell/plugins/steve/steve-description-class';
import Role from './rbac.authorization.k8s.io.role';
import { AS, MODE, _CLONE, _UNFLAG } from '@shell/config/query-params';
import { SUBTYPE_MAPPING, _getDefault, _getSubType } from '@shell/plugins/steve/resourceUtils/management.cattle.io.roletemplate';

export const CATTLE_API_GROUP = '.cattle.io';

export const VERBS = [
  'create',
  'delete',
  'get',
  'list',
  'patch',
  'update',
  'watch',
];

export const CREATE_VERBS = new Set(['PUT', 'blocked-PUT']);

export default class RoleTemplate extends SteveDescriptionModel {
  get customValidationRules() {
    return Role.customValidationRules();
  }

  get details() {
    const out = this._details;

    out.unshift({
      label:   this.t('resourceDetail.detailTop.name'),
      content: get(this, 'name')
    },
    // API returns a blank description property, this overrides our own link to the description
    {
      label:   this.t('resourceDetail.detailTop.description'),
      content: this.metadata?.annotations?.[DESCRIPTION]
    });

    return out;
  }

  get state() {
    return this.locked ? 'locked' : this.metadata?.state?.name || 'unknown';
  }

  get subtype() {
    return _getSubType(this);
  }

  updateSubtype(subtype) {
    Vue.set(this, '_subtype', subtype);
    this.context = SUBTYPE_MAPPING[subtype].context;
  }

  get default() {
    return _getDefault(this);
  }

  updateDefault(value) {
    const defaultKey = SUBTYPE_MAPPING[this.subtype].defaultKey;

    Vue.set(this, defaultKey, value);
  }

  get listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ this.subtype }`
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
      return this.$dispatch(`rancher/find`, { id: this.id, type: NORMAN.ROLE_TEMPLATE }, { root: true });
    }

    return this.$dispatch(`rancher/create`, { type: NORMAN.ROLE_TEMPLATE, name: this.displayName }, { root: true });
  }

  get norman() {
    return (async() => {
      const norman = await this.basicNorman;

      norman.rules = this.rules;
      norman.locked = this.locked;
      norman.clusterCreatorDefault = this.clusterCreatorDefault || false;
      norman.projectCreatorDefault = this.projectCreatorDefault || false;
      norman.context = this.context;
      norman.description = this.description;
      norman.roleTemplateIds = this.roleTemplateNames;

      return norman;
    })();
  }

  get canCreate() {
    const schema = this.$getters['schemaFor'](this.type);

    return schema?.resourceMethods.find(verb => CREATE_VERBS.has(verb));
  }

  goToClone(moreQuery = {}) {
    const location = this.detailLocation;

    location.query = {
      ...location.query,
      [MODE]:      _CLONE,
      [AS]:        _UNFLAG,
      roleContext: this.subtype,
      ...moreQuery
    };

    this.currentRouter().push(location);
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
