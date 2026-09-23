import {
  DSL, state as typeMapState, getters as typeMapGetters, mutations as typeMapMutations, TYPE_MODES
} from '@shell/store/type-map';
import { PluginProduct } from '@shell/core/plugin-products';
import { IExtension } from '@shell/core/types';
import { ProductChild, ProductChildGroup } from '@shell/core/plugin-products-external';
import { SCHEMA } from '@shell/config/types';

/**
 * The other plugin-products suites mock the DSL and assert which calls were made. That catches
 * registration mistakes but says nothing about the side menu the user ends up with, because the
 * shape of the nav tree only emerges once type-map's `allTypes` and `getTree` have run over those
 * registrations. These tests close that gap: they register a product through the real DSL into a
 * real type-map state and assert the resulting tree.
 */

jest.mock('@shell/utils/router', () => ({ filterLocationValidParams: (_router: any, route: any) => route }));

const PRODUCT = 'myprod';

const schemaFor = (id: string) => ({
  id,
  type:       SCHEMA,
  attributes: {
    kind: id, resource: id, group: 'test.io'
  },
  links: {}
});

/**
 * A type-map store with only the surface `DSL`, `allTypes` and `getTree` touch, wired to the real
 * state/getters/mutations so registration and tree building behave as they do in the app.
 */
function createTypeMapHarness(presentSchemaIds: string[] = []) {
  const state: any = typeMapState();
  const schemas = presentSchemaIds.map(schemaFor);

  const rootGetters: any = {
    'i18n/current':         () => 'en',
    'i18n/default':         () => 'en',
    'i18n/exists':          () => false,
    'i18n/t':               (key: string) => key,
    'prefs/get':            () => false,
    'features/get':         () => true,
    'management/all':       (type: string) => (type === SCHEMA ? schemas : []),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    'management/count':     () => 0,
    'management/schemaFor': (type: string) => schemas.find((s) => s.id === type),
    productId:              PRODUCT,
    currentStore:           () => 'management',
    currentCluster:         { isLocal: true },
    isRancher:              true,
  };

  // type-map getters call each other, so they have to be resolved lazily against this same object
  const getters: any = {};

  Object.keys(typeMapGetters).forEach((key) => {
    Object.defineProperty(getters, key, {
      enumerable: true,
      get:        () => (typeMapGetters as any)[key](state, getters, { $router: {} } as any, rootGetters),
    });
  });

  const store: any = {
    state,
    getters: new Proxy({}, {
      has: () => true,
      get: (_target, prop: string) => (prop.startsWith('type-map/') ? getters[prop.replace('type-map/', '')] : rootGetters[prop]),
    }),
    commit: (name: string, payload: any) => (typeMapMutations as any)[name.replace('type-map/', '')](state, payload),
  };

  return { getters, store };
}

function createPlugin(): IExtension {
  return {
    _registerTopLevelProduct:   jest.fn(),
    addRoute:                   jest.fn(),
    enableServerSidePagination: jest.fn(),
    DSL:                        (store: any, name: string) => DSL(store, name),
  } as any as IExtension;
}

/** Register `config` as a new product and return the basic-mode side menu tree it produces */
function navTreeFor(config: ProductChild[], presentSchemaIds: string[] = []) {
  const { getters, store } = createTypeMapHarness(presentSchemaIds);
  const plugin = createPlugin();

  new PluginProduct(plugin, { name: PRODUCT, label: 'My Prod' }, config).apply(plugin, store);

  const basicTypes = getters.allTypes(PRODUCT, [TYPE_MODES.BASIC])[TYPE_MODES.BASIC] || {};

  return getters.getTree(PRODUCT, TYPE_MODES.BASIC, basicTypes, 'local', null, null);
}

/** Collapse a tree to `{ name, overview, children }` so assertions read like the rendered menu */
function summarise(nodes: any[]): any[] {
  return (nodes || []).map((node) => ({
    name:     node.name,
    overview: !!node.overview,
    ...(node.children ? { children: summarise(node.children) } : {}),
  }));
}

const CERTIFICATE = 'test.io.certificate';
const CLUSTER_ISSUER = 'test.io.clusterissuer';

describe('product registration nav tree', () => {
  describe('group overview placement', () => {
    it('should place a root group overview inside its own group', () => {
      const config: ProductChildGroup[] = [
        {
          name:      'certmanager',
          label:     'Cert Manager',
          component: { name: 'Overview' },
          sideMenu:  { children: [{ type: CERTIFICATE }] },
        },
      ];

      expect(summarise(navTreeFor(config, [CERTIFICATE]))).toStrictEqual([
        {
          name:     'myprod-certmanager',
          overview: false,
          children: [
            { name: CERTIFICATE, overview: false },
            { name: 'myprod-certmanager', overview: true },
          ],
        },
      ]);
    });

    // A nested group used to register its overview under its parent's path. `getTree` walks types
    // shortest key first, so depending on how the sibling keys sorted the overview either swallowed
    // the nested group or landed beside it as a duplicate name - and `Group.vue`, which looks for
    // the overview among a group's children, found nothing either way.
    const NESTED_OVERVIEW = { name: 'myprod-certmanager-advanced', overview: true };

    // the two cases differ only in how `_sortGroup` orders the overview against its sibling
    it.each([
      [
        'a custom page',
        {
          name: 'leaf', label: 'Leaf', component: { name: 'Leaf' }
        },
        [NESTED_OVERVIEW, { name: 'myprod-certmanager-advanced-leaf', overview: false }],
      ],
      [
        'a resource page',
        { type: CLUSTER_ISSUER },
        [{ name: CLUSTER_ISSUER, overview: false }, NESTED_OVERVIEW],
      ],
    ])('should place a nested group overview inside its own group when its sibling is %s', (_label, nestedChild, expectedNestedChildren) => {
      const config: ProductChildGroup[] = [
        {
          name:      'certmanager',
          label:     'Cert Manager',
          component: { name: 'Overview' },
          sideMenu:  {
            children: [
              {
                name:      'advanced',
                label:     'Advanced',
                component: { name: 'AdvancedOverview' },
                sideMenu:  { children: [nestedChild as ProductChild] },
              },
            ],
          },
        },
      ];

      expect(summarise(navTreeFor(config, [CERTIFICATE, CLUSTER_ISSUER]))).toStrictEqual([
        {
          name:     'myprod-certmanager',
          overview: false,
          children: [
            {
              name:     'myprod-certmanager-advanced',
              overview: false,
              children: expectedNestedChildren,
            },
            { name: 'myprod-certmanager', overview: true },
          ],
        },
      ]);
    });
  });

  describe('group enableOverviewPage conditions', () => {
    const certManagerConfig = (enableOverviewPage?: ProductChildGroup['enableOverviewPage']): ProductChildGroup[] => [
      {
        name:      'certmanager',
        label:     'Cert Manager',
        component: { name: 'Overview' },
        enableOverviewPage,
        sideMenu:  { children: [{ type: CERTIFICATE }] },
      },
    ];

    it('should show the group and its overview when the condition is met', () => {
      const tree = navTreeFor(certManagerConfig({ ifHaveType: CERTIFICATE }), [CERTIFICATE]);

      expect(summarise(tree)).toStrictEqual([
        {
          name:     'myprod-certmanager',
          overview: false,
          children: [
            { name: CERTIFICATE, overview: false },
            { name: 'myprod-certmanager', overview: true },
          ],
        },
      ]);
    });

    it('should remove the whole group when the condition is not met and nothing else is visible', () => {
      expect(navTreeFor(certManagerConfig({ ifHaveType: 'test.io.absent' }), [])).toStrictEqual([]);
    });

    it('should keep the group but drop its overview when the condition is not met and a child is still visible', () => {
      const tree = navTreeFor(certManagerConfig({ ifHaveType: 'test.io.absent' }), [CERTIFICATE]);

      expect(summarise(tree)).toStrictEqual([
        {
          name:     'myprod-certmanager',
          overview: false,
          children: [{ name: CERTIFICATE, overview: false }],
        },
      ]);
    });

    it('should remove only the gated nested group, leaving its parent intact', () => {
      const config: ProductChildGroup[] = [
        {
          name:      'certmanager',
          label:     'Cert Manager',
          component: { name: 'Overview' },
          sideMenu:  {
            children: [
              { type: CERTIFICATE },
              {
                name:               'advanced',
                label:              'Advanced',
                component:          { name: 'AdvancedOverview' },
                enableOverviewPage: { ifHaveType: CLUSTER_ISSUER },
                sideMenu:           { children: [{ type: CLUSTER_ISSUER }] },
              },
            ],
          },
        },
      ];

      // only the Certificate CRD is installed, so the Advanced group has nothing left to show
      expect(summarise(navTreeFor(config, [CERTIFICATE]))).toStrictEqual([
        {
          name:     'myprod-certmanager',
          overview: false,
          children: [
            { name: CERTIFICATE, overview: false },
            { name: 'myprod-certmanager', overview: true },
          ],
        },
      ]);
    });
  });
});
