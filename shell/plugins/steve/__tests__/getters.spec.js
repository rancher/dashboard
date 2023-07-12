import _getters from '@shell/plugins/steve/getters';

const { urlFor } = _getters;

describe('dashboard-store: getters', () => {
  describe('dashboard-store > getters > urlFor', () => {
    // we're not testing function output based off of state or getter inputs here since they are dependencies
    const state = { config: { baseUrl: 'protocol' } };
    const getters = {
      normalizeType: (type) => type,
      schemaFor:     (type) => {
        if (type === 'typeFoo') {
          return { links: { collection: 'urlFoo' } };
        }
      },
      // this has its own tests so it just returns the input string
      urlOptions: (string) => string
    };

    const urlForGetter = urlFor(state, getters);

    // most tests for this getter will go through the dashboard-store getters test spec, this only tests logic specific to the steve variant

    it('expects urlFor to return a function', () => {
      expect(typeof urlFor(state, getters)).toBe('function');
    });

    it('expects function returned by urlFor to return a string a type', () => {
      expect(urlForGetter('typeFoo')).toBe('protocol/urlFoo');
    });

    it('expects function returned by urlFor to return a string containing a namespace when provided with a type and a single namespace string', () => {
      expect(urlForGetter('typeFoo', undefined, { namespaced: 'nsBar' })).toBe('protocol/urlFoo/nsBar');
    });

    it('expects function returned by urlFor to return a string not containing a namespace when provided with a type and a multiple namespaces string', () => {
      expect(urlForGetter('typeFoo', undefined, { namespaced: ['nsBar', 'nsBaz'] })).toBe('protocol/urlFoo');
    });
  });
});
