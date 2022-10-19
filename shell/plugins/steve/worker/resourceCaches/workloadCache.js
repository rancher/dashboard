import WorkloadTypeCache from './workloadTypeCache';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { quickHashObj } from '@shell/utils/crypto';

export default class WorkloadCache extends WorkloadTypeCache {
  constructor(schema, opt, workerMethods) {
    super(schema, opt, workerMethods);
    this.relatedTypes.push(...Object.values(WORKLOAD_TYPES));
    this._extraFields = [
      ...this._extraFields,
      { state: workload => workload.state },
      { showPodRestarts: workload => workload.showPodRestarts },
      { pods: workload => workload.pods },
      { showAsWorkload: workload => workload.showAsWorkload },
      { replicaSetId: workload => workload.replicaSetId }
    ];
  }

  async makeRequest() {
    this._requesting = true;
    await allHash({
      ...this.relatedTypes.reduce((typesIndex, type) => {
        return {
          ...typesIndex,
          [type]: this._getCacheByType(type).then((res) => {
            this._relatedTypeCaches[type] = res;

            return res.asList;
          })
        };
      }, {})
    });
    this._requesting = false;

    const response = Object.keys(this._relatedTypeCaches).filter(relatedType => relatedType !== POD)
      .map((cacheName) => {
        return this._relatedTypeCaches[cacheName].asList;
      }).reduce((combinedList, resourceList) => {
        return [
          ...combinedList,
          ...resourceList
        ];
      }, [])
      .filter(resource => !!resource.showAsWorkload);

    (response || [])
      .map((resource) => {
        return { ...this._extraFields.reduce(this._addExtraField, { ...resource }) };
      })
      .forEach((resource) => {
        this._resourceHashes[resource.id] = quickHashObj(resource);
        this._cache[resource.id] = resource;
      });

    // return { revision: null, data: response };
  }

  syncCollection() {

  }
}
