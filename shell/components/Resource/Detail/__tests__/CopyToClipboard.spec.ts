import { mount } from '@vue/test-utils';
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';
import { copyTextToClipboard } from '@shell/utils/clipboard';

// Mock the clipboard utility
jest.mock('@shell/utils/clipboard', () => ({ copyTextToClipboard: jest.fn() }));
jest.mock('vuex', () => ({ useStore: () => { } }));

describe('component: CopyToClipboard', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should render a button', () => {
    const wrapper = mount(CopyToClipboard, { props: { value: 'test-value' } });

    const button = wrapper.find('button');

    expect(button.exists()).toBe(true);
    expect(button.classes()).toContain('copy-to-clipboard');
  });

  it('should call copyTextToClipboard with the correct value on click', async() => {
    const testValue = 'my-secret-text';
    const wrapper = mount(CopyToClipboard, { props: { value: testValue } });

    await wrapper.find('button').trigger('click');

    expect(copyTextToClipboard).toHaveBeenCalledTimes(1);
    expect(copyTextToClipboard).toHaveBeenCalledWith(testValue);
  });

  it('should add the "copied" class on click and remove it after a timeout', async() => {
    const wrapper = mount(CopyToClipboard, { props: { value: 'test-value' } });

    const button = wrapper.find('button');

    await button.trigger('click');

    expect(button.classes()).toContain('copied');

    // Advance timers by 2 seconds
    jest.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('button').classes()).not.toContain('copied');
  });

  it('should not reset the timeout if clicked multiple times', async() => {
    const wrapper = mount(CopyToClipboard, { props: { value: 'test-value' } });

    const button = wrapper.find('button');

    // First click
    await button.trigger('click');
    expect(wrapper.find('button').classes()).toContain('copied');

    // Advance time by 1 second
    jest.advanceTimersByTime(1000);

    // Second click
    await button.trigger('click');
    expect(wrapper.find('button').classes()).toContain('copied');

    // The timeout should not have been reset. After another 1 second, the original timeout should fire.
    jest.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('button').classes()).not.toContain('copied');
  });
});
