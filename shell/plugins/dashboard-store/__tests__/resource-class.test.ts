import Resource from '@shell/plugins/dashboard-store/resource-class.js';
import { resourceClassJunkObject } from '@shell/plugins/dashboard-store/__tests__/utils/store-mocks';

describe('class: Resource', () => {
  describe('given custom resource keys', () => {
    const customResource = resourceClassJunkObject;

    it('should keep internal keys', () => {
      const resource = new Resource(customResource, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect({ ...resource }).toStrictEqual(customResource);
    });

    describe('method: save', () => {
      it('should remove all the internal keys', async() => {
        const dispatch = jest.fn();
        const resource = new Resource(customResource, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch,
          rootGetters: { 'i18n/t': jest.fn() },
        });

        const expectation = { type: customResource.type };

        await resource.save();

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
        expect(dispatch).toHaveBeenCalledWith('request', { opt, type: customResource.type });

        // Original workload model should remain unchanged
        expect({ ...resource }).toStrictEqual(customResource);
      });
    });
  });
});
