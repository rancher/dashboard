import { SCHEMA, COUNT } from '@shell/config/types';
import { keyFieldFor, normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { addSchemaIndexFields } from '@shell/plugins/steve/schema.utils';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';
import { matches } from '@shell/utils/selector';

export default class ResourceCache {
  resources = {};
  type;
  keyField;
  constructor(type) {
    this.type = normalizeType(type === 'counts' ? COUNT : type);
    this.keyField = keyFieldFor(this.type);
  }

  /*
  ** Checks new hash against existing hash and updates it if different, returns boolean indicating if a change was made
  */
  __updateCache(resource) {
    const resourceKey = resource[this.keyField];
    const existingResourceHash = this.resources[resourceKey]?.hash;
    const newResourceHash = hashObj(resource);

    if (existingResourceHash !== newResourceHash) {
      this.resources[resourceKey] = { hash: newResourceHash, resource };

      return true;
    }

    return false;
  }

  /*
  ** Adds any new fields to a resource prior to caching based off of the functions in the 'preCacheFields' array above
  */
  __addPreCacheFields(resource) {
    const newFields = {};

    this.preCacheFields.forEach((fieldFunc) => {
      if (fieldFunc.name && fieldFunc instanceof Function) {
        newFields[fieldFunc.name] = fieldFunc(resource);
      }
    });

    return Object.assign({}, resource, newFields);
  }

  load(collection = []) {
    this.resources = {};
    for (let i = 0; i < collection.length; i++) {
      const resource = collection[i];

      if ( this.type === SCHEMA ) {
        addSchemaIndexFields(resource);
      }
      const id = resource[this.keyField];

      // Store the hash instead of the whole object. This means longer load time be reduces memory footprint
      // Perf Note: 3.328125 ms to load ~2500 schemas as objects into cache
      // Perf Note: 67.450927734375 ms to load ~2500 schemas as hashes into cache
      this.resources[id] = hashObj(resource);
    }
    // console.timeEnd('startSchemaLoads!!!');

    const resourceArray = Object.values(this.resources).map((resource) => {
      return resource.resource;
    });

    return resourceArray;
  }

  find({ namespace, id, selector }) {
    if (id) {
      return [this.resources[id].resource];
    }

    const filterConditions = [];

    if (namespace) {
      filterConditions.push(resource => resource.metadata.namespace === namespace);
    }
    if (selector) {
      filterConditions.push(resource => matches(resource, selector));
    }

    if (filterConditions.length === 0) {
      return Object.values(this.resources).map(resource => resource.resource);
    }

    return Object.values(this.resources)
      .map(resource => resource.resource)
      .filter((resource) => {
        return filterConditions.every(condition => condition(resource));
      });
  }

  change(resource, callback) {
    if ( this.type === SCHEMA ) {
      addSchemaIndexFields(resource);
    }

    const existingResourceHash = this.resources[resource[this.keyField]] || {};
    const newResourceHash = hashObj(resource);

    if (existingResourceHash !== newResourceHash) {
      this.resources[resource[this.keyField]] = resource;
      callback();
    }
  }

  create(resource, callback) {
    // ToDo: the logic for create is identical to change in these caches but the worker doesn't know that
    this.change(resource, callback);
  }

  remove(id, callback) {
    if (this.resources[id]) {
      delete this.resources[id];
      callback();
    }
  }
}
