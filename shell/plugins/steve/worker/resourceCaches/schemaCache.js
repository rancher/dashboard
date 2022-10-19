import ResourceCache from './resourceCache';
import { quickHashObj } from '@shell/utils/crypto';

export default class SchemaCache extends ResourceCache {
  constructor(schema, opt, workerMethods) {
    super(schema, opt, workerMethods);
    this._extraFields = [
      ...this._extraFields,
      { groupName: schema => schema?.attribues?.namespaced ? 'ns' : 'cluster' }
    ];
  }

  syncCollection() {
    this._startWatch();
  }

  loadSchema(schemas) {
    schemas
      .map((schema) => {
        return { ...this._extraFields.reduce(this._addExtraField, { ...schema }) };
      })
      .forEach((schema) => {
        this._resourceHashes[schema.id] = quickHashObj(schema);
        this._cache[schema.id] = schema;
      });
  }
}
