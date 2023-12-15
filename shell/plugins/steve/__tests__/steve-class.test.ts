import Steve from '@shell/plugins/steve/steve-class.js';

describe('class: Steve', () => {
  describe('given custom resource keys', () => {
    const customResource = {
      __active:                                   'whatever',
      __clone:                                    'whatever',
      __init:                                     'whatever',
      _init:                                      'whatever',
      _type:                                      'whatever',
      'metadata.clusterName':                     'whatever',
      'metadata.creationTimestamp':               'whatever',
      'metadata.deletionGracePeriodSeconds':      'whatever',
      'metadata.deletionTimestamp':               'whatever',
      'metadata.fields':                          'whatever',
      'metadata.finalizers':                      'whatever',
      'metadata.generateName':                    'whatever',
      'metadata.generation':                      'whatever',
      'metadata.initializers':                    'whatever',
      'metadata.managedFields':                   'whatever',
      'metadata.ownerReferences':                 'whatever',
      'metadata.relationships':                   'whatever',
      'metadata.selfLink':                        'whatever',
      'metadata.state':                           'whatever',
      'metadata.uid':                             'whatever',
      'spec.template.metadata.creationTimestamp': 'whatever',
      'spec.versions.schema':                     'whatever',
      // 'metadata.resourceVersion': 'whatever',
      error:                                      'whatever',
      links:                                      'whatever',
      status:                                     'whatever',
      stringData:                                 'whatever',
      type:                                       'whatever',
    };

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
        const steve = new Steve(customResource, {
          getters:     { schemaFor: () => ({ linkFor: jest.fn() }) },
          dispatch:    jest.fn(),
          rootGetters: { 'i18n/t': jest.fn() },
        });

        const expectation = {};

        await steve.save();

        expect({ ...steve }).toStrictEqual(expectation);
      });
    });
  });
});
