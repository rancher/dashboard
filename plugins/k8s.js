import { compare } from '@/utils/parse-k8s-version';
import { eachLimit } from '@/utils/promise-limit';
import Definition from '@/models/Definition';

class K8s {
  constructor(ctx) {
    this.ctx = ctx;
    this.versions = {};
    this.paths = {};
    this.resources = [];
    this.definitions = {};
    this.loaded = false;
  }

  async loadAll() {
    if (!this.loaded) {
      this.loaded = true;
      await this.loadRoot();
      await this.loadGroups();
      await this.loadDefinitions();
      await this.loadNamespaces();
    }
  }

  async loadRoot() {
    const roots = (await this.ctx.$axios.get('/')).data;

    roots.paths.forEach((path) => {
      const [base, group, version] = path.replace(/^\/+/, '').split('/');

      if (base === 'api') {
        this.versions[base] = group;
        this.paths[base] = path;
      } else if (base === 'apis' && group && version) {
        if (this.paths[group]) {
          if (compare(version, this.versions[group]) > 0) {
            this.versions[group] = version;
            this.paths[group] = path;
          }
        } else {
          this.versions[group] = version;
          this.paths[group] = path;
        }
      }
    });
  }

  async loadGroups() {
    await eachLimit(Object.keys(this.paths), 10, async(group) => {
      await this._loadGroup(group);
    },);
  }

  async _loadGroup(group) {
    const response = await this.ctx.$axios.get(this.paths[group]);

    response.data.resources.forEach((resource) => {
      this._readResource(group, resource);
    });
  }

  _readResource(group, res) {
    // Skip subresources
    if (res.name.includes('/')) {
      return;
    }

    res.basePath = `${ this.paths[group] }/${ res.name }`;
    res.resourcePath = `${ this.paths[group] }/${ res.name }/{name}`;
    res.listPath = res.basePath;

    if (res.namespaced) {
      res.namespacedPath = `${ this.paths[group] }/namespaces/{namespace}/${ res.name }`;
      res.resourcePath = `${ res.namespacedPath }/{name}`;
      res.listPath = res.namespacedPath;
    }

    res.group = group;
    res.groupVersion = this.versions[group];
    this.resources.push(res);
  }

  async loadDefinitions() {
    const response = await this.ctx.$axios.request('/openapi/v2');
    let schemas = response.data;

    if (typeof schemas === 'string') {
      schemas = JSON.parse(schemas);
    }

    Object.keys(schemas.definitions).forEach((key) => {
      const obj = new Definition(schemas.definitions[key]);

      obj.setKey(key);
      this.definitions[key] = obj;
    });
  }

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
