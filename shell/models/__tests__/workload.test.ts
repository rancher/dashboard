import Workload from '@shell/models/workload.js';

describe('class: Workload', () => {
  describe('given custom workload keys', () => {
    const customContainer = {
      __clone:  'whatever',
      __active: 'whatever',
      __init:   'whatever',
      _init:    'whatever',
      error:    'whatever',
    };
    const customWorkload = {
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
    /**
     * DISCLAIMER ***************************************************************************************
     * Logs are prevented to avoid polluting the test output.
     ****************************************************************************************************
    */
      // eslint-disable-next-line jest/no-hooks
      beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => { });
      });

      it('should remove all the internal keys', async() => {
        const workload = new Workload(customWorkload, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch:    jest.fn(),
          rootGetters: { 'i18n/t': jest.fn() },
        });
        const expectation = { spec: { template: { spec: { containers: [{}], initContainers: [{}] } } } };

        await workload.save();

        expect({ ...workload }).toStrictEqual(expectation);
      });
    });
  });
});
