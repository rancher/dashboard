import ResourceCache from '@shell/plugins/steve/caches/resource-class';

export default class Cache extends ResourceCache {
  constructor(type, resourceRequest, cacheFieldGetters = {}) {
    super(type, resourceRequest, cacheFieldGetters);
  }
}
