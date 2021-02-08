import { uniq } from '@/utils/array';
import Vue from 'vue';
import { SCHEMA } from '@/config/types';

export const SUBTYPE_MAPPING = {
  GLOBAL:    {
    key:            'GLOBAL',
    type:           'management.cattle.io.globalrole',
    groupSortOrder: 0,
    defaultKey:     'newUserDefault',
    id:             'GLOBAL',
    labelKey:          'rbac.roletemplate.subtypes.GLOBAL.label',
    bannerAbbrvKey:    'rbac.roletemplate.subtypes.GLOBAL.abbreviation',
  },
  CLUSTER:   {
    key:            'CLUSTER',
    type:           'management.cattle.io.roletemplate',
    context:        'cluster',
    groupSortOrder: 1,
    defaultKey:     'clusterCreatorDefault',
    id:             'CLUSTER',
    labelKey:          'rbac.roletemplate.subtypes.CLUSTER.label',
    bannerAbbrvKey:    'rbac.roletemplate.subtypes.CLUSTER.abbreviation',
  },
  NAMESPACE: {
    key:            'NAMESPACE',
    type:           'management.cattle.io.roletemplate',
    context:        'project',
    groupSortOrder: 2,
    defaultKey:     'projectCreatorDefault',
    id:             'NAMESPACE',
    labelKey:          'rbac.roletemplate.subtypes.NAMESPACE.label',
    bannerAbbrvKey:    'rbac.roletemplate.subtypes.NAMESPACE.abbreviation',
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

const GLOBAL_GROUP = '.cattle.io';

export const SUBTYPES = uniq(Object.values(SUBTYPE_MAPPING).map(mapping => mapping.type));

export function copyResourceValues(from, to) {
  to.context = from.context;
  to.metadata = from.metadata;
  to.rules = from.rules;
  to.roleTemplateIds = from.roleTemplateIds;
  to.builtin = from.builtin;
  to.locked = from.locked;
  to.displayName = from.displayName;

  Object.values(SUBTYPE_MAPPING).forEach((mapping) => {
    to[mapping.defaultKey] = from[mapping.defaultKey];
  });
}

export default {
  save() {
    return async() => {
      let template;

      if (this.template) {
        template = this.$rootGetters['cluster/byId'](this.template.type, this.template.id);
      } else {
        const newTemplate = {
          type:        SUBTYPE_MAPPING[this.subtype].type,
          displayName: this.name,
          builtin:     false
        };

        template = await this.$dispatch('cluster/create', newTemplate, { root: true });
      }

      copyResourceValues(this, template);
      await template.save();

      return {};
    };
  },

  canCustomEdit() {
    return true;
  },

  subtype() {
    if (this._subtype) {
      return this._subtype;
    }

    if (this.template?.type === SUBTYPE_MAPPING.GLOBAL.type) {
      return SUBTYPE_MAPPING.GLOBAL.key;
    }

    if (this.template?.type === SUBTYPE_MAPPING.CLUSTER.type && this.context === SUBTYPE_MAPPING.CLUSTER.context) {
      return SUBTYPE_MAPPING.CLUSTER.key;
    }

    if (this.template?.type === SUBTYPE_MAPPING.NAMESPACE.type && this.context === SUBTYPE_MAPPING.NAMESPACE.context) {
      return SUBTYPE_MAPPING.NAMESPACE.key;
    }

    return null;
  },

  subtypeDisplay() {
    if (!this.subtype) {
      return this.t(`rbac.roletemplate.subtypes.noContext.label`);
    }

    return this.t(`rbac.roletemplate.subtypes.${ this.subtype }.label`);
  },

  subtypeSort() {
    if (!this.subtype) {
      return Object.keys(SUBTYPE_MAPPING).length;
    }

    return SUBTYPE_MAPPING[this.subtype].groupSortOrder;
  },

  updateSubtype() {
    return (subtype) => {
      Vue.set(this, '_subtype', subtype);
      if (SUBTYPE_MAPPING[subtype].key !== SUBTYPE_MAPPING.GLOBAL.key) {
        this.context = SUBTYPE_MAPPING[subtype].context;
      }
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

  globalResources() {
    return this.allResources.filter(r => r.attributes.group.includes(GLOBAL_GROUP));
  },

  clusterResources() {
    return this.allResources.filter(r => !r.attributes.namespaced && !r.attributes.group.includes(GLOBAL_GROUP));
  },

  namespaceResources() {
    return this.allResources.filter(r => r.attributes.namespaced && !r.attributes.group.includes(GLOBAL_GROUP));
  },

  subtypeResources() {
    switch (this.subtype) {
    case SUBTYPE_MAPPING.CLUSTER.key:
      return this.clusterResources;
    case SUBTYPE_MAPPING.NAMESPACE.key:
      return this.namespaceResources;
    default:
      return this.globalResources;
    }
  },

  resources() {
    return uniq(this.subtypeResources.map(r => r.attributes?.kind)).sort();
  }
};
