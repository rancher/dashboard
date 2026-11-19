import { init } from '@shell/config/product/explorer';
import { NODE as NODE_COL } from '@shell/config/table-headers';
import { FLEET, HELM, POD } from '@shell/config/types';

describe('product: explorer', () => {
  const initExplorer = () => {
    const commit = jest.fn();

    init({ commit, getters: { 'i18n/t': (key: string) => key } });

    return commit;
  };

  const nodeColumn = (commit: jest.Mock, mutation: string) => commit.mock.calls
    .find(([name, value]) => name === `type-map/${ mutation }` && value.type === POD)?.[1][mutation]
    .find((header: any) => header.name === NODE_COL.name);

  it.each([
    ['list', 'headers'],
    ['paginated list', 'paginationHeaders'],
  ])('should show the node in the pods %s as a link, like the node column of other lists', (_, mutation) => {
    const commit = initExplorer();
    const {
      name, labelKey, sort, formatter, formatterOpts, skipSelect
    } = nodeColumn(commit, mutation);

    expect({
      name, labelKey, sort, formatter, formatterOpts, skipSelect
    }).toStrictEqual({
      name: NODE_COL.name, labelKey: NODE_COL.labelKey, sort: NODE_COL.sort, formatter: 'LinkName', formatterOpts: NODE_COL.formatterOpts, skipSelect: undefined
    });
  });

  it.each([
    FLEET.GIT_REPO,
    FLEET.HELM_OP,
    HELM.PROJECTHELMCHART,
  ])('should hide the default masthead of the %s list, which renders its own', (type) => {
    const commit = initExplorer();
    const options = commit.mock.calls
      .filter(([name, value]) => name === 'type-map/configureType' && value.match === type)
      .map(([, value]) => value);

    expect(options).toStrictEqual([{
      showListMasthead: false, match: type, product: 'explorer'
    }]);
  });
});
