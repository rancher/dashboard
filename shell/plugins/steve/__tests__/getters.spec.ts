import _getters from '@shell/plugins/steve/getters';

const { urlFor, urlOptions } = _getters;

describe('steve: getters', () => {
  describe('steve > getters > urlFor', () => {
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

  describe('steve > getters > urlOptions', () => {
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
    it('returns a string with a single filter statement applied if a single filter statement is applied', () => {
      expect(urlOptionsGetter('foo', { filter: { bar: 'baz' } })).toBe('foo?bar=baz');
    });
    it('returns a string with a single filter statement applied and formatted for steve if a single filter statement is applied and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { filter: { bar: 'baz' } })).toBe('/v1/foo?filter=bar=baz&exclude=metadata.managedFields');
    });
    it('returns a string with a single filter statement applied and formatted for steve if a single filter statement is applied and the url starts with "/k8s/clusters/c-m-n4x45x4b/v1/"', () => {
      expect(urlOptionsGetter('/k8s/clusters/c-m-n4x45x4b/v1/foo', { filter: { bar: 'baz' } })).toBe('/k8s/clusters/c-m-n4x45x4b/v1/foo?filter=bar=baz&exclude=metadata.managedFields');
    });
    it('returns a string with a multiple filter statements applied if a single filter statement is applied', () => {
      expect(urlOptionsGetter('foo', { filter: { bar: 'baz', far: 'faz' } })).toBe('foo?bar=baz&far=faz');
    });
    it('returns a string with a multiple filter statements applied and formatted for steve if a single filter statement is applied and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { filter: { bar: 'baz', far: 'faz' } })).toBe('/v1/foo?filter=bar=baz&far=faz&exclude=metadata.managedFields');
    });
    it('returns a string with a labelSelector and formatted for steve if the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { labelSelector: 'a=b' })).toBe('/v1/foo?labelSelector=a=b&exclude=metadata.managedFields');
    });
    it('returns a string with a labelSelector and filter, and formatted for steve if the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { labelSelector: 'a=b', filter: { bar: 'baz', far: 'faz' } })).toBe('/v1/foo?labelSelector=a=b&filter=bar=baz&far=faz&exclude=metadata.managedFields');
    });
    it('returns a string with an exclude statement for "bar" and "metadata.managedFields" if excludeFields is a single element array with the string "bar" and the url starts with "/v1/"', () => {
      expect(urlOptionsGetter('/v1/foo', { excludeFields: ['bar'] })).toBe('/v1/foo?exclude=bar&exclude=metadata.managedFields');
    });
    it('returns a string without an exclude statement if excludeFields is but the url does not start with "/v1/"', () => {
      expect(urlOptionsGetter('foo', { excludeFields: ['bar'] })).toBe('foo');
    });
    it('returns a string without an exclude statement if excludeFields is an array but the URL doesnt include the "/v1/ string"', () => {
      expect(urlOptionsGetter('foo', { excludeFields: ['bar'] })).toBe('foo');
    });
    it('returns a string with a limit applied if a limit is provided', () => {
      expect(urlOptionsGetter('foo', { limit: 10 })).toBe('foo?limit=10');
    });
    it('returns a string with a sorting criteria if the sort option is provided', () => {
      expect(urlOptionsGetter('foo', { sortBy: 'bar' })).toBe('foo?sort=bar');
    });
    it('returns a string with a sorting criteria formatted for steve if the sort option is provided and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { sortBy: 'bar' })).toBe('/v1/foo?exclude=metadata.managedFields&sort=bar');
    });
    it('returns a string with a sorting criteria if the sort option is provided and an order if sortOrder is provided', () => {
      expect(urlOptionsGetter('foo', { sortBy: 'bar', sortOrder: 'baz' })).toBe('foo?sort=bar&order=baz');
    });
    it('returns a string with a sorting criteria formatted for steve if the sort option is provided and an order if sortOrder is provided and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { sortBy: 'bar', sortOrder: 'baz' })).toBe('/v1/foo?exclude=metadata.managedFields&sort=bar');
    });
    it('returns a string with a sorting criteria formatted for steve if the sort option is provided and an order if sortOrder is "desc" and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { sortBy: 'bar', sortOrder: 'desc' })).toBe('/v1/foo?exclude=metadata.managedFields&sort=-bar');
    });
  });
});
