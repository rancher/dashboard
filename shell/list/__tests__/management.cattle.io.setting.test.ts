import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ManagementSetting from '@shell/list/management.cattle.io.setting.vue';
import { SETTING } from '@shell/config/settings';

const mockStore = {
  getters: {
    'prefs/get': () => false,
    'i18n/t':    (key: string) => key,
  },
  dispatch: jest.fn()
};

const mockRoute = {
  hash:   '',
  params: {}
};

const mockRouter = {
  push:    jest.fn(),
  replace: jest.fn()
};

// Mock scrollIntoView
const mockScrollIntoView = jest.fn();

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value:    mockScrollIntoView,
  writable: true
});

// Mock querySelector
const mockQuerySelector = jest.fn();

Object.defineProperty(document, 'querySelector', {
  value:    mockQuerySelector,
  writable: true
});

describe('managementSetting - Scroll Behavior', () => {
  let wrapper: any;

  const createWrapper = (routeHash = '') => {
    const route = { ...mockRoute, hash: routeHash };

    return mount(ManagementSetting, {
      global: {
        mocks: {
          $store:      mockStore,
          $route:      route,
          $router:     mockRouter,
          $fetchState: { pending: false }
        },
        stubs: {
          Loading: true,
          Banner:  true,
          Setting: true
        }
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockScrollIntoView.mockClear();
    mockQuerySelector.mockClear();

    // Mock successful API response with cluster agent setting
    mockStore.dispatch.mockResolvedValue([
      {
        id:               SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS,
        value:            '{"enabled": true}',
        default:          '{"enabled": false}',
        availableActions: ['edit']
      },
      {
        id:               SETTING.FLEET_AGENT_DEFAULT_PRIORITY_CLASS,
        value:            '{"enabled": true}',
        default:          '{"enabled": false}',
        availableActions: ['edit']
      }
    ]);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should scroll to hash anchor after data is loaded', async() => {
    const mockElement = document.createElement('div');

    mockQuerySelector.mockReturnValue(mockElement);

    wrapper = createWrapper('#cluster-agent-default-priority-class');

    // Trigger fetch manually since we can't easily test the async fetch hook
    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await nextTick();

    expect(mockQuerySelector).toHaveBeenCalledWith('#cluster-agent-default-priority-class');
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block:    'start'
    });
  });

  it('should not scroll if hash is empty', async() => {
    wrapper = createWrapper('');

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await nextTick();

    expect(mockQuerySelector).not.toHaveBeenCalled();
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should not scroll if element is not found', async() => {
    mockQuerySelector.mockReturnValue(null);

    wrapper = createWrapper('#non-existent-element');

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await nextTick();

    expect(mockQuerySelector).toHaveBeenCalledWith('#non-existent-element');
    expect(mockScrollIntoView).not.toHaveBeenCalled();
  });

  it('should scroll to fleet agent setting hash', async() => {
    const mockElement = document.createElement('div');

    mockQuerySelector.mockReturnValue(mockElement);

    wrapper = createWrapper('#fleet-agent-default-priority-class');

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await nextTick();

    expect(mockQuerySelector).toHaveBeenCalledWith('#fleet-agent-default-priority-class');
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block:    'start'
    });
  });

  it('should handle hash with special characters', async() => {
    const mockElement = document.createElement('div');

    mockQuerySelector.mockReturnValue(mockElement);

    wrapper = createWrapper('#setting-with-special-chars_123');

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await nextTick();

    expect(mockQuerySelector).toHaveBeenCalledWith('#setting-with-special-chars_123');
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block:    'start'
    });
  });

  it('should render settings with correct IDs for anchors', async() => {
    wrapper = createWrapper();

    // Manually set the data to simulate successful fetch
    wrapper.vm.settings = [
      {
        id:          SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS,
        description: 'test-description',
        data:        { value: 'test' },
        customized:  false,
        fromEnv:     false,
        hasActions:  true
      }
    ];
    wrapper.vm.provisioningSettings = [
      {
        id:          SETTING.FLEET_AGENT_DEFAULT_PRIORITY_CLASS,
        description: 'test-description',
        data:        { value: 'test' },
        customized:  false,
        fromEnv:     false,
        hasActions:  true
      }
    ];

    await nextTick();

    const settingDivs = wrapper.findAll('div[id]');
    const ids = settingDivs.map((div: any) => div.attributes('id'));

    expect(ids).toContain(SETTING.CLUSTER_AGENT_DEFAULT_PRIORITY_CLASS);
    expect(ids).toContain(SETTING.FLEET_AGENT_DEFAULT_PRIORITY_CLASS);
  });
});
