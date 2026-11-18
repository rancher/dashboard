import { POD } from '@shell/config/types';
import Resource from '@shell/plugins/dashboard-store/resource-class';

type TestResource = Resource & { id: string; type: string };

interface TestCache {
  generation: number;
  haveAll: boolean;
  haveNamespace?: string;
  havePage?: boolean;
  haveSelector: Record<string, unknown>;
  list: Resource[];
  loadCounter: number;
  revision: number;
  map: Map<string, Resource>;
}

interface TestState {
  types: Record<string, TestCache>;
}

const createCtx = () => ({
  rootGetters: { 'type-map/optionsFor': (type: string) => ({}) },
  getters:     {
    classify:        (resource: any) => Resource,
    cleanResource:   (existing: Resource, resource: any) => resource,
    keyFieldForType: () => 'id',
  }
});

type TestCtx = ReturnType<typeof createCtx>;

/**
 * A fixture for a mutation test. `params` is spread straight into the mutation,
 * so it has to be a tuple rather than an array.
 */
export interface MutationFixture<Payload, Expected> {
  params: [TestState, Payload];
  expected: Expected;
}

/** `batchChanges` payload: a map of type to the resources changing within it. */
export interface BatchPayload {
  ctx: TestCtx;
  batch: Record<string, Record<string, unknown>>;
}

interface LoadAddPayload {
  ctx: TestCtx;
  type: string;
  data: (TestResource & { namespace: string })[];
}

interface ExpectedNoChange { state: TestState }

/** The mutation is expected to leave a given cache behind for each type. */
export interface ExpectedCaches {
  types: Record<string, TestCache>;
  podsByNamespace?: Record<string, { list: Resource[]; map: Map<string, Resource> }>;
}

const create = (type: string) => ({
  id: '1',
  type,
});

/**
 * The generic keeps whatever `props` adds on the returned type, so a caller
 * asking for `{ namespace }` gets a resource that has one.
 */
const createResource = <T extends Record<string, unknown>>(type: string, props: T = {} as T): TestResource & T => new Resource({
  ...create(type),
  ...props
}) as TestResource & T;

const createPod = () => create(POD);

const createPodResource = <T extends Record<string, unknown>>(props: T = {} as T): TestResource & T => createResource(POD, props);

const createCache = (props: Partial<TestCache>): TestCache => ({
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

const createNoOp = (): MutationFixture<BatchPayload, ExpectedNoChange> => {
  const emptyState = { types: {} };

  return {
    params: [emptyState, {
      ctx:   createCtx(),
      batch: { }
    }],
    expected: { state: emptyState }
  };
};

const loadAllCreateNoOp = (): MutationFixture<LoadAddPayload, ExpectedNoChange> => {
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

const loadAllCreateNewEntry = (): MutationFixture<LoadAddPayload, ExpectedCaches> => {
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
