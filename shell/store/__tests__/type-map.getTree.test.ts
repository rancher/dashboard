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
const typeMapGetters = () => ({
  isIgnored:           () => false,
  groupForBasicType:   () => false,
  groupLabelFor:       (s: any) => (typeof s === 'string' ? s : 'Workloads'),
  groupWeightFor:      () => 0,
  groupDefaultTypeFor: () => undefined,
  typeWeightFor:       () => 1,
  groupLabel:          () => undefined,
});

const rootGetters = (count: number) => ({
  'i18n/current':  () => 'en',
  'i18n/default':  () => 'en',
  'i18n/exists':   () => false,
  'i18n/t':        (k: string) => k,
  productId:       () => 'explorer',
  currentStore:    () => 'cluster',
  'cluster/count': () => count,
});

const allTypes = () => ({
  pod: {
    name: 'pod', label: 'Pods', namespaced: true, schema
  }
});

const namesIn = (nodes: any[]): string[] => (nodes || []).flatMap((n) => [n.name, ...namesIn(n.children)]);

const tree = (mode: string, count: number) => getters.getTree(
  {} as any, typeMapGetters() as any, { $router: {} } as any, rootGetters(count) as any
)('explorer', mode, allTypes(), 'c1', null, null);

const usedTree = (count: number) => tree(TYPE_MODES.USED, count);

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
    });
  });
});
