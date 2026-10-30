import { init, NAME, PROJECT_MONITORS_VIRTUAL_TYPE } from '@shell/config/product/monitoring';
import { HELM } from '@shell/config/types';
import { IF_HAVE } from '@shell/store/type-map';

describe('product: monitoring', () => {
  const commits = () => {
    const commit = jest.fn();

    init({ commit, getters: { 'i18n/t': (key: string) => key } });

    return commit.mock.calls;
  };

  const projectMonitorsVirtualType = () => commits()
    .filter(([name]) => name === 'type-map/virtualType')
    .map(([, value]) => value.obj)
    .find((obj) => obj.name === PROJECT_MONITORS_VIRTUAL_TYPE);

  it('should only show project monitors when the prometheus federator is installed', () => {
    expect(projectMonitorsVirtualType().ifHave).toStrictEqual(IF_HAVE.PROMETHEUS_FEDERATOR);
  });

  it('should open the project helm chart list', () => {
    expect(projectMonitorsVirtualType().route).toStrictEqual({
      name:   'c-cluster-product-resource',
      params: { product: NAME, resource: HELM.PROJECTHELMCHART }
    });
  });

  it('should not list the project helm chart schema itself, which outlives the federator', () => {
    const basicTypes = commits()
      .filter(([name]) => name === 'type-map/basicType')
      .flatMap(([, value]) => value.types);

    expect(basicTypes).toContain(PROJECT_MONITORS_VIRTUAL_TYPE);
    expect(basicTypes).not.toContain(HELM.PROJECTHELMCHART);
  });

  it('should count the project helm charts', () => {
    const options = commits()
      .filter(([name]) => name === 'type-map/configureType')
      .map(([, value]) => value)
      .find((value) => value.match === PROJECT_MONITORS_VIRTUAL_TYPE);
    const count = jest.fn(() => 3);

    expect(options.custom.countGetter({ 'cluster/count': count })).toBe(3);
    expect(count).toHaveBeenCalledWith({ name: HELM.PROJECTHELMCHART });
  });
});
