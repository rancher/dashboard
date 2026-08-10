import { defineComponent, ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import {
  getFirstFocusableElement,
  DEFAULT_FOCUS_TRAP_OPTS,
  useBasicSetupFocusTrap,
  useWatcherBasedSetupFocusTrapWithDestroyIncluded,
} from '@shell/composables/focusTrap';

const mockActivate = jest.fn();
const mockDeactivate = jest.fn();
const mockCreateFocusTrap = jest.fn(() => ({
  activate:   mockActivate,
  deactivate: mockDeactivate,
}));

jest.mock('focus-trap', () => ({ createFocusTrap: (...args: any[]) => mockCreateFocusTrap(...args) }));

describe('composable: focusTrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getFirstFocusableElement', () => {
    it('returns the first non-disabled button', () => {
      const container = document.createElement('div');

      container.innerHTML = '<button>Click</button><input />';
      const result = getFirstFocusableElement(container);

      expect(result.tagName).toStrictEqual('BUTTON');
    });

    it('skips disabled elements', () => {
      const container = document.createElement('div');

      container.innerHTML = '<button disabled>Disabled</button><input />';
      const result = getFirstFocusableElement(container);

      expect(result.tagName).toStrictEqual('INPUT');
    });

    it('returns document.body when no focusable elements exist', () => {
      const container = document.createElement('div');

      container.innerHTML = '<div>No focusable</div>';
      const result = getFirstFocusableElement(container);

      expect(result).toStrictEqual(document.body);
    });

    it('returns document.body when all elements are disabled', () => {
      const container = document.createElement('div');

      container.innerHTML = '<button disabled>Disabled</button><input disabled />';
      const result = getFirstFocusableElement(container);

      expect(result).toStrictEqual(document.body);
    });

    it('finds anchor tags as focusable', () => {
      const container = document.createElement('div');

      container.innerHTML = '<a href="#">Link</a>';
      const result = getFirstFocusableElement(container);

      expect(result.tagName).toStrictEqual('A');
    });

    it('finds elements with tabindex that is not -1', () => {
      const container = document.createElement('div');

      container.innerHTML = '<div tabindex="0">Focusable div</div><div tabindex="-1">Non-focusable</div>';
      const result = getFirstFocusableElement(container);

      expect(result.getAttribute('tabindex')).toStrictEqual('0');
    });

    it('uses document as default element when called with no argument', () => {
      const button = document.createElement('button');

      button.textContent = 'Test';
      document.body.appendChild(button);
      const result = getFirstFocusableElement();

      expect(result.tagName).toStrictEqual('BUTTON');
      document.body.removeChild(button);
    });
  });

  describe('DEFAULT_FOCUS_TRAP_OPTS', () => {
    it('has escapeDeactivates set to true', () => {
      expect(DEFAULT_FOCUS_TRAP_OPTS.escapeDeactivates).toStrictEqual(true);
    });

    it('has allowOutsideClick set to true', () => {
      expect(DEFAULT_FOCUS_TRAP_OPTS.allowOutsideClick).toStrictEqual(true);
    });
  });

  describe('useBasicSetupFocusTrap', () => {
    it('creates and activates focus trap on mount when passed an HTMLElement', async() => {
      const el = document.createElement('div');
      const wrapper = mount(defineComponent({
        setup() {
          useBasicSetupFocusTrap(el);
        },
        template: '<div></div>',
      }));

      await nextTick();

      expect(mockCreateFocusTrap).toHaveBeenCalledWith(el, DEFAULT_FOCUS_TRAP_OPTS);
      expect(mockActivate).toHaveBeenCalled();
      wrapper.unmount();
    });

    it('creates trap using document.querySelector when passed a string selector', async() => {
      const el = document.createElement('div');

      el.id = 'trap-target';
      document.body.appendChild(el);

      const wrapper = mount(defineComponent({
        setup() {
          useBasicSetupFocusTrap('#trap-target');
        },
        template: '<div></div>',
      }));

      await nextTick();

      expect(mockCreateFocusTrap).toHaveBeenCalledWith(el, DEFAULT_FOCUS_TRAP_OPTS);
      wrapper.unmount();
      document.body.removeChild(el);
    });

    it('deactivates focus trap on unmount', async() => {
      const el = document.createElement('div');
      const wrapper = mount(defineComponent({
        setup() {
          useBasicSetupFocusTrap(el);
        },
        template: '<div></div>',
      }));

      await nextTick();
      wrapper.unmount();

      expect(mockDeactivate).toHaveBeenCalled();
    });

    it('accepts custom opts and passes them to createFocusTrap', async() => {
      const el = document.createElement('div');
      const customOpts = {
        escapeDeactivates: false,
        allowOutsideClick: false,
      };
      const wrapper = mount(defineComponent({
        setup() {
          useBasicSetupFocusTrap(el, customOpts);
        },
        template: '<div></div>',
      }));

      await nextTick();

      expect(mockCreateFocusTrap).toHaveBeenCalledWith(el, customOpts);
      wrapper.unmount();
    });
  });

  describe('useWatcherBasedSetupFocusTrapWithDestroyIncluded', () => {
    it('does not create trap when watchVar is initially false', async() => {
      const watchVar = ref(false);
      const el = document.createElement('div');

      const wrapper = mount(defineComponent({
        setup() {
          useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar, el);
        },
        template: '<div></div>',
      }));

      await nextTick();

      expect(mockCreateFocusTrap).not.toHaveBeenCalled();
      wrapper.unmount();
    });

    it('creates and activates trap when watchVar becomes true', async() => {
      const watchVar = ref(false);
      const el = document.createElement('div');

      const wrapper = mount(defineComponent({
        setup() {
          useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar, el);
        },
        template: '<div></div>',
      }));

      watchVar.value = true;
      await nextTick();
      await nextTick();
      await nextTick();
      jest.runAllTimers();

      expect(mockCreateFocusTrap).toHaveBeenCalledWith(el, DEFAULT_FOCUS_TRAP_OPTS);
      expect(mockActivate).toHaveBeenCalled();
      wrapper.unmount();
    });

    it('deactivates trap when watchVar becomes false (no unmount hook)', async() => {
      const watchVar = ref(false);
      const el = document.createElement('div');

      const wrapper = mount(defineComponent({
        setup() {
          useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar, el);
        },
        template: '<div></div>',
      }));

      watchVar.value = true;
      await nextTick();
      await nextTick();
      jest.runAllTimers();

      watchVar.value = false;
      await nextTick();

      expect(mockDeactivate).toHaveBeenCalled();
      wrapper.unmount();
    });

    it('deactivates on unmount when useUnmountHook is true', async() => {
      const watchVar = ref(false);
      const el = document.createElement('div');

      const wrapper = mount(defineComponent({
        setup() {
          useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar, el, DEFAULT_FOCUS_TRAP_OPTS, true);
        },
        template: '<div></div>',
      }));

      watchVar.value = true;
      await nextTick();
      await nextTick();
      jest.runAllTimers();

      mockDeactivate.mockClear();
      wrapper.unmount();

      expect(mockDeactivate).toHaveBeenCalled();
    });

    it('does not create a second trap if watchVar becomes true again', async() => {
      const watchVar = ref(false);
      const el = document.createElement('div');

      const wrapper = mount(defineComponent({
        setup() {
          useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar, el);
        },
        template: '<div></div>',
      }));

      watchVar.value = true;
      await nextTick();
      await nextTick();
      jest.runAllTimers();

      watchVar.value = false;
      await nextTick();
      watchVar.value = true;
      await nextTick();
      await nextTick();
      jest.runAllTimers();

      // createFocusTrap called only once because instance already exists from first true
      expect(mockCreateFocusTrap).toHaveBeenCalledTimes(1);
      wrapper.unmount();
    });

    it('resolves string selector to HTMLElement when watchVar becomes true', async() => {
      const watchVar = ref(false);
      const el = document.createElement('div');

      el.id = 'watcher-trap-target';
      document.body.appendChild(el);

      const wrapper = mount(defineComponent({
        setup() {
          useWatcherBasedSetupFocusTrapWithDestroyIncluded(watchVar, '#watcher-trap-target');
        },
        template: '<div></div>',
      }));

      watchVar.value = true;
      await nextTick();
      await nextTick();
      jest.runAllTimers();

      expect(mockCreateFocusTrap).toHaveBeenCalledWith(el, DEFAULT_FOCUS_TRAP_OPTS);
      wrapper.unmount();
      document.body.removeChild(el);
    });
  });
});
