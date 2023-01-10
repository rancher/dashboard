import { SCHEMA, COUNT } from '@shell/config/types';
import { keyFieldFor, normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { addSchemaIndexFields } from '@shell/models/schema';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';

export default class ResourceCache {
  resources = {};
  type;
  keyField;
  constructor(type) {
    this.type = normalizeType(type === 'counts' ? COUNT : type);
    this.keyField = keyFieldFor(this.type);
  }

  load(collection = []) {
    // console.time('startSchemaLoads!!!');
    // ToDo: SM 3.328125 ms to load ~2500 schemas on my machine
    for (let i = 0; i < collection.length; i++) {
      const resource = collection[i];

      if ( this.type === SCHEMA ) {
        addSchemaIndexFields(resource);
      }
      const id = resource[this.keyField];

      this.resources[id] = resource;
    }
    // console.timeEnd('startSchemaLoads!!!');

    return this;
  }

  change(resource, callback) {
    if ( this.type === SCHEMA ) {
      addSchemaIndexFields(resource);
    }

    const existingResourceHash = hashObj(this.resources[resource[this.keyField]] || {});
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
