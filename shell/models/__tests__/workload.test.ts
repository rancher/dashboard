import Workload from '@shell/models/workload.js';
import { steveClassJunkObject } from '@shell/plugins/steve/__tests__/utils/steve-mocks';

describe('class: Workload', () => {
  describe('given custom workload keys', () => {
    const customContainerImage = 'image';
    const customContainer = {
      image:    customContainerImage,
      __active: 'whatever',
      active:   'whatever',
      _init:    'whatever',
      error:    'whatever',
    };
    const customWorkload = {
      ...steveClassJunkObject,
      type:        '123abv',
      __rehydrate: 'whatever',
      __clone:     'whatever',
      spec:        {
        template: {
          spec: {
            containers:     [customContainer],
            initContainers: [customContainer],
          }
        }
      }
    };

    (customWorkload.metadata as any).name = 'abc';

    it('should keep internal keys', () => {
      const workload = new Workload(customWorkload, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect({ ...workload }).toStrictEqual(customWorkload);
    });

    describe('method: save', () => {
      it('should remove all the internal keys', async() => {
        const dispatch = jest.fn();
        const workload = new Workload(customWorkload, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch,
          rootGetters: {
            'i18n/t':      jest.fn(),
            'i18n/exists': () => true,
          },
        });
        const expectation = {
          metadata: {
            name:                       'abc',
            fields:                     'whatever',
            resourceVersion:            'whatever',
            clusterName:                'whatever',
            deletionGracePeriodSeconds: 'whatever',
            generateName:               'whatever',
          },
          spec: {
            template: {
              spec: {
                containers:     [{ image: customContainerImage }],
                initContainers: [{ image: customContainerImage }]
              }
            }
          }
        };

        await workload.save();

        const opt = {
          data:    expectation,
          headers: {
            accept:         'application/json',
            'content-type': 'application/json',
          },
          method: 'post',
          url:    undefined,
        };

        // Data sent should have been cleaned
        expect(dispatch).toHaveBeenCalledWith('request', { opt, type: customWorkload.type });

        // Original workload model should remain unchanged
        expect({ ...workload }).toStrictEqual(customWorkload);
      });
    });
  });
});
