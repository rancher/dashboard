import _getters from '@shell/plugins/steve/getters';

const { urlFor, urlOptions, pathExistsInSchema } = _getters;

describe('steve: getters:', () => {
  describe('urlFor', () => {
    // we're not testing function output based off of state or getter inputs here since they are dependencies
    const baseUrl = '/v1';
    const collectionUrl = 'https://abc.com/v1/urlFoo';
    const namespace = 'myNamespace';
    const state = { config: { baseUrl } };
    const getters = {
      normalizeType: (type: string) => type,
      schemaFor:     (type: string) => {
        if (type === 'rType') {
          return { links: { collection: collectionUrl } };
        }
        if (type === 'trailingforwardslash') {
          return { links: { collection: `${ collectionUrl }/` } };
        }
      },
      // this has its own tests so it just returns the input string
      urlOptions: (url: string, opt: any, type: string) => {
        if (opt.addParam) {
          url += '?param=true';
        }

        return url;
      }
    };

    const urlForGetter = urlFor(state, getters);

    // most tests for this getter will go through the dashboard-store getters test spec, this only tests logic specific to the steve variant

    it.each([
      ['rType', undefined, undefined, collectionUrl],

      // No namespace
      ['rType', undefined, { }, `${ collectionUrl }`],
      ['rType', undefined, { addParam: true }, `${ collectionUrl }?param=true`],
      ['rType', 'abc', { }, `${ collectionUrl }/abc`],
      ['rType', 'abc', { addParam: true }, `${ collectionUrl }/abc?param=true`],

      // With namespace
      ['rType', undefined, { namespaced: `${ namespace }` }, `${ collectionUrl }/${ namespace }`],
      ['rType', undefined, { addParam: true, namespaced: `${ namespace }` }, `${ collectionUrl }/${ namespace }?param=true`],
      ['rType', 'abc', { namespaced: `${ namespace }` }, `${ collectionUrl }/${ namespace }/abc`],
      ['rType', 'abc', { addParam: true, namespaced: `${ namespace }` }, `${ collectionUrl }/${ namespace }/abc?param=true`],

      // With url (mostly no op)
      ['rType', undefined, { url: `${ baseUrl }/urlFoo`, namespaced: `${ namespace }` }, `${ baseUrl }/urlFoo`],
      ['rType', undefined, { url: `${ baseUrl }/urlFoo/abc`, namespaced: `${ namespace }` }, `${ baseUrl }/urlFoo/abc`],
      ['rType', undefined, { url: `/urlFoo`, namespaced: `${ namespace }` }, `/urlFoo`],
      ['rType', undefined, { url: `/urlFoo/abc`, namespaced: `${ namespace }` }, `/urlFoo/abc`],

      // multiple namespaces (no op)
      ['rType', undefined, { namespaced: [`${ namespace }`, 'nsBaz'] }, `${ collectionUrl }`],

      // handle trailing space
      ['trailingforwardslash', undefined, { namespaced: `${ namespace }` }, `${ collectionUrl }/${ namespace }`],

    ])("given type '%p', id '%p' and opt '%p', should get url '%p'", (type, id, opt, url) => {
      expect(urlForGetter(type, id, opt)).toBe(url);
    });
  });

  describe('urlOptions', () => {
    // we're not testing function output based off of state or getter inputs here since they are dependencies
    const state = { config: { baseUrl: 'protocol' } };
    const getters = {
      normalizeType: (type) => type,
      // this has its own tests so it just returns the input string
      urlOptions:    (string) => string
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
    it('returns a string with an exclude statement for "bar" if excludeFields is a single element array with the string "bar" and the url starts with "/v1/"', () => {
      expect(urlOptionsGetter('/v1/foo', { excludeFields: ['bar'] })).toBe('/v1/foo?exclude=bar');
    });
    it('returns a string without an exclude statement for "managedFields" if omitExcludeFields includes it and the url starts with "/v1/"', () => {
      expect(urlOptionsGetter('/v1/foo', { omitExcludeFields: ['metadata.managedFields'] })).toBe('/v1/foo?');
    });
    it('returns a string without an exclude statement if excludeFields is set but the url does not start with "/v1/"', () => {
      expect(urlOptionsGetter('foo', { excludeFields: ['bar'] })).toBe('foo');
    });
    it('returns a string without an exclude statement if excludeFields is an array but the URL doesn\'t include the "/v1/ string"', () => {
      expect(urlOptionsGetter('foo', { excludeFields: ['bar'] })).toBe('foo');
    });
    it('returns a string with a limit applied if a limit is provided', () => {
      expect(urlOptionsGetter('foo', { limit: 10 })).toBe('foo?limit=10');
    });
    it('returns a string with a sorting criteria if the sort option is provided', () => {
      expect(urlOptionsGetter('foo', { sortBy: 'bar' })).toBe('foo?sort=bar');
    });
    it('returns a string with a sorting criteria formatted for steve if the sort option is provided and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { sortBy: 'bar' })).toBe('/v1/foo?sort=bar&exclude=metadata.managedFields');
    });
    it('returns a string with a sorting criteria if the sort option is provided and an order if sortOrder is provided', () => {
      expect(urlOptionsGetter('foo', { sortBy: 'bar', sortOrder: 'baz' })).toBe('foo?sort=bar&order=baz');
    });
    it('returns a string with a sorting criteria formatted for steve if the sort option is provided and an order if sortOrder is provided and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { sortBy: 'bar', sortOrder: 'baz' })).toBe('/v1/foo?sort=bar&exclude=metadata.managedFields');
    });
    it('returns a string with a sorting criteria formatted for steve if the sort option is provided and an order if sortOrder is "desc" and the url starts with "/v1"', () => {
      expect(urlOptionsGetter('/v1/foo', { sortBy: 'bar', sortOrder: 'desc' })).toBe('/v1/foo?sort=-bar&exclude=metadata.managedFields');
    });
  });

  describe('pathExistsInSchema', () => {
    const state = {};

    const getters = { schemaFor: (type: string) => ({}) };

    it('expects pathExistsInSchema to return a function', () => {
      expect(typeof pathExistsInSchema(state, getters)).toBe('function');
    });

    describe('resourceFields', () => {
      it('requires resourceFields but no resourceFields', () => {
        expect(pathExistsInSchema(state, {
          ...getters,
          schemaFor: () => ({
            requiresResourceFields: true,
            hasResourceFields:      false,
          })
        })()).toBe(false);
      });

      it('requires resourceFields but empty resourceFields', () => {
        expect(pathExistsInSchema(state, {
          ...getters,
          schemaFor: () => ({
            requiresResourceFields: true,
            hasResourceFields:      true,
            schemaDefinitions:      {}
          })
        })('', 'name')).toBe(false);
      });

      it('requires resourceFields and has resourceFields', () => {
        expect(pathExistsInSchema(state, {
          ...getters,
          schemaFor: () => ({
            requiresResourceFields: true,
            hasResourceFields:      true,
            resourceFields:         { name: { type: 'string' } },
            schemaDefinitions:      { name: { } },
          })
        })('n/a', 'name')).toBe(true);
      });

      it('requires nested resourceFields and has resourceFields', () => {
        expect(pathExistsInSchema(state, {
          ...getters,
          schemaFor: (type) => {
            const metadata = { resourceFields: { name: { type: 'string' } } };

            switch (type) {
            case 'root':
              return {
                requiresResourceFields: true,
                hasResourceFields:      true,
                resourceFields:         { metadata: { type: 'metadata' } },
                schemaDefinitions:      { metadata: { ...metadata } },
              };
            case 'metadata':
              return {
                requiresResourceFields: true,
                hasResourceFields:      true,
                ...metadata,
              };
            }
            expect(type).toBe('Something known');
          }
        })('root', 'metadata.name')).toBe(true);
      });
    });
  });
});
