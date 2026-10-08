import { defineComponent, h, ref } from 'vue';
import type { ComponentCustomProperties } from 'vue';
import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';

import { useTableViewsLink } from '@shell/composables/useTableViewsLink';
import { isNavigating } from '@shell/config/router/navigation-guards/navigation-state';
import { TABLE_VIEWS } from '@shell/store/prefs';
import type { LinkedTableView } from '@shell/utils/table-views/link';

jest.mock('@shell/config/router/navigation-guards/navigation-state', () => ({ isNavigating: jest.fn(() => false) }));

const VIEW: LinkedTableView = {
  name: 'All', query: 'state:active', columns: null, columnOrder: null, labelColumns: [], groupBy: null, sort: null, sortDescending: false
};

function setup(query: Record<string, string> = {}) {
  const failure = { catch: jest.fn() };
  const router = {
    currentRoute: ref({
      path: '/c/local/explorer/pod', query, hash: ''
    }),
    replace: jest.fn(() => failure),
  };
  const store = createStore({
    getters: { 'prefs/get': () => (key: string) => (key === TABLE_VIEWS ? { metadata: { version: 1, persistenceId: 'k1' }, payload: {} } : undefined) },
    actions: { 'prefs/set': jest.fn() },
  });
  // The only app-wide property the composable reads
  const globalProperties = { $router: router } as unknown as ComponentCustomProperties;
  let link: ReturnType<typeof useTableViewsLink>;
  const wrapper = mount(defineComponent({
    setup() {
      link = useTableViewsLink(() => 'pod');

      return () => h('div');
    }
  }), { global: { plugins: [store], config: { globalProperties } } });

  return {
    router, failure, link: link!, wrapper
  };
}

describe('useTableViewsLink', () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.mocked(isNavigating).mockReturnValue(false);
    jest.useRealTimers();
  });

  it('should write what the table shows to the URL once it settles', () => {
    const { router, link, wrapper } = setup();

    link.show(VIEW);
    jest.advanceTimersByTime(300);

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith(expect.objectContaining({ query: expect.objectContaining({ tableStateKey: 'k1' }) }));
    wrapper.unmount();
  });

  it('should wait while another page is on its way, so as not to call that navigation off', () => {
    const { router, link, wrapper } = setup();

    jest.mocked(isNavigating).mockReturnValue(true);
    link.show(VIEW);
    jest.advanceTimersByTime(900);
    expect(router.replace).not.toHaveBeenCalled();

    jest.mocked(isNavigating).mockReturnValue(false);
    jest.advanceTimersByTime(300);
    expect(router.replace).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('should let a write the route\'s guards turn down fail quietly', () => {
    const { failure, link, wrapper } = setup();

    link.show(VIEW);
    jest.advanceTimersByTime(300);

    expect(failure.catch).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('should drop the states a link opened the table with, as the query holds them now, and keep the rest', () => {
    const { router, link, wrapper } = setup({ stateFilter: 'running,active', other: 'kept' });

    link.show(VIEW);
    jest.advanceTimersByTime(300);

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith(expect.objectContaining({ query: expect.objectContaining({ other: 'kept', tableStateKey: 'k1' }) }));
    expect(router.replace).toHaveBeenCalledWith(expect.objectContaining({ query: expect.not.objectContaining({ stateFilter: expect.anything() }) }));
    wrapper.unmount();
  });

  it('should keep those states in the URL while another page is on its way', () => {
    const { router, link, wrapper } = setup({ stateFilter: 'running' });

    jest.mocked(isNavigating).mockReturnValue(true);
    link.show(VIEW);
    jest.advanceTimersByTime(900);

    expect(router.replace).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('should drop those states even when the table has nothing else to write', () => {
    const { router, link, wrapper } = setup({ stateFilter: 'running' });

    link.show(null);
    jest.advanceTimersByTime(300);

    expect(router.replace).toHaveBeenCalledWith(expect.objectContaining({ query: {} }));
    wrapper.unmount();
  });
});
