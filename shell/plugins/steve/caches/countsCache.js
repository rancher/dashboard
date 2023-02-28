import { COUNT } from '@shell/config/types';
import ResourceCache from '@shell/plugins/steve/caches/resourceCache';

export default class CountsCache extends ResourceCache {
  constructor() {
    super(COUNT);
  }

  hash(resource) {
    // Given that we only receive delta's for counts now any new message over socket should represent an actual change
    return undefined;
  }
}
