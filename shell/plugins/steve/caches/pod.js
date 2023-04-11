import WorkloadServiceCache from '@shell/plugins/steve/caches/workload.service';
import { calculatedFields } from '@shell/plugins/steve/resourceUtils/pod';

export default class PodCache extends WorkloadServiceCache {
  namespaceIndex = {};
  constructor(type, getters, rootGetters, api, uiApi, createCache) {
    super(type, getters, rootGetters, api, uiApi, createCache);

    this.calculatedFields = [
      ...this.calculatedFields,
      ...calculatedFields
    ];
  }

  byNamespace(namespace) {
    return this.byIds(this.namespaceIndex[namespace], {});
  }

  load(payload = [], { namespace, selector, id } = {}, revision, links) {
    const indexer = (pod) => {
      if (!(this.namespaceIndex[pod.namespace] || []).includes(pod.id)) {
        this.namespaceIndex = {
          ...this.namespaceIndex,
          [pod.namespace]: [
            ...this.namespaceIndex[pod.namespace] || [],
            pod.id
          ]
        };
      }
    };

    super.load(payload, {
      namespace, selector, id
    }, revision, links, indexer);

    return this;
  }
}
