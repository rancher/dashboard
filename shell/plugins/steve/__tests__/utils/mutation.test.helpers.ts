import { POD } from '@shell/config/types';
import Resource from '@shell/plugins/dashboard-store/resource-class';

const createCtx = () => ({
  rootGetters: { 'type-map/optionsFor': (type: string) => ({}) },
  getters:     {
    classify:        (resource: any) => Resource,
    cleanResource:   (existing: Resource, resource: any) => resource,
    keyFieldForType: () => 'id',
  }
});

const create = (type: string) => ({
  id: '1',
  type,
});

const createResource = (type: string, props = {}) => new Resource({
  ...create(type),
  ...props
});

const createPod = () => create(POD);

const createPodResource = (props = {}) => createResource(POD, props);

const createCache = (props: any) => ({
  generation:    0,
  haveAll:       false,
  haveNamespace: undefined,
  havePage:      undefined,
  haveSelector:  {},
  list:          [],
  loadCounter:   0,
  revision:      0,
  map:           new Map(),
  ...props
});

const createNoOp = () => {
  const emptyState = { types: {} };

  return {
    params: [emptyState, {
      ctx:   createCtx(),
      batch: { }
    }],
    expected: { state: emptyState }
  };
};

const loadAllCreateNoOp = () => {
  const emptyState = { types: {} };

  return {
    params: [
      emptyState,
      {
        ctx:  createCtx(),
        type: POD,
        data: [],
      }],
    expected: { state: emptyState }
  };
};

const loadAllCreateNewEntry = () => {
  const pod = createPodResource({ namespace: 'namespace' } );

  return {
    params: [
      { types: { [POD]: createCache({}) } },
      {
        ctx:  createCtx(),
        type: POD,
        data: [pod]
      }
    ],
    expected: {
      types: {
        [POD]: createCache({
          generation: 1,
          list:       [new Resource(pod)],
          map:        new Map([
            [pod.id, new Resource(pod)]
          ])
        })
      },
      podsByNamespace: {},
    }
  };
};

export default {
  createCtx,
  createCache,
  createNoOp,
  createResource,
  createPod,
  createPodResource,
  loadAll: {
    createNewEntry: loadAllCreateNewEntry,
    createNoOp:     loadAllCreateNoOp
  }
};
