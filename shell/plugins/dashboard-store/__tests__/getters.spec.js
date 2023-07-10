import { urlFor } from '@shell/plugins/dashboard-store/getters';

describe('dashboard-store: getters', () => {
  describe('dashboard-store > getters > exported function: urlFor', () => {
    // we're not testing function output based off of state or getter inputs here since they are dependencies
    const state = { config: { baseUrl: 'protocol' } };
    const getters = {
      normalizeType: type => type,
      schemaFor:     (type) => {
        if (type === 'typeFoo') {
          return { links: { collection: 'urlFoo' } };
        }
      },
      // this has its own tests so it just returns the input string
      urlOptions: string => string
    };

    const urlForGetter = urlFor(state, getters);

    it('expects urlFor to return a function', () => {
      expect(typeof urlFor(state, getters)).toBe('function');
    });

    it('expects function returned by urlFor to return a string', () => {
      expect(urlForGetter('typeFoo')).toBe('protocol/urlFoo');
    });

    it('expects function returned by urlFor to return a the url supplied as opt.url directly', () => {
      expect(urlForGetter('typeFoo', null, { url: 'urlBar' })).toBe('protocol/urlBar');
    });

    it('expects function returned by urlFor to return a the url to not receive an additional protocol if relative url', () => {
      expect(urlForGetter('typeFoo', null, { url: '/urlBar' })).toBe('/urlBar');
    });

    it('expects function returned by urlFor to return a the url to to not receive an additional protocol if the url starts with "http"', () => {
      expect(urlForGetter('typeFoo', null, { url: 'http urlBar' })).toBe('http urlBar');
    });

    it('expects function returned by urlFor to throw an error if passed an invalid type', () => {
      expect(() => urlForGetter('typeBaz')).toThrow('Unknown schema for type: typeBaz');
    });

    it('expects function returned by urlFor to append an id to the url if one is supplied', () => {
      expect(urlForGetter('typeFoo', 'idBar')).toBe('protocol/urlFoo/idBar');
    });
  });
});
