import { compare } from '@/utils/parse-k8s-version';
import { eachLimit } from '@/utils/promise-limit';
import Definition from '@/models/Definition';

export const state = function() {
  return {
    versions:    {},
    paths:       {},
    resources:   [],
    definitions: {},
    loaded:      false,
  };
};

export const getters = {
  getResource: state => (name) => {
    const lcName = name.toLowerCase();

    return state.resources.find((x) => {
      return x.name.toLowerCase() === lcName;
    });
  }
};

export const mutations = {
  loaded(state) {
    state.loaded = true;
  },

  // eslint-disable-next-line object-curly-newline
  setVersions(state, { versions, paths }) {
    state.versions = versions;
    state.paths = paths;
  },

  setResources(state, resources) {
    state.resources = resources;
  },

  setDefinitions(state, def) {
    state.definitions = def;
  }
};

export const actions = {
  async loadAll({ state, dispatch, commit }) {
    if (!state.loaded) {
      await Promise.all([
        (async function() {
          await dispatch('loadRoot');
          await dispatch('loadGroups');
        })(),

        dispatch('loadDefinitions'),
      ]);
      await commit('loaded');
    }
  },

  async loadRoot({ state, commit, $axios }) {
    const roots = (await this.$axios.get('/')).data;
    const versions = {};
    const paths = {};

    roots.paths.forEach((path) => {
      const [base, group, version] = path.replace(/^\/+/, '').split('/');

      if (base === 'api') {
        versions[base] = group;
        paths[base] = path;
      } else if (base === 'apis' && group && version) {
        if (paths[group]) {
          if (compare(version, versions[group]) > 0) {
            versions[group] = version;
            paths[group] = path;
          }
        } else {
          versions[group] = version;
          paths[group] = path;
        }
      }
    });

    commit('setVersions', { versions, paths });
  },

  async loadGroups({ state, commit }) {
    const $axios = this.$axios;
    const resources = [];

    await eachLimit(Object.keys(state.paths), 10, loadGroup);
    commit('setResources', resources);

    async function loadGroup(group) {
      const response = await $axios.get(state.paths[group]);

      response.data.resources.forEach((resource) => {
        readResource(group, resource);
      });
    }

    function readResource(group, res) {
      // Skip subresources
      if (res.name.includes('/')) {
        return;
      }

      res.basePath = `${ state.paths[group] }/${ res.name }`;
      res.resourcePath = `${ state.paths[group] }/${ res.name }/{name}`;
      res.listPath = res.basePath;

      if (res.namespaced) {
        res.namespacedPath = `${ state.paths[group] }/namespaces/{namespace}/${ res.name }`;
        res.resourcePath = `${ res.namespacedPath }/{name}`;
        res.listPath = res.namespacedPath;
      }

      res.group = group;
      res.groupVersion = state.versions[group];

      resources.push(res);
    }
  },

  async loadDefinitions({ state, commit }) {
    const response = await this.$axios.request('/openapi/v2');
    let schemas = response.data;
    const definitions = {};

    if (typeof schemas === 'string') {
      schemas = JSON.parse(schemas);
    }

    Object.keys(schemas.definitions).forEach((key) => {
      const obj = new Definition(schemas.definitions[key]);

      obj.setKey(key);
      definitions[key] = obj;
    });

    commit('setDefinitions', definitions);
  },
};

/*
class K8s {

  async loadNamespaces() {
    const namespaceResource = this.resources.find((x) => {
      return x.name === 'namespaces' && x.group === 'api';
    });

    const response = await this.ctx.$axios.get(namespaceResource.basePath);
    const namespaces = response.data.items;

    this.namespaces = namespaces;
  }
}

export default (ctx, inject) => {
  const k8s = new K8s(ctx);

  ctx.$k8s = k8s;
  inject('k8s', k8s);
};
*/
