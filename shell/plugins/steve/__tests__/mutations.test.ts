import mutations from '@shell/plugins/steve/mutations.js';
import { POD } from '@shell/config/types';
import Resource from '@shell/plugins/dashboard-store/resource-class';
import mutationHelpers from '@shell/plugins/steve/__tests__/utils/mutation.test.helpers';

describe('steve-store: mutations', () => {
  describe('loadAdd', () => {
    const createNewEntry = () => {
      const res = mutationHelpers.loadAll.createNewEntry();
      const pod = res.params[1].data[0];

      res.params[0].podsByNamespace = {};
      res.expected.podsByNamespace = {
        [pod.namespace]: {
          list: [new Resource(pod)],
          map:  new Map([
            [pod.id, new Resource(pod)]
          ]),
        }
      };
      res.expected.types[POD].havePage = false;

      return res;
    };

    it.each([['No change', mutationHelpers.loadAll.createNoOp()]])('%s', (_, run) => {
      mutations.loadAdd(...run.params);

      expect(run.params[0]).toStrictEqual(run.expected.state);
    });

    it.each([
      ['Add a new pod', createNewEntry()],
    ])('%s', (_, run) => { // eslint-disable-line jest/no-identical-title
      mutations.loadAdd(...run.params);
      const { map: cacheMap, ...cacheState } = run.params[0].types?.[POD] ;
      const cachePodsByNamespace = run.params[0].podsByNamespace ;
      const { map: expectedMap, ...expected } = run.expected.types?.[POD];
      const expectedPodsByNamespace = run.expected.podsByNamespace ;

      expect(cacheMap).toBeDefined();
      expect(expectedMap).toBeDefined();

      expect(cacheState).toStrictEqual(expected);
      expect(cacheMap).toStrictEqual(expectedMap);

      expect(cachePodsByNamespace).toStrictEqual(expectedPodsByNamespace);
    });
  });
});
