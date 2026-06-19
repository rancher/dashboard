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

  it('should recalculate its height on user input', async() => {
    const wrapper = mount(TextAreaAutoGrow, { props: { value: '' } });

    const queueResize = jest.fn();

    wrapper.vm.queueResize = queueResize;

    await wrapper.find('textarea').setValue('typed value');

    expect(queueResize).toHaveBeenCalledWith();
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
});
