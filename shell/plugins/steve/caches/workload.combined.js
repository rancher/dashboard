import WorkloadCache from '@shell/plugins/steve/caches/workload';
import { WORKLOAD_TYPES } from '~/shell/config/types';
import { CACHE_STATES } from '@shell/plugins/steve/caches/base-cache';
import { waitFor } from '@shell/utils/async';

export default class WorkloadCombinedCache extends WorkloadCache {
  async request(params = {}) {
    const allRequests = await Promise
      .all(Object.values(WORKLOAD_TYPES)
        .map((cacheName) => {
          const cache = this.getters.caches[cacheName] || this.createCache(cacheName);

          if (![CACHE_STATES.REQUESTING, CACHE_STATES.LOADING].includes(cache.state)) {
            return cache.request({ ...params, type: cacheName })
              .then((res) => {
                return res;
              });
          }

          return waitFor(() => ![CACHE_STATES.REQUESTING, CACHE_STATES.LOADING].includes(cache.state) &&
            !cache.cacheIsInvalid({ ...params, type: cacheName })
          );
        }))
      .then((responses) => {
        return responses.filter(workloadType => workloadType).flat(2);
      });

    return allRequests;
  }

  resourceList() {
    return Object.values(WORKLOAD_TYPES).reduce((acc, cacheType) => {
      return [
        ...acc,
        ...this.getters.caches[cacheType]
          .resourceList()
          .filter(({ wholeResource }) => !wholeResource.ownedByWorkload)
      ];
    }, []);
  }

  byId(id, wholeResource = true) {
    const cacheType = Object.values(WORKLOAD_TYPES).find(type => this.getters.caches[type].byId(id));

    return this.getters.caches[cacheType].byId(id, wholeResource);
  }

  byIds(ids, wholeResource = true) {
    return Object.values(WORKLOAD_TYPES).reduce((acc, cacheType) => {
      return [
        ...acc,
        ...this.getters.caches[cacheType].byIds(ids, wholeResource)
      ];
    }, []);
  }
}
