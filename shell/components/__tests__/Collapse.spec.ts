import { mount } from '@vue/test-utils';
import Collapse from '@shell/components/Collapse.vue';

describe('component: Collapse.vue', () => {
  describe('closed', () => {
    const wrapper = mount(Collapse, { propsData: { open: false } });

    it('is closed', () => {
      const content = wrapper.find(`[data-testid="collapse-content"]`);

      expect(content.element).toBeUndefined();
    });

    it('icon is chevron right', () => {
      const icon = wrapper.find(`[data-testid="collapse-icon-right"]`);

      expect(icon.element).toBeDefined();
    });
  });

  describe('collapsed', () => {
    const wrapper = mount(Collapse, { propsData: { open: true } });

    it('is collapse', () => {
      const content = wrapper.find(`[data-testid="collapse-content"]`);

      expect(content.element).toBeDefined();
    });

    it('icon should is chevron down', () => {
      const icon = wrapper.find(`[data-testid="collapse-icon-down"]`);

      expect(icon.element).toBeDefined();
    });

    it('emit', async() => {
      const collapse = wrapper.find(`[data-testid="collapse-div"]`);

      await collapse.trigger('click');

      expect(wrapper.emitted('update:open')).toBeTruthy();
    });
  });
});
