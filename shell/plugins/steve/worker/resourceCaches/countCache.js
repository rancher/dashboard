import ResourceCache from './resourceCache';
import { quickHashObj } from '@shell/utils/crypto';

export default class CountCache extends ResourceCache {
  constructor(schema, opt, workerMethods) {
    super(schema, opt, workerMethods);

    this.extraFields = {}; // counts doesn't need extra fields and it's big so we don't want to waste the time
  }

  syncCollection() {
    this._startWatch();
  }

  loadCount(count) {
    count
      .forEach((count) => {
        this._resourceHashes[count.id] = quickHashObj(count);
        this._cache[count.id] = count;
      });
  }
}
