import { mount } from '@vue/test-utils';
import Loading from '@shell/components/Loading.vue';
import { announce } from '@shell/utils/aria-announce';

jest.mock('@shell/utils/aria-announce', () => ({ announce: jest.fn() }));

const mountWith = (props = {}) => mount(Loading, {
  props,
  global: { mocks: { $store: { getters: { 'i18n/t': () => 'Loading&hellip;' } } } }
});

describe('component: Loading', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (announce as jest.Mock).mockClear();
  });

  afterEach(() => jest.useRealTimers());

  it('should announce the wait once the overlay becomes visible', () => {
    mountWith();

    expect(announce).not.toHaveBeenCalled();

    jest.advanceTimersByTime(250);

    expect(announce).toHaveBeenCalledWith('Loading&hellip;');
  });

  it('should stay silent while it is not loading', () => {
    mountWith({ loading: false });

    jest.advanceTimersByTime(250);

    expect(announce).not.toHaveBeenCalled();
  });

  it('should stay silent when announceStatus is turned off', () => {
    mountWith({ announceStatus: false });

    jest.advanceTimersByTime(250);

    expect(announce).not.toHaveBeenCalled();
  });

  // A load that resolves inside the delay never shows an overlay, so there is no wait to report.
  it('should stay silent when the component is torn down before the overlay appears', () => {
    mountWith().unmount();

    jest.advanceTimersByTime(250);

    expect(announce).not.toHaveBeenCalled();
  });
});
