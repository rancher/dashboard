import ExternalCache from '@shell/plugins/steve/caches/externalCache';
import { labelFor, _findColumnByName, _rowValueGetter } from '@shell/plugins/steve/storeUtils/type-map';

export default class TypeMapCache extends ExternalCache {
  load(data) {
    super.load(data);

    this.rootGetters['type-map/labelFor'] = labelFor(
      { typeMappings: this.byId('typeMappings', false) },
      null,
      null,
      this.rootGetters
    );

    this.rootGetters['type-map/rowValueGetter'] = (schema, colName) => {
      const col = _findColumnByName(schema, colName);

      return _rowValueGetter(col);
    };
  }
}
