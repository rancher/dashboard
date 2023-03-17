import { _getSchemaGroup, _getSchemaId, pathExistsInSchema } from '@shell/plugins/steve/resourceUtils/schema';
import { SCHEMA } from '@shell/config/types';
import ResourceCache from '@shell/plugins/steve/caches/resource-class';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

export default class SchemaCache extends ResourceCache {
  constructor(_, resourceRequest, cacheFieldGetters = {}) {
    super(SCHEMA, resourceRequest, cacheFieldGetters);
    this.preCacheFields = {
      ...this.preCacheFields,
      _id:    _getSchemaId,
      _group: _getSchemaGroup
    };
    this.calculatedFields = [];
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
