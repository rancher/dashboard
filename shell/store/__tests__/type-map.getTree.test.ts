import { TYPE_MODES, getters } from '../type-map';
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

const usedTree = (count: number) => getters.getTree(
  {} as any, typeMapGetters() as any, { $router: {} } as any, rootGetters(count) as any
)('explorer', TYPE_MODES.USED, allTypes(), 'c1', 'both', null, null);

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
    });
  });
});
