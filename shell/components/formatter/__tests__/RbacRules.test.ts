import { mount } from '@vue/test-utils';
import RbacRules from '@shell/components/formatter/RbacRules.vue';

describe('component: RbacRules', () => {
  const lines = (value: any) => [...mount(RbacRules, { props: { value } }).element.children].map((line) => line.textContent?.trim());

  it.each([
    ['a core API group rule', [{
      apiGroups: [''], resources: ['pods'], verbs: ['get']
    }], ['get pods']],
    ['a rule with an API group', [{
      apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
    }], ['create deployments.apps']],
    ['several verbs and resources', [{
      apiGroups: [''], resources: ['pods', 'services'], verbs: ['get', 'list']
    }], ['get, list pods, services']],
    ['several API groups', [{
      apiGroups: ['apps', 'extensions'], resources: ['deployments'], verbs: ['get']
    }], ['get deployments.apps, deployments.extensions']],
    ['a rule with no API groups', [{ resources: ['pods'], verbs: ['get'] }], ['get pods']],
    ['several rules', [
      {
        apiGroups: [''], resources: ['pods'], verbs: ['get']
      },
      {
        apiGroups: ['apps'], resources: ['deployments'], verbs: ['create']
      },
    ], ['get pods', 'create deployments.apps']],
  ])('should show one line per rule for %s', (_, value, expected) => {
    expect(lines(value)).toStrictEqual(expected);
  });

  it.each([
    ['no rules', []],
    ['no value', undefined],
    ['a null value', null],
  ])('should show nothing for %s', (_, value) => {
    expect(lines(value)).toStrictEqual([]);
  });
});
