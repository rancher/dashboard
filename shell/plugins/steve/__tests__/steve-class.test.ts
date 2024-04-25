import Steve from '@shell/plugins/steve/steve-class.js';
import { steveClassJunkObject } from './utils/steve-mocks';

describe('class: Steve', () => {
  describe('given custom resource keys', () => {
    const customResource = steveClassJunkObject;

    it('should keep internal keys', () => {
      const steve = new Steve(customResource, {
        getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
        dispatch:    jest.fn(),
        rootGetters: { 'i18n/t': jest.fn() },
      });

      expect({ ...steve }).toStrictEqual(customResource);
    });

    describe('method: save', () => {
      it('should remove all the internal keys', async() => {
        const dispatch = jest.fn();
        const steve = new Steve(customResource, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch,
          rootGetters: { 'i18n/t': jest.fn() },
        });

        const expectation = {
          type:     customResource.type,
          metadata: {
            resourceVersion:            'whatever',
            fields:                     'whatever',
            clusterName:                'whatever',
            deletionGracePeriodSeconds: 'whatever',
            generateName:               'whatever',
          },
          spec: { versions: {} }
        };

        await steve.save();

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
        expect({ ...steve }).toStrictEqual(customResource);
      });
    });
  });
});
