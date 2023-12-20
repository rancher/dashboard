import Workload from '@shell/models/workload.js';

describe('class: Workload', () => {
  describe('given custom workload keys', () => {
    const customWorkloadType = '123abv';
    const customContainerImage = 'image';
    const customContainer = {
      image:    customContainerImage,
      __active: 'whatever',
      active:   'whatever',
      _init:    'whatever',
      error:    'whatever',
    };
    const customWorkload = {
      type:        customWorkloadType,
      metadata:    { name: 'abc' },
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
          metadata: { name: 'abc' },
          spec:     {
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
        expect(dispatch).toHaveBeenCalledWith('request', { opt, type: customWorkloadType });

        // Original workload model should remain unchanged
        expect({ ...workload }).toStrictEqual(customWorkload);
      });
    });
  });
});
