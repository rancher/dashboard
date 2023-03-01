import { _getSchemaGroup, _getSchemaId } from '@shell/plugins/steve/schema.utils';
import { SCHEMA } from '@shell/config/types';
import ResourceCache from '@shell/plugins/steve/caches/resourceCache';

export default class SchemaCache extends ResourceCache {
  constructor() {
    super(SCHEMA);
    this.preCacheFields = {
      ...this.preCacheFields,
      _id:    _getSchemaId,
      _group: _getSchemaGroup
    };
  }

  getSchema(id) {
    return this.resources[id].resource;
  }
}
