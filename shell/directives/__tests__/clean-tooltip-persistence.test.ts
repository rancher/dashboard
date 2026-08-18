import { mount } from '@vue/test-utils';
import cleanTooltip from '@shell/directives/clean-tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mountOptions = {
  global:   { directives: { 'clean-tooltip': cleanTooltip } },
  attachTo: document.body,
};

const trigger = `<button v-clean-tooltip="'Pull secrets'" type="button" />`;

const isShown = () => document.querySelector('.v-popper__popper--shown') !== null;

const getPopper = () => document.querySelector('.v-popper__popper') as HTMLElement;

describe('clean-tooltip content on hover or focus', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('hoverable', () => {
    it('should stay shown when the pointer moves from the trigger onto it', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      expect(isShown()).toBe(true);

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await wait(100);
      getPopper().dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      expect(isShown()).toBe(true);

      wrapper.unmount();
    });

    it('should hide once the pointer leaves it again', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      getPopper().dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      expect(isShown()).toBe(true);

      getPopper().dispatchEvent(new MouseEvent('mouseleave'));
      await wait(600);

      expect(isShown()).toBe(false);

      wrapper.unmount();
    });
  });

  describe('persistent', () => {
    it('should hide when the pointer leaves the trigger for somewhere else', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      expect(isShown()).toBe(true);

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await wait(600);

      expect(isShown()).toBe(false);

      expect(wrapper.element.classList.contains('v-popper--has-tooltip')).toBe(false);

      wrapper.unmount();
    });

    it('should show again the next time the pointer arrives', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await wait(600);

      expect(isShown()).toBe(false);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      expect(isShown()).toBe(true);

      wrapper.unmount();
    });

    it('should stay shown when the pointer comes back to the trigger', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await wait(100);
      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      expect(isShown()).toBe(true);

      wrapper.unmount();
    });
  });

  describe('dismissible', () => {
    it('should dismiss a hover-triggered tooltip while focus is elsewhere', async() => {
      const wrapper = mount({
        template: `
          <div>
            <button id="trigger" v-clean-tooltip="'Pull secrets'" type="button" />
            <button id="elsewhere" type="button">x</button>
          </div>
        `,
      }, mountOptions);

      wrapper.find('#trigger').element.dispatchEvent(new MouseEvent('mouseenter'));
      await wait(600);

      expect(isShown()).toBe(true);

      wrapper.find('#elsewhere').element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', bubbles: true, cancelable: true
      }));
      await wait(300);

      expect(isShown()).toBe(false);

      wrapper.unmount();
    });
  });
});
