import { _getSchemaGroup, _getSchemaId, pathExistsInSchema, calculatedFields } from '@shell/plugins/steve/resourceUtils/schema';
import { SCHEMA } from '@shell/config/types';
import ResourceCache from '@shell/plugins/steve/caches/resource-class';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

export default class SchemaCache extends ResourceCache {
  constructor(_, getters = {}, rootGetters = {}, __, ___, createCache) {
    super(SCHEMA, getters, rootGetters, null, null, createCache);
    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }

  load(payload = [], callback) {
    Promise.all(this.__requestSubResources())
      .then(() => {
        const preCacheSchemas = payload.map((schema) => {
          return {
            ...schema,
            _id:    _getSchemaId(schema),
            _group: _getSchemaGroup(schema)
          };
        });

        super.load(preCacheSchemas);
        callback();
      });

    return this;
  }

  getSchema(id) {
    return this.resources[id]?.resource;
  }

  pathExistsInSchema(typeParam, path) {
    const type = normalizeType(typeParam);
    const schema = this.getSchema(type);

    return pathExistsInSchema(schema, path, this.getSchema);
  }
}
