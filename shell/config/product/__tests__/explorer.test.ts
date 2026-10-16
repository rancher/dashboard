import { init } from '@shell/config/product/explorer';
import { NODE as NODE_COL } from '@shell/config/table-headers';
import { POD } from '@shell/config/types';

describe('product: explorer', () => {
  const initExplorer = () => {
    const commit = jest.fn();

    init({ commit, getters: { 'i18n/t': (key: string) => key } });

    return commit;
  };

  // Headers are committed as { type, headers } and pagination headers as { type, paginationHeaders }
  const committedHeaders = (commit: jest.Mock, mutation: string, key: string) => commit.mock.calls
    .filter(([name]) => name === `type-map/${ mutation }`)
    .map(([, value]) => ({ type: value.type, headers: value[key] }));

  const nodeColumn = (commit: jest.Mock, mutation: string, key: string) => committedHeaders(commit, mutation, key)
    .find(({ type }) => type === POD)?.headers.find((header: any) => header.name === NODE_COL.name);

  describe.each([
    ['list', 'headers', 'headers'],
    ['paginated list', 'paginationHeaders', 'paginationHeaders'],
  ])('pods %s', (_, mutation, key) => {
    it('should show the node with a popover', () => {
      const commit = initExplorer();

      expect(nodeColumn(commit, mutation, key).formatter).toStrictEqual('LinkNamePopover');
    });

    it('should not select the row when the popover is clicked', () => {
      const commit = initExplorer();

      expect(nodeColumn(commit, mutation, key).skipSelect).toStrictEqual(true);
    });

    it('should keep the label, sort and link of the node column of other lists', () => {
      const commit = initExplorer();
      const {
        name, labelKey, sort, formatterOpts
      } = nodeColumn(commit, mutation, key);

      expect({
        name, labelKey, sort, formatterOpts
      }).toStrictEqual({
        name: NODE_COL.name, labelKey: NODE_COL.labelKey, sort: NODE_COL.sort, formatterOpts: NODE_COL.formatterOpts
      });
    });
  });

  it('should not show a popover in the lists of other resources', () => {
    const commit = initExplorer();
    const others = [
      ...committedHeaders(commit, 'headers', 'headers'),
      ...committedHeaders(commit, 'paginationHeaders', 'paginationHeaders'),
    ].filter(({ type }) => type !== POD);
    const withPopover = others.filter(({ headers }) => headers.some((header: any) => header?.formatter === 'LinkNamePopover'));

    expect(others.length).toBeGreaterThan(0);
    expect(withPopover).toStrictEqual([]);
  });

  it('should not change the shared node column', () => {
    initExplorer();

    expect([(NODE_COL as any).formatter, (NODE_COL as any).skipSelect]).toStrictEqual(['LinkName', undefined]);
  });
});
