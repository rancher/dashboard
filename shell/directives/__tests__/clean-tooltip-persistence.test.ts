import { mount } from '@vue/test-utils';
import cleanTooltip from '@shell/directives/clean-tooltip';
import { waitForTooltip, waitForNoTooltip } from './utils/tooltip';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mountOptions = {
  global:   { directives: { 'clean-tooltip': cleanTooltip } },
  attachTo: document.body,
};

const trigger = `<button v-clean-tooltip="'Pull secrets'" type="button" />`;

const isShown = () => document.querySelector('.v-popper__popper--shown') !== null;

const getPopper = () => document.querySelector('.v-popper__popper') as HTMLElement;

/**
 * Waits out the hide that leaving would have caused, so that asserting the tooltip is still shown
 * means it survived rather than that the assertion ran before it could go.
 */
const settle = () => wait(600);

describe('clean-tooltip content on hover or focus', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('hoverable', () => {
    it('should stay shown when the pointer moves from the trigger onto it', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      expect(isShown()).toBe(true);

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await wait(100);
      getPopper().dispatchEvent(new MouseEvent('mouseenter'));
      await settle();

      expect(isShown()).toBe(true);

      wrapper.unmount();
    });

    it('should hide once the pointer leaves it again', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      getPopper().dispatchEvent(new MouseEvent('mouseenter'));
      await settle();

      expect(isShown()).toBe(true);

      getPopper().dispatchEvent(new MouseEvent('mouseleave'));
      await waitForNoTooltip();

      expect(isShown()).toBe(false);

      wrapper.unmount();
    });
  });

  describe('persistent', () => {
    it('should hide when the pointer leaves the trigger for somewhere else', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      expect(isShown()).toBe(true);

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await waitForNoTooltip();

      expect(isShown()).toBe(false);

      expect(wrapper.element.classList.contains('v-popper--has-tooltip')).toBe(false);

      wrapper.unmount();
    });

    it('should show again the next time the pointer arrives', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await waitForNoTooltip();

      expect(isShown()).toBe(false);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      expect(isShown()).toBe(true);

      wrapper.unmount();
    });

    it('should stay shown when the pointer comes back to the trigger', async() => {
      const wrapper = mount({ template: trigger }, mountOptions);

      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      wrapper.element.dispatchEvent(new MouseEvent('mouseleave'));
      await wait(100);
      wrapper.element.dispatchEvent(new MouseEvent('mouseenter'));
      await settle();

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
      await waitForTooltip();

      expect(isShown()).toBe(true);

      wrapper.find('#elsewhere').element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', bubbles: true, cancelable: true
      }));
      await waitForNoTooltip();

      expect(isShown()).toBe(false);

      wrapper.unmount();
    });

    it('should dismiss when the element under focus stops the keydown', async() => {
      const wrapper = mount({ template: `<button id="trigger" v-clean-tooltip="'Pull secrets'" type="button" @keydown.stop />` }, mountOptions);
      const el = wrapper.find('#trigger').element;

      el.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      expect(isShown()).toBe(true);

      el.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', bubbles: true, cancelable: true
      }));
      await waitForNoTooltip();

      expect(isShown()).toBe(false);

      wrapper.unmount();
    });

    it('should keep the dismissing keypress from reaching a dialog underneath', async() => {
      const focusable = `<button v-clean-tooltip="{ content: 'Pull secrets', triggers: ['hover', 'focus'] }" type="button" />`;
      const wrapper = mount({ template: focusable }, mountOptions);
      const onDialogEscape = jest.fn();

      document.addEventListener('keydown', onDialogEscape);

      wrapper.element.focus();
      wrapper.element.dispatchEvent(new FocusEvent('focus'));
      await waitForTooltip();

      const escape = () => wrapper.element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', bubbles: true, cancelable: true
      }));

      // A dialog closes on Escape from a document listener of its own, so the press that dismisses
      // the tooltip has to stop there. The next one is the one that closes the dialog.
      escape();
      await waitForNoTooltip();

      expect(isShown()).toBe(false);
      expect(onDialogEscape).not.toHaveBeenCalled();

      escape();

      expect(onDialogEscape).toHaveBeenCalledTimes(1);

      document.removeEventListener('keydown', onDialogEscape);
      wrapper.unmount();
    });

    it('should leave the keypress alone when the trigger is only under the pointer', async() => {
      const onEscape = jest.fn();
      const wrapper = mount({
        template: `
          <div>
            <button id="trigger" v-clean-tooltip="'Pull secrets'" type="button" />
            <div id="menu" tabindex="0" @keydown.escape="onEscape" />
          </div>
        `,
        methods: { onEscape },
      }, mountOptions);
      const menu = wrapper.find('#menu').element as HTMLElement;

      wrapper.find('#trigger').element.dispatchEvent(new MouseEvent('mouseenter'));
      await waitForTooltip();

      menu.focus();
      menu.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', bubbles: true, cancelable: true
      }));
      await waitForNoTooltip();

      // The pointer happening to rest on a tooltip elsewhere must not swallow an Escape the user
      // aimed at whatever they are actually on.
      expect(isShown()).toBe(false);
      expect(onEscape).toHaveBeenCalled();

      wrapper.unmount();
    });
  });
});
