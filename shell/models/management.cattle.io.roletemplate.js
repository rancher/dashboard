import jsyaml from 'js-yaml';
import omit from 'lodash/omit';
import pickBy from 'lodash/pickBy';
import { get } from '@shell/utils/object';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { NORMAN } from '@shell/config/types';
import SteveDescriptionModel from '@shell/plugins/steve/steve-description-class';
import { dropControllerMetadata } from '@shell/plugins/steve/resource-utils';
import { AS, MODE, _CLONE, _UNFLAG } from '@shell/config/query-params';

export const CATTLE_API_GROUP = '.cattle.io';

export const SUBTYPE_MAPPING = {
  GLOBAL: {
    key:        'GLOBAL',
    type:       'management.cattle.io.globalrole',
    defaultKey: 'newUserDefault',
    id:         'GLOBAL',
    labelKey:   'rbac.roletemplate.subtypes.GLOBAL.label',
  },
  CLUSTER: {
    key:        'CLUSTER',
    type:       'management.cattle.io.roletemplate',
    context:    'cluster',
    defaultKey: 'clusterCreatorDefault',
    id:         'CLUSTER',
    labelKey:   'rbac.roletemplate.subtypes.CLUSTER.label',
  },
  NAMESPACE: {
    key:        'NAMESPACE',
    type:       'management.cattle.io.roletemplate',
    context:    'project',
    defaultKey: 'projectCreatorDefault',
    id:         'NAMESPACE',
    labelKey:   'rbac.roletemplate.subtypes.NAMESPACE.label',
  },
  RBAC_ROLE: {
    key:      'RBAC_ROLE',
    type:     'rbac.authorization.k8s.io.role',
    id:       'RBAC_ROLE',
    labelKey: 'rbac.roletemplate.subtypes.RBAC_ROLE.label',
  },
  RBAC_CLUSTER_ROLE: {
    key:      'RBAC_CLUSTER_ROLE',
    type:     'rbac.authorization.k8s.io.clusterrole',
    id:       'RBAC_CLUSTER_ROLE',
    labelKey: 'rbac.roletemplate.subtypes.RBAC_CLUSTER_ROLE.label',
  }
};

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

const API_VERSION = 'management.cattle.io/v3';
const KIND = 'RoleTemplate';
const NON_FIELD_KEYS = ['apiVersion', 'kind', 'id', 'type', 'links', 'actions', 'metadata', 'status', 'displayName'];
const NEVER_CLEARED_KEYS = [...NON_FIELD_KEYS, 'context'];

export default class RoleTemplate extends SteveDescriptionModel {
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
    if (this._subtype) {
      return this._subtype;
    }

    if (this.type === SUBTYPE_MAPPING.CLUSTER.type && this.context === SUBTYPE_MAPPING.CLUSTER.context) {
      return SUBTYPE_MAPPING.CLUSTER.key;
    }

    if (this.type === SUBTYPE_MAPPING.NAMESPACE.type && this.context === SUBTYPE_MAPPING.NAMESPACE.context) {
      return SUBTYPE_MAPPING.NAMESPACE.key;
    }

    return null;
  }

  updateSubtype(subtype) {
    this['_subtype'] = subtype;
    this.context = SUBTYPE_MAPPING[subtype].context;
  }

  get default() {
    const defaultKey = SUBTYPE_MAPPING[this.subtype]?.defaultKey;

    return !!this[defaultKey];
  }

  updateDefault(value) {
    const defaultKey = SUBTYPE_MAPPING[this.subtype].defaultKey;

    this[defaultKey] = value;
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

  get canSaveYaml() {
    return true;
  }

  /**
   * Save the role template's YAML through Norman.
   *
   * The YAML must be a RoleTemplate, or saving throws. A field the YAML leaves out is cleared, except the display
   * name and context, which keep their current value (on create, the form's). On create, the labels and annotations
   * that Rancher's controllers own are dropped.
   */
  async saveYaml(yaml) {
    const data = jsyaml.load(yaml);

    if (data?.apiVersion !== API_VERSION || data?.kind !== KIND) {
      throw this.t('resourceYaml.errors.wrongKind', { kind: KIND, apiVersion: API_VERSION });
    }

    const metadata = data.metadata || {};
    const fields = omit(data, NON_FIELD_KEYS);

    Object.entries(this.toJSON()).forEach(([key, value]) => {
      if (!(key in fields) && !NEVER_CLEARED_KEYS.includes(key) && !key.startsWith('_')) {
        fields[key] = typeof value === 'boolean' ? false : null;
      }
    });

    if (!this.id) {
      dropControllerMetadata(metadata);
    }

    const { roleTemplateNames, ...normanFields } = fields;
    const renamed = {
      name:            data.displayName || (!this.id && metadata.name) || undefined,
      roleTemplateIds: roleTemplateNames,
      labels:          metadata.labels || {},
      annotations:     metadata.annotations || {},
    };
    const norman = await this.$dispatch('rancher/clone', { resource: await this.norman }, { root: true });

    Object.assign(norman, normanFields, pickBy(renamed, (value) => value !== undefined));

    return this.saveNorman(norman);
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
      roleContext: this.subtype,
      ...moreQuery
    };

    this.currentRouter().push(location);
  }

  async save() {
    return this.saveNorman(await this.norman);
  }

  saveNorman(norman) {
    for (const rule of norman.rules || []) {
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
