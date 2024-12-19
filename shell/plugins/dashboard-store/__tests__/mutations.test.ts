import { batchChanges, loadAdd } from '@shell/plugins/dashboard-store/mutations.js';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import Resource from '@shell/plugins/dashboard-store/resource-class';
import mutationHelpers from '@shell/plugins/steve/__tests__/utils/mutation.test.helpers';

const {
  createCtx, createCache, createNoOp, createResource, createPod, createPodResource
} = mutationHelpers;

const ctx = createCtx(); // This should be fresh per test.. not sure why it wasn't originally

describe('dashboard-store: mutations', () => {
  describe('batchChanges', () => {
    const createRegister = () => {
      return {
        params: [{ types: {} }, {
          ctx,
          batch: { [POD]: {} }
        }],
        expected: { types: { [POD]: createCache({ generation: 1 }) } }
      };
    };

    const createNewEntry = () => {
      const pod = createPod();

      return {
        params: [
          { types: {} },
          {
            ctx,
            batch: { [POD]: { [pod.id]: pod } }
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
          }
        }
      };
    };

    const createExisting = () => {
      const existingPod = createPodResource();
      const newPod = createPodResource({ change: true });

      return {
        params: [
          {
            types: {
              [POD]: createCache({
                list: [existingPod],
                map:  new Map([
                  [existingPod.id, existingPod]
                ])
              })
            }
          },
          {
            ctx,
            batch: { [POD]: { [newPod.id]: createPodResource({ change: true }) } }
          }
        ],
        expected: {
          types: {
            [POD]: createCache({
              generation: 1,
              list:       [newPod],
              map:        new Map([
                [newPod.id, newPod]
              ])
            })

          },
        }
      };
    };

    const createRemove = () => {
      const existingPod = createPodResource();

      return {
        params: [
          {
            types: {
              [POD]: createCache({
                list: [existingPod],
                map:  new Map([
                  [existingPod.id, existingPod]
                ])
              })
            }
          },
          {
            ctx,
            batch: { [POD]: { [existingPod.id]: {} } }
          }
        ],
        expected: {
          types: {
            [POD]: createCache({
              generation: 1,
              list:       [],
              map:        new Map()
            })
          },
        }
      };
    };

    const createAddRemove = () => {
      const existingPod1 = createPodResource({ id: '1' });
      // const newPod1 = createPodResource({ id: '1', new: true });
      const existingPod2 = createPodResource({ id: '2' });

      return {
        params: [
          {
            types: {
              [POD]: createCache({
                list: [existingPod2],
                map:  new Map([
                  [existingPod2.id, existingPod2]
                ])
              })

            }
          },
          {
            ctx,
            batch: {
              [POD]: {
                [existingPod1.id]: existingPod1,
                [existingPod2.id]: {}
              }
            }
          }
        ],
        expected: {
          types: {
            [POD]: createCache({
              generation: 1,
              list:       [existingPod1],
              map:        new Map([
                [existingPod1.id, existingPod1]
              ])
            })
          },
        }
      };
    };

    const createRemoveAdd = () => {
      const existingPod1 = createPodResource({ id: '1' });
      // const newPod1 = createPodResource({ id: '1', new: true });
      const existingPod2 = createPodResource({ id: '2' });

      return {
        params: [
          {
            types: {
              [POD]: createCache({
                list: [existingPod2],
                map:  new Map([
                  [existingPod2.id, existingPod2]
                ])
              })
            }
          },
          {
            ctx,
            batch: {
              [POD]: {
                [existingPod2.id]: {},
                [existingPod1.id]: existingPod1,
              }
            }
          }
        ],
        expected: {
          types: {
            [POD]: createCache({
              generation: 1,
              list:       [existingPod1],
              map:        new Map([
                [existingPod1.id, existingPod1]
              ])
            })
          },
        }
      };
    };

    const createAddMultipleTypes = () => {
      const pod = createPodResource({ id: '1' });
      const deployment = createResource({ id: '2', type: WORKLOAD_TYPES.DEPLOYMENT });

      return {
        params: [
          {
            types: {
              [POD]: createCache({
                list: [],
                map:  new Map()
              }),
              [WORKLOAD_TYPES.DEPLOYMENT]: createCache({
                list: [],
                map:  new Map()
              })
            }
          },
          {
            ctx,
            batch: {
              [POD]:                       { [pod.id]: pod },
              [WORKLOAD_TYPES.DEPLOYMENT]: { [deployment.id]: deployment }
            }
          }
        ],
        expected: {
          types: {
            [POD]: createCache({
              generation: 1,
              list:       [pod],
              map:        new Map([
                [pod.id, pod]
              ])
            }),
            [WORKLOAD_TYPES.DEPLOYMENT]: createCache({
              generation: 1,
              list:       [deployment],
              map:        new Map([[deployment.id, deployment]])
            })
          },
        }
      };
    };

    const removeNonExisting = () => {
      const pod1 = createPodResource({ id: '1' });
      const pod2 = createPodResource({ id: '2' });

      return {
        params: [
          {
            types: {
              [POD]: createCache({
                list: [pod1],
                map:  new Map([[pod1.id, pod1]])
              }),
            }
          },
          {
            ctx,
            batch: { [POD]: { [pod2.id]: {} } }
          }
        ],
        expected: {
          types: {
            [POD]: createCache({
              generation: 1,
              list:       [pod1],
              map:        new Map([[pod1.id, pod1]])
            }),
          },
        }
      };
    };

    const muchMuchChange = () => {
      const pod1NoChange = createPodResource({ id: '1' });

      const pod2Add = createPodResource({ id: '2' });
      const pod3Remove = createPodResource({ id: '3' });
      const pod4RemoveNoneExistant = createPodResource({ id: '4' });
      const pod5Add = createPodResource({ id: '5' });
      const pod6Original = createPodResource({ id: '6' });
      const pod6WithChange = createPodResource({ id: '6', change: true }); // Cannot be same reference
      const pod6WithChangeRef = createPodResource({ id: '6', change: true });

      expect(pod6Original.id).toBe('6');
      expect(pod6WithChange.id).toBe('6');
      expect(pod6WithChangeRef.id).toBe('6');

      return {
        params: [
          {
            types: {
              [POD]: createCache({
                list: [pod1NoChange, pod3Remove, pod6Original],
                map:  new Map([
                  [pod1NoChange.id, pod1NoChange],
                  [pod3Remove.id, pod3Remove],
                  [pod6Original.id, pod6Original],
                ])
              }),
            }
          },
          {
            ctx,
            batch: {
              [POD]: {
                [pod2Add.id]:                pod2Add,
                [pod3Remove.id]:             {},
                [pod4RemoveNoneExistant.id]: {},
                [pod5Add.id]:                pod5Add,
                [pod6WithChangeRef.id]:      pod6WithChange // Cannot be same reference,
              },
            }
          }
        ],
        expected: {
          types: {
            [POD]: createCache({
              generation: 1,
              list:       [pod1NoChange, pod6WithChangeRef, pod2Add, pod5Add], // Order important
              map:        new Map([
                [pod1NoChange.id, pod1NoChange],
                [pod2Add.id, pod2Add],
                [pod5Add.id, pod5Add],
                [pod6WithChangeRef.id, pod6WithChangeRef],

              ])
            }),
          },
        }
      };
    };

    it.each([['No change', createNoOp()]])('%s', (_, run) => {
      batchChanges(...run.params);

      expect(run.params[0]).toStrictEqual(run.expected.state);
    });

    it.each([
      ['Register the type', createRegister()],
      ['Add a new pod', createNewEntry()],
      ['Change a pod', createExisting()],
      ['Remove a pod', createRemove()],
      ['Create one pod, remove another', createAddRemove()],
      ['Remove one pod, create another', createRemoveAdd()],
      ['Add multiple types', createAddMultipleTypes()],
      ['Remove a non-existing pod', removeNonExisting()],
      ['Much much change', muchMuchChange()],
    ])('%s', (_, run) => { // eslint-disable-line jest/no-identical-title
      batchChanges(...run.params);
      // Don't do straight up run.params[0] vs run.expected.... map doesn't get 'provided' so check fails
      Object.entries(run.params[0].types).forEach(([type, cache]) => {
        const { map: cacheMap, ...cacheState } = cache;
        const { map: expectedMap, ...expected } = run.expected.types[type];

        expect(cacheMap).toBeDefined();
        expect(expectedMap).toBeDefined();

        expect(cacheState).toStrictEqual(expected);
        expect(cacheMap).toStrictEqual(expectedMap);
      });
    });
  });

  describe('loadAdd', () => {
    it.each([['No change', mutationHelpers.loadAll.createNoOp()]])('%s', (_, run) => {
      loadAdd(...run.params);

      expect(run.params[0]).toStrictEqual(run.expected.state);
    });

    it.each([
      ['Add a new pod', mutationHelpers.loadAll.createNewEntry()],
    ])('%s', (_, run) => { // eslint-disable-line jest/no-identical-title
      run.expected.types[POD].havePage = false;

      loadAdd(...run.params);
      const { map: cacheMap, ...cacheState } = run.params[0].types?.[POD] || {};
      const { map: expectedMap, ...expected } = run.expected.types?.[POD];

      expect(cacheMap).toBeDefined();
      expect(expectedMap).toBeDefined();

      expect(cacheState).toStrictEqual(expected);
      expect(cacheMap).toStrictEqual(expectedMap);
    });
  });
});
