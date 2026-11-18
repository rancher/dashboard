import { mount, VueWrapper } from '@vue/test-utils';
import GrantResources from '@shell/components/auth/GrantResources.vue';
import Select from '@shell/components/form/Select.vue';
import { _CREATE } from '@shell/config/query-params';
import type { GrantResourceRule } from '@shell/utils/grant-resources';

describe('component: GrantResources', () => {
  const createRule = (): GrantResourceRule => ({
    apiGroups: [''], resources: [], verbs: []
  });

  const createWrapper = (rules: GrantResourceRule[], props = {}) => mount(GrantResources, {
    props: {
      value:           rules,
      mode:            _CREATE,
      resourceOptions: [],
      defaultRule:     createRule(),
      ...props,
    },
    global: {
      provide:    { store: { getters: { 'i18n/t': (key: string) => key } } },
      directives: { cleanTooltip: () => {} },
    },
  });

  const selectWithTestid = (wrapper: VueWrapper<any>, testid: string) => {
    const select = wrapper.findAllComponents(Select).find((s) => s.vm.$attrs['data-testid'] === testid);

    if (!select) {
      throw new Error(`no select rendered with data-testid "${ testid }"`);
    }

    return select;
  };

  it('should set the resource and its API group when a listed resource is picked', async() => {
    const rule = createRule();
    const wrapper = createWrapper([rule]);

    await selectWithTestid(wrapper, 'grant-resources-resources0').vm.$emit('update:value', { resourceName: 'deployments', apiGroupValue: 'apps' });

    expect(rule).toStrictEqual({
      apiGroups: ['apps'], resources: ['deployments'], verbs: []
    });
  });

  it('should keep the API group when a resource is typed in', async() => {
    const rule = { ...createRule(), apiGroups: ['example.io'] };
    const wrapper = createWrapper([rule]);

    await selectWithTestid(wrapper, 'grant-resources-resources0').vm.$emit('createdListItem', { label: 'widgets' });

    expect(rule).toStrictEqual({
      apiGroups: ['example.io'], resources: ['widgets'], verbs: []
    });
  });

  it('should clear the resource and its API group when the resource is cleared', async() => {
    const rule = {
      apiGroups: ['apps'], resources: ['deployments'], verbs: []
    };
    const wrapper = createWrapper([rule]);

    await selectWithTestid(wrapper, 'grant-resources-resources0').vm.$emit('update:value', null);

    expect(rule).toStrictEqual({
      apiGroups: [], resources: [], verbs: []
    });
  });

  it('should set the verbs', async() => {
    const rule = createRule();
    const wrapper = createWrapper([rule]);

    await selectWithTestid(wrapper, 'grant-resources-verbs0').vm.$emit('update:value', ['get', 'list']);

    expect(rule.verbs).toStrictEqual(['get', 'list']);
  });

  it('should set the API group from its input', async() => {
    const rule = createRule();
    const wrapper = createWrapper([rule]);

    await wrapper.find('[data-testid="grant-resources-api-groups0"]').setValue('apps');

    expect(rule.apiGroups).toStrictEqual(['apps']);
  });

  it('should set the non-resource URL from its input', async() => {
    const rule = createRule();
    const wrapper = createWrapper([rule]);

    await wrapper.find('[data-testid="grant-resources-non-resource-urls0"]').setValue('/healthz');

    expect(rule.nonResourceURLs).toStrictEqual(['/healthz']);
  });

  it.each([
    [true, 4],
    [false, 3],
  ])('should show the non-resource URLs column when showNonResourceUrls is %p (%p columns)', (showNonResourceUrls, columns) => {
    const wrapper = createWrapper([createRule()], { showNonResourceUrls });

    expect(wrapper.find('[data-testid="grant-resources-non-resource-urls0"]').exists()).toBe(showNonResourceUrls);
    expect(wrapper.find('.column-headers').element.children).toHaveLength(columns);
  });

  it.each([
    [true, 2],
    [false, 1],
  ])('should mark the resource as required when resourceRequired is %p', (resourceRequired, requiredMarkers) => {
    const wrapper = createWrapper([createRule()], { resourceRequired });

    expect(wrapper.findAll('.column-headers .required')).toHaveLength(requiredMarkers);
  });

  it.each([
    [true, 1],
    [false, 0],
  ])('should start with %p empty row when there are no rules and initialEmptyRow is set', (initialEmptyRow, rows) => {
    const wrapper = createWrapper([], { initialEmptyRow });

    expect(wrapper.findAll('[data-testid^="grant-resources-verbs"]')).toHaveLength(rows);
  });

  it('should not allow adding or removing rules when disabled', () => {
    const wrapper = createWrapper([createRule()], { disabled: true });

    expect(wrapper.find('[data-testid="array-list-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="array-list-remove-item-0"]').exists()).toBe(false);
  });
});
