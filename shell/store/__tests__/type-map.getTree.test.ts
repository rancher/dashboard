import { FAVORITE_GROUP, TYPE_MODES, getters } from '../type-map';
import { SCHEMA } from '@shell/config/types';

jest.mock('@shell/utils/router', () => ({ filterLocationValidParams: (_router: any, route: any) => route }));

const schema = {
  id:         'pod',
  type:       SCHEMA,
  attributes: {
    kind: 'pod', resource: 'pods', group: 'core'
  }
};

// Minimal getters/rootGetters surface that `getTree` touches when building one
// namespaced type in the "used" tree, with no search term.
const typeMapGetters = (hasCustomList = false) => ({
  hasCustomList:       () => hasCustomList,
  isIgnored:           () => false,
  groupForBasicType:   () => false,
  groupLabelFor:       (s: any) => (typeof s === 'string' ? s : 'Workloads'),
  groupWeightFor:      () => 0,
  groupDefaultTypeFor: () => undefined,
  typeWeightFor:       () => 1,
  groupLabel:          () => undefined,
});

const rootGetters = (count: number, canList = true) => ({
  'i18n/current':    () => 'en',
  'i18n/default':    () => 'en',
  'i18n/exists':     () => false,
  'i18n/t':          (k: string) => k,
  productId:         () => 'explorer',
  currentStore:      () => 'cluster',
  'cluster/count':   () => count,
  'cluster/canList': () => canList,
});

const allTypes = (overrides = {}) => ({
  pod: {
    name: 'pod', label: 'Pods', namespaced: true, schema, ...overrides
  }
});

const namesIn = (nodes: any[]): string[] => (nodes || []).flatMap((n) => [n.name, ...namesIn(n.children)]);

/**
 * Chain of group names from the top of the tree down to the group holding `leafName`,
 * e.g. ['a', 'b', 'c'] for a leaf nested three groups deep.
 */
const groupChainTo = (nodes: any[], leafName: string): string[] | undefined => {
  for (const node of nodes || []) {
    if (!node.children) {
      continue;
    }

    if (node.children.some((child: any) => child.name === leafName)) {
      return [node.name];
    }

    const deeper = groupChainTo(node.children, leafName);

    if (deeper) {
      return [node.name, ...deeper];
    }
  }

  return undefined;
};

/**
 * Basic tree for a single virtual type registered under `groupPath`, the `::` separated
 * hierarchy that `basicType(names, path)` records for a product's side menu.
 */
// `getTree` builds its root with an empty `children`, so TS infers the tree it hands back as
// `never[]`. The nodes are plain objects assembled in a .js store, so `any[]` is what they are.
const basicTree = (groupPath: string): any[] => getters.getTree(
  {} as any,
  { ...typeMapGetters(), groupForBasicType: () => groupPath } as any,
  { $router: {} } as any,
  rootGetters(1) as any
)('explorer', TYPE_MODES.BASIC, allTypes({ schema: undefined, route: { name: 'leaf-route', params: {} } }), 'c1', null, null);

const tree = (mode: string, count: number) => getters.getTree(
  {} as any, typeMapGetters() as any, { $router: {} } as any, rootGetters(count) as any
)('explorer', mode, allTypes(), 'c1', null, null);

const usedTree = (count: number) => tree(TYPE_MODES.USED, count);

const unlistableTree = (mode: string, { hasCustomList = false, typeOverrides = {} } = {}) => getters.getTree(
  {} as any, typeMapGetters(hasCustomList) as any, { $router: {} } as any, rootGetters(0, false) as any
)('explorer', mode, allTypes(typeOverrides), 'c1', null, null);

describe('type-map', () => {
  describe('getters', () => {
    describe('getTree', () => {
      describe("mode: 'used'", () => {
        it('includes a used type even when its current count is zero', () => {
          expect(namesIn(usedTree(0))).toContain('pod');
        });

        it('includes a used type with a positive count', () => {
          expect(namesIn(usedTree(5))).toContain('pod');
        });
      });

      describe("mode: 'favorite'", () => {
        // SideNav expands this group by default, so it has to match the name SideNav looks for
        it('puts starred types in the favorite group', () => {
          const groups: any[] = tree(TYPE_MODES.FAVORITE, 1);

          expect(groups.map((g) => g.name)).toStrictEqual([FAVORITE_GROUP]);
          expect(namesIn(groups[0].children)).toStrictEqual(['pod']);
        });
      });

      describe("mode: 'basic'", () => {
        // A product registered through the Product Registration API nests its side menu by passing
        // a `::` separated path to basicType. Every segment has to become a group, however deep the
        // nesting goes - truncating the path drops a group and flattens its pages into the group above.
        it.each([
          ['one group', 'a', ['a']],
          ['two groups', 'a::b', ['a', 'b']],
          ['three groups', 'a::b::c', ['a', 'b', 'c']],
          ['four groups', 'a::b::c::d', ['a', 'b', 'c', 'd']],
        ])('nests a type %s deep', (_label, groupPath, expected) => {
          expect(groupChainTo(basicTree(groupPath), 'pod')).toStrictEqual(expected);
        });

        it('creates each group in the path exactly once', () => {
          expect(namesIn(basicTree('a::b::c::d'))).toStrictEqual(['a', 'b', 'c', 'd', 'pod']);
        });

        // `isRoot` makes SideNav render a group without a header, and is read off the whole path
        it('flags the group under root as root', () => {
          const [root] = basicTree('root::a');

          expect(root.name).toBe('root');
          expect(root.isRoot).toBe(true);
          expect(root.children[0]).toMatchObject({ name: 'a', isRoot: true });
        });
      });

      describe('types the user cannot list', () => {
        it.each([
          TYPE_MODES.USED,
          TYPE_MODES.FAVORITE,
          TYPE_MODES.ALL,
        ])("excludes a schema backed type in mode '%s'", (mode) => {
          expect(namesIn(unlistableTree(mode))).not.toContain('pod');
        });

        it('includes a type with a custom list component', () => {
          expect(namesIn(unlistableTree(TYPE_MODES.USED, { hasCustomList: true }))).toContain('pod');
        });

        it('includes a type with a custom route', () => {
          const route = { name: 'c-cluster-product-custom', params: {} };

          expect(namesIn(unlistableTree(TYPE_MODES.USED, { typeOverrides: { route } }))).toContain('pod');
        });

        it('includes a virtual type, which has no schema', () => {
          expect(namesIn(unlistableTree(TYPE_MODES.USED, { typeOverrides: { schema: undefined } }))).toContain('pod');
        });
      });
    });
  });
});
