/* eslint-disable jest/max-nested-describe */

import { TYPE_MODES, getters } from '../type-map';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import {
  COUNT,
  SCHEMA,
} from '@shell/config/types';

/**
 * types in the store
 */
const types = {
  virtual: { name: 'virt' },
  spoof:   { name: 'spoof' }
};

const schemas = {
  pod: {
    id:         'pod',
    type:       SCHEMA,
    attributes: { kind: 'pod' },
  },
  /**
   * Represents a group
   */
  podNoAttributes: {
    id:   'pod',
    type: SCHEMA,
  },
  secret: {
    id:         'secret',
    type:       SCHEMA,
    attributes: { kind: 'secret' },
  },
  topLevel: {
    id:   'toplevel',
    type: SCHEMA,
  }
};

/**
 * counts in the store
 */
const counts = {
  pod: {
    summary:    { count: 1 },
    revision:   'abc',
    namespaces: { a: true }
  },
  toplevel: {
    summary:    { count: 1 },
    revision:   'abc',
    namespaces: { a: true }
  },
  secret: {
    summary:    { count: 1 },
    revision:   'abc',
    namespaces: { a: true }
  }
};

/**
 * Some of the objects that we expect to be returned by allTypes
 */
const expectedMenuItems = {
  podWithoutAttribute: {
    label:      'Pod',
    name:       'pod',
    namespaced: true,
    route:      'cde',
    schema:     schemas.podNoAttributes,
    weight:     1,
  },
  podWithAttribute: {
    label:      'Pod',
    name:       'pod',
    namespaced: true,
    route:      'cde',
    schema:     schemas.pod,
    weight:     1,
  },
  secretWithAttribute: {
    label:      'Secret',
    name:       'secret',
    namespaced: true,
    route:      'cde',
    schema:     schemas.secret,
    weight:     1,
  },
  virtual: {
    label:  'virt',
    name:   'virt',
    weight: 1,
  },
  spoof: {
    label:  'spoof',
    name:   'spoof',
    weight: 1,
  },
  topLevel: {
    label:      'Pod',
    mode:       'basic',
    name:       'toplevel',
    namespaced: true,
    route:      'cde',
    schema:     schemas.topLevel,
    weight:     1,
  }
};

describe('type-map', () => {
  describe('getters', () => {
    describe('allTypes', () => {
      /**
       * Stick in the required mode param to the expected menu items
       */
      const setTypeMode = (modes, resourcesById) => {
        return modes.reduce((res, mode) => {
          const newResource = { };

          Object.entries(resourcesById).forEach(([id, resource]: [string, any]) => {
            newResource[id] = {
              ...resource,
              mode,
            };
          });
          res[mode] = newResource;

          return res;
        }, {});
      };

      /** All basic ctx properties and helpers */
      const generateDefaults = (productName = EXPLORER, productStore = 'cluster', modes = [TYPE_MODES.BASIC]) => {
        return {
          productName,
          productStore,

          state: {
            products: [{
              name:    EXPLORER,
              inStore: productStore,
            }],
            virtualTypes: { [productName]: [] },
            spoofedTypes: { [productName]: [] }
          },
          typeMapGetters: {
            labelFor:          (schema, count) => '',
            optionsFor:        (schema) => {},
            groupForBasicType: () => {},
            typeWeightFor:     (label, isBasic) => 1
          },
          rootState:   {},
          rootGetters: {
            [`${ productStore }/all`]: (schema: string) => {
              return [];
            },
            'prefs/get': (pref) => {},

          },

          modes
        };
      };

      /**
       * When there are no schema, spoofed or virtual types there's no menu types
       */
      it('empty', () => {
        const {
          state, typeMapGetters, rootState, rootGetters, productName, modes
        } = generateDefaults();

        const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

        expect(groups).toStrictEqual({});
      });

      describe('product: Explorer', () => {
        /**
         * Extend generateDefaults with env to return a pod type
         */
        const createEnvBasicPod = (modes = [TYPE_MODES.BASIC], expected = true) => {
          const defaults = generateDefaults(EXPLORER, `cluster`, [TYPE_MODES.BASIC]);
          const { typeMapGetters, rootGetters, productStore } = defaults;

          const testRootGetters = {
            ...rootGetters,
            [`${ productStore }/all`]: (resource: string) => {
              switch (resource) {
              case SCHEMA:
                return [schemas.pod];
              case COUNT:
                return [{ counts: { pod: counts.pod } }];
              }

              return [];
            },
          };

          const testTypeMapGetters = {
            ...typeMapGetters,
            labelFor:          (schema, count) => 'Pod',
            groupForBasicType: () => true,
            optionsFor:        (schema) => ({
              namespaced:  true,
              customRoute: 'cde'
            }),
            isFavorite: () => false,
          };

          return {
            ...defaults,
            typeMapGetters: testTypeMapGetters,
            rootGetters:    testRootGetters,

            modes,

            expectedTypes: expected ? setTypeMode(modes, { pod: expectedMenuItems.podWithAttribute }) : {}
          };
        };

        /**
         * Extend generateDefaults with env to return a virtual type
         */
        const createEnvBasicVirtual = (modes = [TYPE_MODES.BASIC], expected = true) => {
          const defaults = generateDefaults();
          const { state, typeMapGetters, productName } = defaults;

          const testState = {
            ...state,
            virtualTypes: { [productName]: [types.virtual] }
          };

          const testTypeMapGetters = {
            ...typeMapGetters,
            groupForBasicType: () => true,
          };

          return {
            ...defaults,
            state:          testState,
            typeMapGetters: testTypeMapGetters,

            modes,

            expectedTypes: expected ? setTypeMode(modes, { virt: expectedMenuItems.virtual }) : {}
          };
        };

        /**
         * Extend generateDefaults with env to return a spoof type
         */
        const createEnvBasicSpoof = (modes = [TYPE_MODES.BASIC], expected = true) => {
          const defaults = generateDefaults();
          const { state, typeMapGetters, productName } = defaults;

          const testState = {
            ...state,
            spoofedTypes: { [productName]: [types.spoof] }
          };

          const testTypeMapGetters = {
            ...typeMapGetters,
            groupForBasicType: () => true,
          };

          return {
            ...defaults,
            state:          testState,
            typeMapGetters: testTypeMapGetters,

            modes,

            expectedTypes: expected ? setTypeMode(modes, { spoof: expectedMenuItems.spoof }) : {}
          };
        };

        describe('mode: BASIC', () => {
          it('one entry', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
            } = createEnvBasicPod();

            const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('one entry (explicitly test basic mode with a schema without `kind`)', () => {
            // This is odd, but it should be clear that in basic mode schemas without a kind are ok)
            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes, productStore
            } = createEnvBasicPod();

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.podNoAttributes];
                case COUNT:
                  return [{ counts: { pod: counts.pod } }];
                }

                return [];
              },
            };

            const groups = getters.allTypes(state, typeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(setTypeMode([TYPE_MODES.BASIC], { pod: expectedMenuItems.podWithoutAttribute }));
          });

          it('no entry (basic but no group)', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
            } = createEnvBasicPod([TYPE_MODES.BASIC], false);

            const testTypeMapGetters = {
              ...typeMapGetters,
              groupForBasicType: (product, id) => false
            };

            const groups = getters.allTypes(state, testTypeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          describe('virtual types', () => {
            it('one entry', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createEnvBasicVirtual();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });

            it('no entry (group not basic)', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createEnvBasicVirtual([TYPE_MODES.BASIC], false);

              const testTypeMapGetters = {
                ...typeMapGetters,
                groupForBasicType: () => false,
              };

              const groups = getters.allTypes(state, testTypeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });
          });

          describe('spoof types', () => {
            it('one entry', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createEnvBasicSpoof();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });

            it('no entry (group not basic)', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createEnvBasicSpoof([TYPE_MODES.BASIC], false);

              const testTypeMapGetters = {
                ...typeMapGetters,
                groupForBasicType: () => false,
              };

              const groups = getters.allTypes(state, testTypeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });
          });
        });

        describe('mode: ALL', () => {
          /**
          * Extend createEnvBasicPod with env to return a pod type for mode TYPE_MODES.ALL
          */
          const createEnvAllPod = (expected = true) => {
            const defaults = createEnvBasicPod([TYPE_MODES.ALL]);
            const { rootGetters, productStore } = defaults;

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.pod];
                case COUNT:
                  return [{ counts: { pod: counts.pod } }];
                }

                return [];
              },
            };

            return {
              ...defaults,
              rootGetters: testRootGetters,

              expectedTypes: expected ? setTypeMode([TYPE_MODES.ALL], { pod: expectedMenuItems.podWithAttribute }) : { }
            };
          };

          /**
          * Extend createEnvBasicVirtual with env to return a virtual type for mode TYPE_MODES.ALL
          */
          const createAllVirtualType = () => {
            return createEnvBasicVirtual([TYPE_MODES.ALL]);
          };

          /**
          * Extend createEnvBasicSpoof with env to return a spoof type for mode TYPE_MODES.ALL
          */
          const createAllSpoofedType = () => {
            return createEnvBasicSpoof([TYPE_MODES.ALL]);
          };

          it('one entry', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
            } = createEnvAllPod();

            const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('no entry (schema without a kind)', () => {
            const {
              state, typeMapGetters, productStore, rootGetters, productName, modes, rootState, expectedTypes
            } = createEnvAllPod(false);

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.podNoAttributes];
                case COUNT:
                  return [{ counts: { pod: counts.pod } }];
                }

                return [];
              },
            };

            const groups = getters.allTypes(state, typeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('no entry (needs rancher cluster)', () => {
            const {
              state, typeMapGetters, rootGetters, productName, modes, rootState, expectedTypes
            } = createEnvAllPod(false);

            const testRootGetters = {
              ...rootGetters,
              isRancher: false
            };

            const testTypeMapGetters = {
              ...typeMapGetters,
              optionsFor: (schema) => ({
                namespaced:       true,
                customRoute:      'cde',
                ifRancherCluster: true
              }),
            };

            const groups = getters.allTypes(state, testTypeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('no entry (shouldn\'t be rancher cluster)', () => {
            const {
              state, typeMapGetters, rootGetters, productName, modes, rootState, expectedTypes
            } = createEnvAllPod(false);

            const testRootGetters = {
              ...rootGetters,
              isRancher: true
            };

            const testTypeMapGetters = {
              ...typeMapGetters,
              optionsFor: (schema) => ({
                namespaced:       true,
                customRoute:      'cde',
                ifRancherCluster: false
              }),
            };

            const groups = getters.allTypes(state, testTypeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('one entry (needs rancher cluster)', () => {
            const {
              state, typeMapGetters, rootGetters, productName, modes, rootState, expectedTypes
            } = createEnvAllPod();

            const testRootGetters = {
              ...rootGetters,
              isRancher: true
            };

            const testTypeMapGetters = {
              ...typeMapGetters,
              optionsFor: (schema) => ({
                namespaced:       true,
                customRoute:      'cde',
                ifRancherCluster: true
              }),
            };

            const groups = getters.allTypes(state, testTypeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('no entry (local only)', () => {
            const {
              state, typeMapGetters, rootGetters, productName, modes, rootState, expectedTypes
            } = createEnvAllPod(false);

            const testRootGetters = {
              ...rootGetters,
              currentCluster: { isLocal: false }
            };

            const testTypeMapGetters = {
              ...typeMapGetters,
              optionsFor: (schema) => ({
                namespaced:  true,
                customRoute: 'cde',
                localOnly:   true
              }),
            };

            const groups = getters.allTypes(state, testTypeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('one entry (local only)', () => {
            const {
              state, typeMapGetters, rootGetters, productName, modes, rootState, expectedTypes
            } = createEnvAllPod();

            const testRootGetters = {
              ...rootGetters,
              currentCluster: { isLocal: true }
            };

            const testTypeMapGetters = {
              ...typeMapGetters,
              optionsFor: (schema) => ({
                namespaced:  true,
                customRoute: 'cde',
                localOnly:   true
              }),
            };

            const groups = getters.allTypes(state, testTypeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          describe('virtual types', () => {
            it('one entry', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createAllVirtualType();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });
          });

          describe('spoof types', () => {
            it('one entry', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createAllSpoofedType();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });
          });
        });

        describe('mode: FAVORITE', () => {
          /**
          * Extend generateDefaults with env to return a pod type for mode TYPE_MODES.FAVORITE
          */
          const generateDefaultsForFavourite = (expected = true) => {
            const defaults = generateDefaults();
            const { typeMapGetters, rootGetters, productStore } = defaults;

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.secret];
                case COUNT:
                  return [{ counts: { secret: counts.secret } }];
                }

                return [];
              },
            };

            const testTypeMapGetters = {
              ...typeMapGetters,
              labelFor:          (schema, count) => 'Secret',
              groupForBasicType: () => true,
              optionsFor:        (schema) => ({
                namespaced:  true,
                customRoute: 'cde'
              }),
              isFavorite: () => true,
            };

            return {
              ...defaults,
              modes:          [TYPE_MODES.FAVORITE],
              typeMapGetters: testTypeMapGetters,
              rootGetters:    testRootGetters,

              expectedTypes: expected ? setTypeMode([TYPE_MODES.FAVORITE], { secret: expectedMenuItems.secretWithAttribute }) : {}
            };
          };

          /**
          * Extend generateDefaultsForFavourite with env to return a virtual type for mode TYPE_MODES.FAVORITE
          */
          const createDefaultsForFavouriteVirtualType = (expected = true) => {
            const defaults = generateDefaults();
            const defaultsFavourites = generateDefaultsForFavourite();
            const { state, productName } = defaultsFavourites;

            const testState = {
              ...state,
              virtualTypes: { [productName]: [types.virtual] }
            };

            return {
              ...defaultsFavourites,
              state:       testState,
              rootGetters: defaults.rootGetters,

              expectedTypes: expected ? setTypeMode([TYPE_MODES.FAVORITE], { virt: expectedMenuItems.virtual }) : {}
            };
          };

          /**
          * Extend generateDefaultsForFavourite with env to return a spoof type for mode TYPE_MODES.FAVORITE
          */
          const createDefaultsForFavouriteSpoofType = (expected = true) => {
            const defaults = generateDefaults();
            const defaultsFavourites = generateDefaultsForFavourite();
            const { state, productName } = defaultsFavourites;

            const testState = {
              ...state,
              spoofedTypes: { [productName]: [types.spoof] }
            };

            return {
              ...defaultsFavourites,
              state:       testState,
              rootGetters: defaults.rootGetters,

              expectedTypes: expected ? setTypeMode([TYPE_MODES.FAVORITE], { spoof: expectedMenuItems.spoof }) : {}
            };
          };

          it('one entry', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
            } = generateDefaultsForFavourite();

            const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('no entry (not favourite)', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
            } = generateDefaultsForFavourite(false);

            const testTypeMapGetters = {
              ...typeMapGetters,
              isFavorite: () => false,
            };

            const groups = getters.allTypes(state, testTypeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          describe('virtual types', () => {
            it('one entry', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createDefaultsForFavouriteVirtualType();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });

            it('no entry (not favourite)', () => {
              const expectedGroups = { };

              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes
              } = createDefaultsForFavouriteVirtualType();

              const testTypeMapGetters = {
                ...typeMapGetters,
                isFavorite: () => false,
              };

              const groups = getters.allTypes(state, testTypeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedGroups);
            });
          });

          describe('spoof types', () => {
            it('one entry', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createDefaultsForFavouriteSpoofType();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });

            it('no entry (not favourite)', () => {
              const {
                state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
              } = createDefaultsForFavouriteSpoofType(false);

              const testTypeMapGetters = {
                ...typeMapGetters,
                isFavorite: () => false,
              };

              const groups = getters.allTypes(state, testTypeMapGetters, rootState, rootGetters)(productName, modes);

              expect(groups).toStrictEqual(expectedTypes);
            });
          });
        });

        describe('mode: USED', () => {
          /**
          * Extend createEnvBasicPod with env to return a pod for mode TYPE_MODES.USED
          */
          const createUsedPod = () => {
            const defaults = createEnvBasicPod([TYPE_MODES.USED]);
            const { rootGetters, productStore } = defaults;

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.pod];
                case COUNT:
                  return [{ counts: { pod: counts.pod } }];
                }

                return [];
              },
            };

            return {
              ...defaults,
              rootGetters: testRootGetters
            };
          };

          it('one entry', () => {
            const expectedGroups = setTypeMode([TYPE_MODES.USED], { pod: expectedMenuItems.podWithAttribute });

            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes
            } = createUsedPod();

            const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedGroups);
          });

          describe('virtual types', () => {
            it('no entry (used not included)', () => {
              const expectedGroups = { };

              const {
                state, typeMapGetters, rootState, rootGetters, productName
              } = createEnvBasicVirtual();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, [TYPE_MODES.USED]);

              expect(groups).toStrictEqual(expectedGroups);
            });
          });

          describe('spoof types', () => {
            it('no entry (used not included)', () => {
              const expectedGroups = { };

              const {
                state, typeMapGetters, rootState, rootGetters, productName
              } = createEnvBasicSpoof();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, [TYPE_MODES.USED]);

              expect(groups).toStrictEqual(expectedGroups);
            });
          });
        });

        describe('mode: multiple', () => {
          // Covers getProductsGroups use cases
          const modes = [TYPE_MODES.BASIC, TYPE_MODES.FAVORITE, TYPE_MODES.USED];

          const createAllOfTheThings = () => {
            const defaults = generateDefaults(EXPLORER, 'cluster', modes);
            const {
              state, typeMapGetters, rootGetters, productName, productStore
            } = defaults;

            const testState = {
              ...state,
              virtualTypes: { [productName]: [types.virtual] },
              spoofedTypes: { [productName]: [types.spoof] }
            };

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.topLevel, schemas.pod, schemas.secret];
                case COUNT:
                  return [{
                    counts: {
                      toplevel: counts.toplevel,
                      pod:      counts.pod,
                      secret:   counts.secret
                    }
                  }];
                }

                return [];
              },
            };

            const testTypeMapGetters = {
              ...typeMapGetters,
              labelFor: (schema, count) => {
                switch (schema.id) {
                case 'secret':
                  return 'Secret';
                default:
                  return 'Pod';
                }
              },
              groupForBasicType: () => true,
              optionsFor:        (schema) => ({
                namespaced:  true,
                customRoute: 'cde'
              }),
              isFavorite: (id) => id === 'secret',
            };

            return {
              ...defaults,
              typeMapGetters: testTypeMapGetters,
              rootGetters:    testRootGetters,
              state:          testState,

              modes,
              expectedTypes: {
                ...setTypeMode([TYPE_MODES.BASIC], {
                  // A resource that's favourite should still appear in the basic side nav
                  // fav: {
                  secret: expectedMenuItems.secretWithAttribute,

                  // A basic resource
                  pod: expectedMenuItems.podWithAttribute,

                  // A top level resource with an invalid schema (no kind)
                  toplevel: expectedMenuItems.topLevel,

                  virt: expectedMenuItems.virtual,

                  spoof: expectedMenuItems.spoof
                }),
                ...setTypeMode([TYPE_MODES.FAVORITE], { secret: expectedMenuItems.secretWithAttribute }),
                ...setTypeMode([TYPE_MODES.USED], {
                  // A resource that's favourite should still appear in the basic side nav
                  secret: expectedMenuItems.secretWithAttribute,
                  // A basic resource
                  pod:    expectedMenuItems.podWithAttribute,
                }),
              }
            };
          };

          it('no entries', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName
            } = generateDefaults(EXPLORER, 'cluster', modes);

            const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual({});
          });

          it('one entry each', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, expectedTypes
            } = createAllOfTheThings();

            const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('limited basic type', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, productStore
            } = createAllOfTheThings();

            const testState = {
              ...state,
              virtualTypes: { },
              spoofedTypes: { }
            };

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.secret];
                case COUNT:
                  return [{ counts: { secret: counts.secret } }];
                }

                return [];
              },
            };

            const testExpectedTypes = {
              ...setTypeMode([TYPE_MODES.BASIC], { secret: expectedMenuItems.secretWithAttribute }),
              ...setTypeMode([TYPE_MODES.FAVORITE], { secret: expectedMenuItems.secretWithAttribute }),
              ...setTypeMode([TYPE_MODES.USED], { secret: expectedMenuItems.secretWithAttribute }),
            };

            const groups = getters.allTypes(testState, typeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(testExpectedTypes);
          });

          it('no favourite type', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, productStore
            } = createAllOfTheThings();

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [schemas.topLevel, schemas.pod];
                case COUNT:
                  return [{
                    counts: {
                      toplevel: counts.toplevel,
                      pod:      counts.pod,
                    }
                  }];
                }

                return [];
              },
            };

            const testExpectedTypes = {
              ...setTypeMode([TYPE_MODES.BASIC], {
                // A basic resource
                pod: expectedMenuItems.podWithAttribute,

                // A top level resource with an invalid schema (no kind)
                toplevel: expectedMenuItems.topLevel,

                virt: expectedMenuItems.virtual,

                spoof: expectedMenuItems.spoof
              }),
              ...setTypeMode([TYPE_MODES.USED], {
                // A basic resource
                pod: expectedMenuItems.podWithAttribute,
              }),
            };

            const groups = getters.allTypes(state, typeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(testExpectedTypes);
          });

          it('no used type / no virtual type', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName
            } = createAllOfTheThings();

            const testState = {
              ...state,
              spoofedTypes: { [productName]: [types.spoof] },
              virtualTypes: { [productName]: [] },
            };

            const testExpectedTypes = {
              ...setTypeMode([TYPE_MODES.BASIC], {
                // A resource that's favourite should still appear in the basic side nav
                // fav: {
                secret: expectedMenuItems.secretWithAttribute,

                // A basic resource
                pod: expectedMenuItems.podWithAttribute,

                // A top level resource with an invalid schema (no kind)
                toplevel: expectedMenuItems.topLevel,

                spoof: expectedMenuItems.spoof
              }),
              ...setTypeMode([TYPE_MODES.FAVORITE], { secret: expectedMenuItems.secretWithAttribute }),
              ...setTypeMode([TYPE_MODES.USED], {
                // A resource that's favourite should still appear in the basic side nav
                secret: expectedMenuItems.secretWithAttribute,
                // A basic resource
                pod:    expectedMenuItems.podWithAttribute,
              }),
            };

            const groups = getters.allTypes(testState, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(testExpectedTypes);
          });

          it('no used type / no spoofed type', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName
            } = createAllOfTheThings();

            const testState = {
              ...state,
              spoofedTypes: { [productName]: [] },
              virtualTypes: { [productName]: [types.virtual] },
            };

            const testExpectedTypes = {
              ...setTypeMode([TYPE_MODES.BASIC], {
                // A resource that's favourite should still appear in the basic side nav
                // fav: {
                secret: expectedMenuItems.secretWithAttribute,

                // A basic resource
                pod: expectedMenuItems.podWithAttribute,

                // A top level resource with an invalid schema (no kind)
                toplevel: expectedMenuItems.topLevel,

                virt: expectedMenuItems.virtual,

              }),
              ...setTypeMode([TYPE_MODES.FAVORITE], { secret: expectedMenuItems.secretWithAttribute }),
              ...setTypeMode([TYPE_MODES.USED], {
                // A resource that's favourite should still appear in the basic side nav
                secret: expectedMenuItems.secretWithAttribute,
                // A basic resource
                pod:    expectedMenuItems.podWithAttribute,
              }),
            };

            const groups = getters.allTypes(testState, typeMapGetters, rootState, rootGetters)(productName, modes);

            expect(groups).toStrictEqual(testExpectedTypes);
          });
        });
      });
    });
  });
});

// getTree - Remove ignored schemas, not-applicable to ns filter
