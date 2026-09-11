import { mount } from '@vue/test-utils';
import LabeledTooltip from './LabeledTooltip.vue';
import { waitForTooltip } from '@shell/directives/__tests__/utils/tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('component: LabeledTooltip', () => {
  describe('the icon accessible name', () => {
    it.each([
      ['error', '%generic.error%'],
      ['warning', '%generic.warning%'],
      ['info', '%generic.moreInfo%'],
      ['success', '%generic.moreInfo%'],
    ])('should name a %s icon after its status rather than its message', (status, expected) => {
      const wrapper = mount(LabeledTooltip, { props: { status, value: 'Value must be a number' } });

      expect(wrapper.find('button.status-icon').attributes('aria-label')).toBe(expected);
    });

    it('should name the icon even when there is no message', () => {
      const wrapper = mount(LabeledTooltip, { props: { status: 'error' } });

      expect(wrapper.find('button.status-icon').attributes('aria-label')).toBe('%generic.error%');
    });

    it('should hand the name to a control rather than to the glyph', () => {
      const wrapper = mount(LabeledTooltip, { props: { status: 'error', value: 'Value must be a number' } });
      const button = wrapper.find('button.status-icon');

      expect(button.attributes('type')).toBe('button');
      expect(button.attributes('tabindex')).toBeUndefined();
      expect(button.find('i.icon-warning').attributes('aria-hidden')).toBe('true');
    });
  });

  describe('activating the icon', () => {
    it('should not reach a host that acts on clicks of its own', async() => {
      const hostClicked = jest.fn();
      const wrapper = mount({
        components: { LabeledTooltip },
        methods:    { hostClicked },
        template:   `<div @click="hostClicked"><LabeledTooltip status="error" value="Value must be a number" /></div>`,
      });

      await wrapper.find('button.status-icon').trigger('click');

      expect(hostClicked).not.toHaveBeenCalled();
    });

    it('should leave the tooltip shown', async() => {
      const wrapper = mount(LabeledTooltip, {
        props:    { status: 'error', value: 'Value must be a number' },
        attachTo: document.body,
      });
      const icon = wrapper.find('button.status-icon').element;

      icon.dispatchEvent(new FocusEvent('focus'));
      await waitForTooltip();

      expect(document.querySelector('.v-popper__popper--shown')).not.toBeNull();

      icon.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await wait(600);

      expect(document.querySelector('.v-popper__popper--shown')).not.toBeNull();

      wrapper.unmount();
    });
  });
});
