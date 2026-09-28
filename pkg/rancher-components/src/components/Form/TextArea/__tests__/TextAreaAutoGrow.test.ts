import { mount } from '@vue/test-utils';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';

describe('component: TextAreaAutoGrow', () => {
  it('should recalculate its height when the value changes programmatically and resizeOnValueChangeAndResizeWindow is set', async() => {
    const wrapper = mount(TextAreaAutoGrow, { props: { value: 'initial', resizeOnValueChangeAndResizeWindow: true } });

    // queueResize is the (debounced) entrypoint that triggers autoSize
    const queueResize = jest.fn();

    wrapper.vm.queueResize = queueResize;

    await wrapper.setProps({ value: 'a\nmuch\nlonger\nvalue\nset\nfrom\noutside' });

    expect(queueResize).toHaveBeenCalledWith();
  });

  it('should not recalculate its height on programmatic value change by default', async() => {
    const wrapper = mount(TextAreaAutoGrow, { props: { value: 'initial' } });

    const queueResize = jest.fn();

    wrapper.vm.queueResize = queueResize;

    await wrapper.setProps({ value: 'a\nmuch\nlonger\nvalue\nset\nfrom\noutside' });

    expect(queueResize).not.toHaveBeenCalled();
  });

  it('should recalculate its height synchronously on user input', async() => {
    const component = TextAreaAutoGrow as unknown as { methods: Record<string, () => void> };
    const autoSizeSpy = jest.spyOn(component.methods, 'autoSize');

    const wrapper = mount(TextAreaAutoGrow, { props: { value: '' } });

    autoSizeSpy.mockClear();

    await wrapper.find('textarea').setValue('typed value');

    // Running autoSize directly (not via the debounced queueResize) keeps
    // the resize in the same frame as the keypress and prevents the visible
    // up/down jump described in #6041.
    expect(autoSizeSpy).toHaveBeenCalledWith();

    autoSizeSpy.mockRestore();
  });

  it('should register a window resize listener when resizeOnValueChangeAndResizeWindow is set', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');

    const wrapper = mount(TextAreaAutoGrow, { props: { value: 'initial', resizeOnValueChangeAndResizeWindow: true } });

    const resizeListener = addSpy.mock.calls.find(([event]) => event === 'resize')?.[1];

    expect(resizeListener).toBe(wrapper.vm.queueResize);

    addSpy.mockRestore();
  });

  it('should not register a window resize listener by default', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');

    mount(TextAreaAutoGrow, { props: { value: 'initial' } });

    const resizeListener = addSpy.mock.calls.find(([event]) => event === 'resize')?.[1];

    expect(resizeListener).toBeUndefined();

    addSpy.mockRestore();
  });

  it('should recalculate its height when a window resize fires and resizeOnValueChangeAndResizeWindow is set', () => {
    jest.useFakeTimers();
    const component = TextAreaAutoGrow as unknown as { methods: Record<string, () => void> };
    const autoSizeSpy = jest.spyOn(component.methods, 'autoSize');

    mount(TextAreaAutoGrow, { props: { value: 'initial', resizeOnValueChangeAndResizeWindow: true } });
    autoSizeSpy.mockClear();

    window.dispatchEvent(new Event('resize'));
    jest.advanceTimersByTime(150); // queueResize is debounced (100ms)

    expect(autoSizeSpy).toHaveBeenCalledWith(expect.any(Event));

    autoSizeSpy.mockRestore();
    jest.useRealTimers();
  });

  it('should remove the window resize listener when unmounted', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const wrapper = mount(TextAreaAutoGrow, { props: { value: 'initial', resizeOnValueChangeAndResizeWindow: true } });
    const { queueResize } = wrapper.vm;

    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', queueResize);

    removeSpy.mockRestore();
  });

  describe('autoSize', () => {
    // The measurement path uses a hidden mirror div; stub it so tests can
    // assert autoSize's height/overflow decisions without depending on
    // jsdom's (fixed) layout numbers.
    const stubMeasurement = (wrapper: ReturnType<typeof mount>, height: number) => {
      (wrapper.vm as unknown as { measureContentHeight: () => number }).measureContentHeight = () => height;
    };

    it('should size the textarea to its content when it fits within maxHeight', () => {
      const wrapper = mount(TextAreaAutoGrow, {
        props: {
          value: 'a\nb\nc', minHeight: 25, maxHeight: 200
        }
      });
      const el = wrapper.find('textarea').element as HTMLTextAreaElement;

      stubMeasurement(wrapper, 80);
      wrapper.vm.autoSize();

      expect(el.style.height).toBe('80px');
      expect(el.style.overflowY).toBe('hidden');
    });

    it('should cap the textarea at maxHeight and enable scrolling when content overflows', () => {
      const wrapper = mount(TextAreaAutoGrow, {
        props: {
          value: 'many\nlines', minHeight: 25, maxHeight: 200
        }
      });
      const el = wrapper.find('textarea').element as HTMLTextAreaElement;

      stubMeasurement(wrapper, 500);
      wrapper.vm.autoSize();

      expect(el.style.height).toBe('200px');
      expect(el.style.overflowY).toBe('auto');
    });

    it('should preserve scrollTop when the content overflows so the caret does not jump', () => {
      const wrapper = mount(TextAreaAutoGrow, {
        props: {
          value: 'many\nlines', minHeight: 25, maxHeight: 200
        }
      });
      const el = wrapper.find('textarea').element as HTMLTextAreaElement;

      stubMeasurement(wrapper, 500);

      let scrollTop = 120;

      Object.defineProperty(el, 'scrollTop', {
        configurable: true,
        get:          () => scrollTop,
        set:          (v: number) => {
          scrollTop = v;
        },
      });

      wrapper.vm.autoSize();

      expect(scrollTop).toBe(120);
    });

    it('should never shrink the textarea below minHeight', () => {
      const wrapper = mount(TextAreaAutoGrow, {
        props: {
          value: '', minHeight: 40, maxHeight: 200
        }
      });
      const el = wrapper.find('textarea').element as HTMLTextAreaElement;

      stubMeasurement(wrapper, 10);
      wrapper.vm.autoSize();

      expect(el.style.height).toBe('40px');
      expect(el.style.overflowY).toBe('hidden');
    });

    it('should not shrink the textarea to 1px during measurement (avoids the up/down jump in #6041)', () => {
      const wrapper = mount(TextAreaAutoGrow, {
        props: {
          value: 'x', minHeight: 25, maxHeight: 500
        }
      });
      const el = wrapper.find('textarea').element as HTMLTextAreaElement;
      const heightsSeen: string[] = [];
      const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');

      Object.defineProperty(el, 'style', {
        configurable: true,
        get() {
          const style = descriptor?.get?.call(this) as CSSStyleDeclaration;
          const proxy = new Proxy(style, {
            set(target, prop, value) {
              if (prop === 'height') {
                heightsSeen.push(value as string);
              }
              (target as unknown as Record<string | symbol, unknown>)[prop] = value;

              return true;
            },
          });

          return proxy;
        },
      });

      stubMeasurement(wrapper, 100);
      wrapper.vm.autoSize();

      expect(heightsSeen).not.toContain('1px');
      expect(heightsSeen).toContain('100px');
    });
  });
});
