import { init } from '@shell/config/product/monitoring';
import { HELM } from '@shell/config/types';

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

  it.each([true, false])('should only ignore the project helm chart when the federator is missing (missing: %p)', (federatorMissing) => {
    const rule = commits()
      .filter(([name]) => name === 'type-map/ignoreType')
      .map(([, value]) => value)
      .find((value) => value.regexOrString === HELM.PROJECTHELMCHART);

    expect(rule.cb({ federatorMissing })).toBe(federatorMissing);
  });
});
