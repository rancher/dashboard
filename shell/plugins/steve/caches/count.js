// ToDo: do counts get classified in Vuex-land?
import { COUNT } from '@shell/config/types';
import ResourceCache from '@shell/plugins/steve/caches/resource-class';

export default class CountsCache extends ResourceCache {
  constructor() {
    super(COUNT);
  }

  hash(resource) {
    // Given that we only receive delta's for counts now any new message over socket should represent an actual change
    return undefined;
  }

  load(payload = []) {
    this.resources = payload[0];

    return this;
  }

  find() {
    return { data: { data: [this.resources] } };
  }
}
