import { init } from '@shell/config/product/monitoring';
import { COUNT, HELM } from '@shell/config/types';

describe('product: monitoring', () => {
  const commits = () => {
    const commit = jest.fn();

    init({ commit, getters: { 'i18n/t': (key: string) => key } });

    return commit.mock.calls;
  };

  it('should list the project helm chart in the menu', () => {
    const basicTypes = commits()
      .filter(([name]) => name === 'type-map/basicType')
      .flatMap(([, value]) => value.types);

    expect(basicTypes).toContain(HELM.PROJECTHELMCHART);
  });

  it.each([
    [true, undefined, true],
    [true, 0, true],
    [true, 1, false],
    [false, undefined, false],
    [false, 1, false],
  ])('should only ignore the project helm chart when the federator is missing and none are left (missing: %p, count: %p)', (federatorMissing, count, ignored) => {
    const rule = commits()
      .filter(([name]) => name === 'type-map/ignoreType')
      .map(([, value]) => value)
      .find((value) => value.regexOrString === HELM.PROJECTHELMCHART);
    const counts = count === undefined ? {} : { [HELM.PROJECTHELMCHART]: { summary: { count } } };

    expect(rule.cb({ federatorMissing, 'cluster/all': (type: string) => (type === COUNT ? [{ counts }] : []) })).toBe(ignored);
  });
});
