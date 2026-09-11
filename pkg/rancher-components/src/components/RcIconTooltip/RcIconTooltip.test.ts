import { mount } from '@vue/test-utils';
import RcIconTooltip from './RcIconTooltip.vue';
import { waitForTooltip, waitUntil } from '@shell/directives/__tests__/utils/tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('component: RcIconTooltip', () => {
  describe('what it renders', () => {
    it('should render a button carrying a generic name over a decorative glyph', () => {
      const wrapper = mount(RcIconTooltip, { props: { content: 'Pull secrets' } });
      const button = wrapper.find('button');

      expect(button.attributes('type')).toBe('button');
      expect(button.attributes('aria-label')).toBe('%generic.moreInfo%');
      expect(button.find('i.rc-icon.icon-info').attributes('aria-hidden')).toBe('true');
    });

    it('should take the name the consumer gives it', () => {
      const wrapper = mount(RcIconTooltip, { props: { content: 'Pull secrets', label: 'Key hint' } });

      expect(wrapper.find('button').attributes('aria-label')).toBe('Key hint');
    });

    it('should draw the glyph the consumer asks for, at the size the icons have always been', () => {
      const wrapper = mount(RcIconTooltip, { props: { content: 'Value must be a number', iconType: 'warning' } });

      expect(wrapper.find('button i').classes()).toStrictEqual(['rc-icon', 'small', 'icon-warning']);
    });

    it('should still render the button when there is nothing to say', () => {
      const wrapper = mount(RcIconTooltip, {});

      expect(wrapper.find('button').exists()).toBe(true);
      expect(wrapper.find('button').classes()).not.toContain('has-clean-tooltip');
    });

    it('should ask RcButton for the box the local styles take back off', () => {
      const wrapper = mount(RcIconTooltip, { props: { content: 'Pull secrets' } });

      expect(wrapper.find('button').classes()).toEqual(expect.arrayContaining(['rc-button', 'btn', 'variant-ghost', 'btn-small']));
    });
  });

  describe('the tooltip directive', () => {
    it('should land on the rendered button along with the attributes that describe it', () => {
      const wrapper = mount(RcIconTooltip, {
        props: { content: 'Pull secrets' },
        attrs: { 'data-testid': 'some-info-icon', class: 'status-icon' },
      });
      const button = wrapper.find('button');
      const describedBy = button.attributes('aria-describedby');

      expect(button.classes()).toEqual(expect.arrayContaining(['has-clean-tooltip', 'status-icon']));
      expect(button.attributes('data-testid')).toBe('some-info-icon');
      expect(describedBy).toBeDefined();
      expect(document.getElementById(describedBy as string)?.textContent).toBe('Pull secrets');
    });

    it('should show the tooltip from a pointer and from an activation', async() => {
      const wrapper = mount(RcIconTooltip, { props: { content: 'Pull secrets' }, attachTo: document.body });
      const button = wrapper.find('button').element;

      button.dispatchEvent(new FocusEvent('focus'));
      await waitForTooltip();

      expect(document.querySelector('.v-popper__popper--shown')).not.toBeNull();

      button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await wait(600);

      expect(document.querySelector('.v-popper__popper--shown')).not.toBeNull();

      wrapper.unmount();
    });

    it('should keep the options an object content carries', async() => {
      const wrapper = mount(RcIconTooltip, {
        props:    { content: { content: 'Value must be a number', popperClass: ['tooltip-error'] } },
        attachTo: document.body,
      });

      wrapper.find('button').element.dispatchEvent(new FocusEvent('focus'));
      await waitUntil(() => !!document.querySelector('.v-popper__popper--shown.tooltip-error'));

      expect(document.querySelector('.v-popper__popper--shown.tooltip-error')).not.toBeNull();

      wrapper.unmount();
    });
  });

  describe('listeners a consumer adds', () => {
    it('should stop at the button when the consumer says so, without costing it its tooltip', async() => {
      const hostClicked = jest.fn();
      const wrapper = mount({
        components: { RcIconTooltip },
        methods:    { hostClicked },
        template:   `<div @click="hostClicked"><RcIconTooltip content="Pull secrets" @click.stop.prevent /></div>`,
      }, { attachTo: document.body });

      wrapper.find('button').element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await waitForTooltip();

      expect(hostClicked).not.toHaveBeenCalled();
      expect(document.querySelector('.v-popper__popper--shown')).not.toBeNull();

      wrapper.unmount();
    });

    it('should stop a keydown at the button when the consumer says so', async() => {
      const hostKeyed = jest.fn();
      const wrapper = mount({
        components: { RcIconTooltip },
        methods:    { hostKeyed },
        template:   `<div @keydown="hostKeyed"><RcIconTooltip content="Pull secrets" @keydown.stop /></div>`,
      });

      wrapper.find('button').element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', bubbles: true, cancelable: true
      }));
      await wrapper.vm.$nextTick();

      expect(hostKeyed).not.toHaveBeenCalled();
    });
  });
});
