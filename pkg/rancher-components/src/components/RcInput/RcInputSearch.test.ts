import { h } from 'vue';
import { mount } from '@vue/test-utils';
import RcInputSearch from './RcInputSearch.vue';
import RcFieldGroup from '@components/RcField/RcFieldGroup.vue';

describe('component: RcInputSearch', () => {
  it('renders a search input', () => {
    const wrapper = mount(RcInputSearch);

    expect(wrapper.find('input').attributes('type')).toStrictEqual('search');
  });

  it('renders a decorative search icon', () => {
    const wrapper = mount(RcInputSearch);
    const icon = wrapper.find('.rc-input-search-icon');

    expect(icon.classes()).toContain('icon-search');
    expect(icon.attributes('aria-hidden')).toStrictEqual('true');
  });

  it('emits the typed value', async() => {
    const wrapper = mount(RcInputSearch, { props: { modelValue: '' } });

    await wrapper.find('input').setValue('local');

    expect(wrapper.emitted('update:modelValue')).toStrictEqual([['local']]);
  });

  it('passes an aria-label to the input', () => {
    const wrapper = mount(RcInputSearch, { attrs: { 'aria-label': 'Search clusters' } });

    expect(wrapper.find('input').attributes('aria-label')).toStrictEqual('Search clusters');
  });

  describe('inside an RcFieldGroup', () => {
    const mountInGroup = (groupProps: Record<string, unknown>) => mount(RcFieldGroup, {
      props: groupProps,
      slots: { default: () => h(RcInputSearch) },
    });

    it('stays editable in view mode', () => {
      const wrapper = mountInGroup({ mode: 'view' });

      expect(wrapper.find('input').exists()).toBe(true);
    });

    it('inherits the disabled state', () => {
      const wrapper = mountInGroup({ disabled: true });

      expect(wrapper.find('input').attributes('disabled')).toStrictEqual('');
    });
  });
});
