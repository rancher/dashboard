import { init } from '@shell/config/product/apps';
import { CATALOG } from '@shell/config/types';

describe('product: apps', () => {
  const chartsVirtualType = () => {
    const commit = jest.fn();

    init({ commit, getters: { 'i18n/t': (key: string) => key } });

    return commit.mock.calls
      .filter(([name]) => name === 'type-map/virtualType')
      .map(([, value]) => value.obj)
      .find((obj) => obj.name === 'charts');
  };

  it('should only show charts to users who can see repositories and installed apps', () => {
    expect(chartsVirtualType().ifHaveType).toStrictEqual([CATALOG.CLUSTER_REPO, CATALOG.APP]);
  });
});
