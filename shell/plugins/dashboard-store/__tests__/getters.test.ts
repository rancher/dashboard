import getters, { urlFor } from '@shell/plugins/dashboard-store/getters';

const { urlOptions } = getters;

describe('dashboard-store: getters', () => {
  describe('dashboard-store > getters > exported function: urlFor', () => {
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
  describe('dashboard-store > getters > urlOptions', () => {
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

    const urlOptionsGetter = urlOptions();

    it('expects urlOptions to return a function', () => {
      expect(typeof urlOptions(state, getters)).toBe('function');
    });
    it('returns undefined when called without params', () => {
      expect(urlOptionsGetter()).toBeUndefined();
    });
    it('returns an unmodified string when called without options', () => {
      expect(urlOptionsGetter('foo')).toBe('foo');
    });
    it('returns an unmodified string when called with options that are not accounted for', () => {
      expect(urlOptionsGetter('foo', { bar: 'baz' })).toBe('foo');
    });
    it('returns an unmodified stringif a single filter statement is applied', () => {
      expect(urlOptionsGetter('foo', { filter: { bar: 'baz' } })).toBe('foo');
    });
    it('returns an unmodified string if a single filter statement is applied', () => {
      expect(urlOptionsGetter('foo', { filter: { bar: 'baz', far: 'faz' } })).toBe('foo');
    });
    it('returns an unmodified string if excludeFields is a single element array with the string "bar"', () => {
      expect(urlOptionsGetter('/v1/foo', { excludeFields: ['bar'] })).toBe('/v1/foo');
    });
    it('returns an unmodified string if excludeFields is an array but the URL doesnt include the "/v1/ string"', () => {
      expect(urlOptionsGetter('foo', { excludeFields: ['bar'] })).toBe('foo');
    });
    it('returns an unmodified string if a limit is provided', () => {
      expect(urlOptionsGetter('foo', { limit: 10 })).toBe('foo');
    });
    it('returns an unmodified string if the sort option is provided', () => {
      expect(urlOptionsGetter('foo', { sortBy: 'bar' })).toBe('foo');
    });
    it('returns an unmodified string if the sort option is provided and an order if sortOrder is provided', () => {
      expect(urlOptionsGetter('foo', { sortBy: 'bar', sortOrder: 'baz' })).toBe('foo');
    });
  });
});
