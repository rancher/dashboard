import { SCHEMA } from '@/config/types';
import { uniq } from '@/utils/array';
import Vue from 'vue';
import { get } from '@/utils/object';
import { DESCRIPTION } from '@/config/labels-annotations';

export const CATTLE_API_GROUP = '.cattle.io';

export const SUBTYPE_MAPPING = {
  GLOBAL:    {
    key:            'GLOBAL',
    type:           'management.cattle.io.globalrole',
    defaultKey:     'newUserDefault',
    id:             'GLOBAL',
    labelKey:          'rbac.roletemplate.subtypes.GLOBAL.label',
  },
  CLUSTER:   {
    key:            'CLUSTER',
    type:           'management.cattle.io.roletemplate',
    context:        'cluster',
    defaultKey:     'clusterCreatorDefault',
    id:             'CLUSTER',
    labelKey:          'rbac.roletemplate.subtypes.CLUSTER.label',
  },
  NAMESPACE: {
    key:            'NAMESPACE',
    type:           'management.cattle.io.roletemplate',
    context:        'project',
    defaultKey:     'projectCreatorDefault',
    id:             'NAMESPACE',
    labelKey:          'rbac.roletemplate.subtypes.NAMESPACE.label',
  },
  RBAC_ROLE: {
    key:            'RBAC_ROLE',
    type:           'rbac.authorization.k8s.io.role',
    id:             'RBAC_ROLE',
    labelKey:          'rbac.roletemplate.subtypes.RBAC_ROLE.label',
  },
  RBAC_CLUSTER_ROLE: {
    key:            'RBAC_CLUSTER_ROLE',
    type:           'rbac.authorization.k8s.io.clusterrole',
    id:             'RBAC_CLUSTER_ROLE',
    labelKey:          'rbac.roletemplate.subtypes.RBAC_CLUSTER_ROLE.label',
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
    },
    // API returns a blank description property, this overrides our own link to the description
    {
      label:         this.t('resourceDetail.detailTop.description'),
      content:       this.metadata?.annotations?.[DESCRIPTION]
    });

    return out;
  },

  state() {
    return this.locked ? 'locked' : this.metadata?.state?.name || 'unknown';
  },

  subtype() {
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
  },

  updateSubtype() {
    return (subtype) => {
      Vue.set(this, '_subtype', subtype);
      this.context = SUBTYPE_MAPPING[subtype].context;
    };
  },

  default() {
    const defaultKey = SUBTYPE_MAPPING[this.subtype]?.defaultKey;

    return !!this[defaultKey];
  },

  updateDefault() {
    return (value) => {
      const defaultKey = SUBTYPE_MAPPING[this.subtype].defaultKey;

      Vue.set(this, defaultKey, value);
    };
  },

  allResources() {
    return this.$getters['all'](SCHEMA).filter(r => r.attributes?.kind);
  },

  clusterResources() {
    return this.allResources.filter(r => !r.attributes.namespaced && !r.attributes.group.includes(CATTLE_API_GROUP));
  },

  namespaceResources() {
    return this.allResources.filter(r => r.attributes.namespaced && !r.attributes.group.includes(CATTLE_API_GROUP));
  },

  subtypeResources() {
    switch (this.subtype) {
    case SUBTYPE_MAPPING.CLUSTER.key:
      return this.clusterResources;
    case SUBTYPE_MAPPING.NAMESPACE.key:
      return this.namespaceResources;
    }
  },

  resources() {
    return uniq(this.subtypeResources.map(r => r.attributes?.kind)).sort();
  },

  listLocation() {
    return {
      name: `c-cluster-auth-roles`,
      hash: `#${ this.subtype }`
    };
  },

};
