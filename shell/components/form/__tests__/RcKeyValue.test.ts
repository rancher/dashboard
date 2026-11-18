import { mount } from '@vue/test-utils';
import RcKeyValue from '@shell/components/form/RcKeyValue.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';

describe('component: RcKeyValue', () => {
  const mountComponent = (props = {}) => {
    return mount(RcKeyValue, {
      props: {
        value: {},
        mode:  _EDIT,
        ...props,
      },
    });
  };

  describe('grid container', () => {
    it('should not render the grid when there are no rows in edit mode', () => {
      const wrapper = mountComponent();

      expect(wrapper.find('.kv-container').exists()).toBe(false);
    });

    it('should render the grid when there are rows in edit mode', () => {
      const wrapper = mountComponent({ value: { foo: 'bar' } });

      expect(wrapper.find('.kv-container').exists()).toBe(true);
    });

    it('should render the grid when there are no rows in view mode', () => {
      const wrapper = mountComponent({ mode: _VIEW });

      expect(wrapper.find('.kv-container').exists()).toBe(true);
    });

    it('should still render the add button when there are no rows in edit mode', () => {
      const wrapper = mountComponent();

      expect(wrapper.find('[data-testid="add_row_item_button"]').exists()).toBe(true);
    });
  });

  describe('unmounting', () => {
    it('should emit a pending debounced edit before unmounting', async() => {
      const wrapper = mountComponent({ value: { foo: 'bar' } });

      await wrapper.setData({ rows: [{ key: 'foo', value: 'changed' }] });
      (wrapper.vm as any).queueUpdate();
      wrapper.unmount();

      expect(wrapper.emitted('update:value')).toStrictEqual([[{ foo: 'changed' }]]);
    });

    it('should not emit when there is no pending edit', () => {
      const wrapper = mountComponent({ value: { foo: 'bar' } });

      wrapper.unmount();

      expect(wrapper.emitted('update:value')).toBeUndefined();
    });
  });
});
