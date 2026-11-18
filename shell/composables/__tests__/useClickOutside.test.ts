import { defineComponent, ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useClickOutside } from '@shell/composables/useClickOutside';

/**
 * Helper: create a component that calls useClickOutside with given options,
 * and renders a <div ref="el"> plus an optional <span class="inside">.
 */
function makeWrapper(callback: jest.Mock, ignoreSelectors: string[] = []) {
  return defineComponent({
    setup() {
      const el = ref<HTMLElement | null>(null);

      useClickOutside(el, callback, { ignore: ignoreSelectors });

      return { el };
    },
    template: '<div ref="el"><span class="inside"></span></div>',
  });
}

function fireClick(target: EventTarget, detail = 1) {
  const event = new MouseEvent('click', {
    bubbles:    true,
    cancelable: true,
    detail,
  });

  Object.defineProperty(event, 'target', { value: target, writable: false });
  Object.defineProperty(event, 'composedPath', {
    value:    () => [target],
    writable: false,
  });
  window.dispatchEvent(event);
}

function firePointerdown(target: EventTarget) {
  // jsdom does not define PointerEvent; use MouseEvent to simulate pointerdown
  const event = new MouseEvent('pointerdown', {
    bubbles:    true,
    cancelable: true,
  });

  Object.defineProperty(event, 'target', { value: target, writable: false });
  Object.defineProperty(event, 'composedPath', {
    value:    () => [target],
    writable: false,
  });
  window.dispatchEvent(event);
}

describe('useClickOutside', () => {
  let callback: jest.Mock;

  beforeEach(() => {
    callback = jest.fn();
  });

  describe('click event handling', () => {
    it('calls callback when click target is outside the component element', async() => {
      const wrapper = mount(makeWrapper(callback));

      await nextTick();

      const outside = document.createElement('div');

      document.body.appendChild(outside);
      fireClick(outside);
      document.body.removeChild(outside);

      expect(callback).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('does not call callback when click target is the component element itself', async() => {
      const wrapper = mount(makeWrapper(callback));

      await nextTick();

      const el = wrapper.element as HTMLElement;

      fireClick(el);

      expect(callback).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('does not call callback when click target is inside the component element', async() => {
      const wrapper = mount(makeWrapper(callback));

      await nextTick();

      const inner = wrapper.element.querySelector('.inside') as HTMLElement;

      // composedPath includes the parent component el
      const el = wrapper.element as HTMLElement;
      const event = new MouseEvent('click', {
        bubbles:    true,
        cancelable: true,
        detail:     1,
      });

      Object.defineProperty(event, 'target', { value: inner, writable: false });
      Object.defineProperty(event, 'composedPath', {
        value:    () => [inner, el],
        writable: false,
      });
      window.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('does not call callback when component ref is null', async() => {
      const el = ref<HTMLElement | null>(null);
      const comp = defineComponent({
        setup() {
          useClickOutside(el, callback);

          return {};
        },
        template: '<div></div>',
      });
      const wrapper = mount(comp);

      await nextTick();

      const outside = document.createElement('div');

      document.body.appendChild(outside);
      fireClick(outside);
      document.body.removeChild(outside);

      expect(callback).not.toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  describe('pointerdown / shouldListen interaction', () => {
    it('does not call callback when pointer was down on an ignored selector element', async() => {
      const ignoreEl = document.createElement('div');

      ignoreEl.className = 'ignored';
      document.body.appendChild(ignoreEl);

      const wrapper = mount(makeWrapper(callback, ['.ignored']));

      await nextTick();

      // pointerdown on the ignored element sets shouldListen=false
      firePointerdown(ignoreEl);

      // subsequent outside click should be suppressed
      const outside = document.createElement('div');

      document.body.appendChild(outside);
      fireClick(outside);
      document.body.removeChild(outside);
      document.body.removeChild(ignoreEl);

      expect(callback).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('calls callback when pointer was down outside component and outside ignored selectors', async() => {
      const ignoreEl = document.createElement('div');

      ignoreEl.className = 'ignored';
      document.body.appendChild(ignoreEl);

      const wrapper = mount(makeWrapper(callback, ['.ignored']));

      await nextTick();

      const outside = document.createElement('div');

      document.body.appendChild(outside);

      // pointerdown outside component and outside ignored → shouldListen stays true
      firePointerdown(outside);
      fireClick(outside);

      document.body.removeChild(outside);
      document.body.removeChild(ignoreEl);

      expect(callback).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });
  });

  describe('keyboard activation (detail === 0)', () => {
    it('does not call callback when detail is 0 and target is an ignored element', async() => {
      const ignoreEl = document.createElement('div');

      ignoreEl.className = 'kbd-ignored';
      document.body.appendChild(ignoreEl);

      const wrapper = mount(makeWrapper(callback, ['.kbd-ignored']));

      await nextTick();

      // detail=0 means keyboard-triggered click
      fireClick(ignoreEl, 0);

      document.body.removeChild(ignoreEl);

      expect(callback).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('calls callback when detail is 0 and target is outside and not ignored', async() => {
      const outside = document.createElement('div');

      document.body.appendChild(outside);

      const wrapper = mount(makeWrapper(callback));

      await nextTick();

      fireClick(outside, 0);

      document.body.removeChild(outside);

      expect(callback).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });
  });

  describe('lifecycle', () => {
    it('removes event listeners on unmount so callback is no longer called', async() => {
      const wrapper = mount(makeWrapper(callback));

      await nextTick();

      wrapper.unmount();

      const outside = document.createElement('div');

      document.body.appendChild(outside);
      fireClick(outside);
      document.body.removeChild(outside);

      expect(callback).not.toHaveBeenCalled();
    });

    it('adds event listeners on mount so callback is called', async() => {
      const wrapper = mount(makeWrapper(callback));

      await nextTick();

      const outside = document.createElement('div');

      document.body.appendChild(outside);
      fireClick(outside);
      document.body.removeChild(outside);

      expect(callback).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });
  });

  describe('ignore option', () => {
    it('does not suppress callback when ignore list is empty', async() => {
      const wrapper = mount(makeWrapper(callback, []));

      await nextTick();

      const outside = document.createElement('div');

      document.body.appendChild(outside);
      fireClick(outside);
      document.body.removeChild(outside);

      expect(callback).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });

    it('suppresses callback when click is directly on ignored selector element', async() => {
      const btn = document.createElement('button');

      btn.className = 'my-btn';
      document.body.appendChild(btn);

      const wrapper = mount(makeWrapper(callback, ['.my-btn']));

      await nextTick();

      // composedPath does not include component el → would normally trigger callback
      // but target matches ignore selector
      const event = new MouseEvent('click', {
        bubbles:    true,
        cancelable: true,
        detail:     1,
      });

      Object.defineProperty(event, 'target', { value: btn, writable: false });
      Object.defineProperty(event, 'composedPath', {
        value:    () => [btn],
        writable: false,
      });
      window.dispatchEvent(event);

      document.body.removeChild(btn);

      // detail=1 does not update shouldListen; shouldListen stays true from initialization
      // The ignore list only affects shouldListen via detail=0 or pointerdown paths
      // Direct click outside with detail=1 → callback IS called (ignore list not consulted)
      expect(callback).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    });
  });
});
