import Resource from '@shell/plugins/dashboard-store/resource-class.js';

describe('class: Resource', () => {
  describe('given custom resource keys', () => {
    const customResource = {
      __rehydrate: 'whatever',
      __clone:     'whatever',
    };

    it('should keep internal keys', () => {
      const resource = new Resource(customResource, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect({ ...resource }).toStrictEqual(customResource);
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
        const resource = new Resource(customResource, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch:    jest.fn(),
          rootGetters: { 'i18n/t': jest.fn() },
        });

        const expectation = {};

        await resource.save();

        expect({ ...resource }).toStrictEqual(expectation);
      });
    });
  });
});
