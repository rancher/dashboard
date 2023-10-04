/* eslint-disable jest/max-nested-describe */

import {
  ALL, BASIC, FAVORITE, getters, USED
} from '../type-map';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import {
  CATALOG,
  COUNT,
  SCHEMA,
  MANAGEMENT,
  NAMESPACE
} from '@shell/config/types';

describe('type-map', () => {
  describe('getters', () => {
    describe('allTypes', () => {
      /** All basic ctx properties and helpers */
      const generateDefaults = (productName = EXPLORER, productStore = 'cluster', modes = BASIC) => {
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

      it('empty', () => {
        const {
          state, typeMapGetters, rootState, rootGetters, productName, modes
        } = generateDefaults();

        const expectedGroups = { };

        const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, modes);

        expect(groups).toStrictEqual(expectedGroups);
      });

      describe('product: Explorer', () => {
        /**
         * Extend generateDefaults with env to return a pod type
         */
        const createEnvBasicPod = (modes = BASIC, expected = true) => {
          const defaults = generateDefaults(EXPLORER, `cluster`, BASIC);
          const {
            state, typeMapGetters, rootGetters, productName, productStore
          } = defaults;

          const testRootGetters = {
            ...rootGetters,
            [`${ productStore }/all`]: (resource: string) => {
              switch (resource) {
              case SCHEMA:
                return [{
                  id:   'pod',
                  type: SCHEMA
                }];
              case COUNT:
                return [{
                  counts: {
                    pod: {
                      summary:    { count: 1 },
                      revision:   'abc',
                      namespaces: { a: true }
                    }
                  }
                }];
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

            expectedTypes: expected ? {
              pod: {
                byNamespace: { a: true },
                count:       1,
                label:       'Pod',
                mode:        modes,
                name:        'pod',
                namespaced:  true,
                revision:    'abc',
                route:       'cde',
                schema:      {
                  id:   'pod',
                  type: 'schema',
                },
                weight: 1,
              }
            } : {}
          };
        };

        /**
         * Extend generateDefaults with env to return a virtual type
         */
        const createEnvBasicVirtual = (modes = BASIC, expected = true) => {
          const defaults = generateDefaults();
          const { state, typeMapGetters, productName } = defaults;

          const testState = {
            ...state,
            virtualTypes: { [productName]: [{ name: 'virt' }] }
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

            expectedTypes: expected ? {
              virt: {
                label:  'virt',
                mode:   modes,
                name:   'virt',
                weight: 1,
              }
            } : {}
          };
        };

        /**
         * Extend generateDefaults with env to return a spoof type
         */
        const createEnvBasicSpoof = (modes = BASIC, expected = true) => {
          const defaults = generateDefaults();
          const { state, typeMapGetters, productName } = defaults;

          const testState = {
            ...state,
            spoofedTypes: { [productName]: [{ name: 'spoof' }] }
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

            expectedTypes: expected ? {
              spoof: {
                label:  'spoof',
                mode:   modes,
                name:   'spoof',
                weight: 1,
              }
            } : {}
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
              state, typeMapGetters, rootState, rootGetters, productName, modes, productStore, expectedTypes
            } = createEnvBasicPod();

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [{
                    id:   'pod',
                    type: SCHEMA
                  }];
                case COUNT:
                  return [{
                    counts: {
                      pod: {
                        summary:    { count: 1 },
                        revision:   'abc',
                        namespaces: { a: true }
                      }
                    }
                  }];
                }

                return [];
              },
            };

            const groups = getters.allTypes(state, typeMapGetters, rootState, testRootGetters)(productName, modes);

            expect(groups).toStrictEqual(expectedTypes);
          });

          it('no entry (basic but no group)', () => {
            const {
              state, typeMapGetters, rootState, rootGetters, productName, modes, expectedTypes
            } = createEnvBasicPod(BASIC, false);

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
              } = createEnvBasicVirtual(BASIC, false);

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
              } = createEnvBasicSpoof(BASIC, false);

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
          * Extend createEnvBasicPod with env to return a pod type for mode ALL
          */
          const createEnvAllPod = (expected = true) => {
            const defaults = createEnvBasicPod(ALL);
            const { rootGetters, productStore } = defaults;

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [{
                    id:         'pod',
                    type:       SCHEMA,
                    attributes: { kind: 'pod' },
                  }];
                case COUNT:
                  return [{
                    counts: {
                      pod: {
                        summary:    { count: 1 },
                        revision:   'abc',
                        namespaces: { a: true }
                      }
                    }
                  }];
                }

                return [];
              },
            };

            return {
              ...defaults,
              rootGetters: testRootGetters,

              expectedTypes: expected ? {
                pod: {
                  byNamespace: { a: true },
                  count:       1,
                  label:       'Pod',
                  mode:        ALL,
                  name:        'pod',
                  namespaced:  true,
                  revision:    'abc',
                  route:       'cde',
                  schema:      {
                    id:         'pod',
                    type:       SCHEMA,
                    attributes: { kind: 'pod' },
                  },
                  weight: 1,
                }
              } : { }
            };
          };

          /**
          * Extend createEnvBasicVirtual with env to return a virtual type for mode ALL
          */
          const createAllVirtualType = () => {
            return createEnvBasicVirtual(ALL);
          };

          /**
          * Extend createEnvBasicSpoof with env to return a spoof type for mode ALL
          */
          const createAllSpoofedType = () => {
            return createEnvBasicSpoof(ALL);
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
                  return [{
                    id:   'pod',
                    type: SCHEMA,
                  }];
                case COUNT:
                  return [{
                    counts: {
                      pod: {
                        summary:    { count: 1 },
                        revision:   'abc',
                        namespaces: { a: true }
                      }
                    }
                  }];
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
          * Extend generateDefaults with env to return a pod type for mode FAVORITE
          */
          const generateDefaultsForFavourite = (expected = true) => {
            const defaults = generateDefaults();
            const { typeMapGetters, rootGetters, productStore } = defaults;

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [{
                    id:         'pod',
                    type:       SCHEMA,
                    attributes: { kind: 'pod' },
                  }];
                case COUNT:
                  return [{
                    counts: {
                      pod: {
                        summary:    { count: 1 },
                        revision:   'abc',
                        namespaces: { a: true }
                      }
                    }
                  }];
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
              isFavorite: () => true,
            };

            return {
              ...defaults,
              modes:          FAVORITE,
              typeMapGetters: testTypeMapGetters,
              rootGetters:    testRootGetters,

              expectedTypes: expected ? {
                pod: {
                  byNamespace: { a: true },
                  count:       1,
                  label:       'Pod',
                  mode:        FAVORITE,
                  name:        'pod',
                  namespaced:  true,
                  revision:    'abc',
                  route:       'cde',
                  schema:      {
                    id:         'pod',
                    type:       SCHEMA,
                    attributes: { kind: 'pod' },
                  },
                  weight: 1,
                }
              } : {}
            };
          };

          /**
          * Extend generateDefaultsForFavourite with env to return a virtual type for mode FAVORITE
          */
          const createDefaultsForFavouriteVirtualType = (expected = true) => {
            const defaults = generateDefaults();
            const defaultsFavourites = generateDefaultsForFavourite();
            const { state, productName } = defaultsFavourites;

            const testState = {
              ...state,
              virtualTypes: { [productName]: [{ name: 'virt' }] }
            };

            return {
              ...defaultsFavourites,
              state:       testState,
              rootGetters: defaults.rootGetters,

              expectedTypes: expected ? {
                virt: {
                  label:  'virt',
                  mode:   FAVORITE,
                  name:   'virt',
                  weight: 1,
                }
              } : {}
            };
          };

          /**
          * Extend generateDefaultsForFavourite with env to return a spoof type for mode FAVORITE
          */
          const createDefaultsForFavouriteSpoofType = (expected = true) => {
            const defaults = generateDefaults();
            const defaultsFavourites = generateDefaultsForFavourite();
            const { state, productName } = defaultsFavourites;

            const testState = {
              ...state,
              spoofedTypes: { [productName]: [{ name: 'spoof' }] }
            };

            return {
              ...defaultsFavourites,
              state:       testState,
              rootGetters: defaults.rootGetters,

              expectedTypes: expected ? {
                spoof: {
                  label:  'spoof',
                  mode:   FAVORITE,
                  name:   'spoof',
                  weight: 1,
                }
              } : {}
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
          * Extend createEnvBasicPod with env to return a pod for mode USED
          */
          const createUsedPod = () => {
            const defaults = createEnvBasicPod(USED);
            const { rootGetters, productStore } = defaults;

            const testRootGetters = {
              ...rootGetters,
              [`${ productStore }/all`]: (resource: string) => {
                switch (resource) {
                case SCHEMA:
                  return [{
                    id:         'pod',
                    type:       SCHEMA,
                    attributes: { kind: 'pod' }
                  }];
                case COUNT:
                  return [{
                    counts: {
                      pod: {
                        summary:    { count: 1 },
                        revision:   'abc',
                        namespaces: { a: true }
                      }
                    }
                  }];
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
            const expectedGroups = {
              pod: {
                byNamespace: { a: true },
                count:       1,
                label:       'Pod',
                mode:        USED,
                name:        'pod',
                namespaced:  true,
                revision:    'abc',
                route:       'cde',
                schema:      {
                  id:         'pod',
                  type:       'schema',
                  attributes: { kind: 'pod' }
                },
                weight: 1,
              }
            };

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

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, USED);

              expect(groups).toStrictEqual(expectedGroups);
            });
          });

          describe('spoof types', () => {
            it('no entry (used not included)', () => {
              const expectedGroups = { };

              const {
                state, typeMapGetters, rootState, rootGetters, productName
              } = createEnvBasicSpoof();

              const groups = getters.allTypes(state, typeMapGetters, rootState, rootGetters)(productName, USED);

              expect(groups).toStrictEqual(expectedGroups);
            });
          });
        });
      });
    });
  });
});
