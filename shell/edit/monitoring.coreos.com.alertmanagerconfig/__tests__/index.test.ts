/* eslint-disable import/first */
global.PointerEvent = class PointerEvent extends Event {};

import { shallowMount } from '@vue/test-utils';
import { EDITOR_MODES } from '@shell/components/YamlEditor.vue';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import Index from '../index.vue';

describe('monitoring.coreos.com.alertmanagerconfig/index.vue', () => {
  it('should render correctly', () => {
    const valueMock = {
      applyDefaults: jest.fn(),
      spec:          {
        receivers: [
          { name: 'receiver1', type: 'webhook' },
          { name: 'receiver2', type: 'email' },
        ],
      },
      getCreateReceiverRoute: jest.fn(() => ({ name: 'create-receiver' })),
      getReceiverDetailLink:  jest.fn((name) => `detail-${ name }`),
    };

    const wrapper = shallowMount(Index, {
      propsData: {
        value: valueMock,
        mode:  'create',
      },
      global: {
        mocks: {
          $store: {
            getters:  { currentProduct: { inStore: 'test' } },
            dispatch: jest.fn(() => Promise.resolve({ receiverSchema: {} })),
          },
          $router:     { push: jest.fn() },
          $route:      { name: 'test-route' },
          $fetchState: { pending: false },
        }
      },
      stubs: {
        CruResource:       true,
        NameNsDescription: true,
        Tabbed:            true,
        Tab:               true,
        RouteConfig:       true,
        ResourceTable:     true,
        ActionMenu:        true,
        Loading:           true,
      }
    });

    // Ensure the component is rendered
    expect(wrapper.exists()).toBe(true);

    // Assert that applyDefaults is called
    expect(valueMock.applyDefaults).toHaveBeenCalledTimes(1);

    // Assert receiverOptions are correctly populated from value.spec.receivers
    expect(wrapper.vm.receiverOptions).toStrictEqual(['receiver1', 'receiver2']);

    // Assert createReceiverLink is correctly set
    expect(wrapper.vm.createReceiverLink).toStrictEqual({ name: 'create-receiver' });

    // Assert that receiverTableHeaders has the expected structure (basic check)
    expect(wrapper.vm.receiverTableHeaders.length).toBeGreaterThan(0);
    expect(wrapper.vm.receiverTableHeaders[0].name).toBe('name');
    expect(wrapper.vm.receiverTableHeaders[1].name).toBe('type');
  });

  // Additional test for editorMode computed property
  it('editorMode should return VIEW_CODE when mode is _VIEW', () => {
    const valueMock = {
      applyDefaults:          jest.fn(),
      spec:                   { receivers: [] },
      getCreateReceiverRoute: jest.fn(),
      getReceiverDetailLink:  jest.fn(),
    };

    const wrapper = shallowMount(Index, {
      propsData: {
        value: valueMock,
        mode:  _VIEW, // Set mode to _VIEW
      },
      global: {
        mocks: {
          $store: {
            getters:  { currentProduct: { inStore: 'test' } },
            dispatch: jest.fn(() => Promise.resolve({ receiverSchema: {} })),
          },
          $router:     { push: jest.fn() },
          $route:      { name: 'test-route' },
          $fetchState: { pending: false },
        },
      },
      stubs: {
        CruResource:       true,
        NameNsDescription: true,
        Tabbed:            true,
        Tab:               true,
        RouteConfig:       true,
        ResourceTable:     true,
        ActionMenu:        true,
        Loading:           true,
      }
    });

    expect(wrapper.vm.editorMode).toBe(EDITOR_MODES.VIEW_CODE);
  });

  it('editorMode should return EDIT_CODE when mode is not _VIEW', () => {
    const valueMock = {
      applyDefaults:          jest.fn(),
      spec:                   { receivers: [] },
      getCreateReceiverRoute: jest.fn(),
      getReceiverDetailLink:  jest.fn(),
    };

    const wrapper = shallowMount(Index, {
      propsData: {
        value: valueMock,
        mode:  _EDIT, // Set mode to _EDIT
      },
      global: {
        mocks: {
          $store: {
            getters:  { currentProduct: { inStore: 'test' } },
            dispatch: jest.fn(() => Promise.resolve({ receiverSchema: {} })),
          },
          $router:     { push: jest.fn() },
          $route:      { name: 'test-route' },
          $fetchState: { pending: false },
        },
      },
      stubs: {
        CruResource:       true,
        NameNsDescription: true,
        Tabbed:            true,
        Tab:               true,
        RouteConfig:       true,
        ResourceTable:     true,
        ActionMenu:        true,
        Loading:           true,
      }
    });

    expect(wrapper.vm.editorMode).toBe(EDITOR_MODES.EDIT_CODE);
  });

  it('translateReceiverTypes method translates receiver types', () => {
    const valueMock = {
      applyDefaults:          jest.fn(),
      spec:                   { receivers: [] },
      getCreateReceiverRoute: jest.fn(),
      getReceiverDetailLink:  jest.fn(),
    };

    const wrapper = shallowMount(Index, {
      propsData: {
        value: valueMock,
        mode:  'create',
      },
      global: {
        mocks: {
          $store: {
            getters:  { currentProduct: { inStore: 'test' } },
            dispatch: jest.fn(() => Promise.resolve({ receiverSchema: {} })),
          },
          $router:     { push: jest.fn() },
          $route:      { name: 'test-route' },
          $fetchState: { pending: false },
        },
      },
      stubs: {
        CruResource:       true,
        NameNsDescription: true,
        Tabbed:            true,
        Tab:               true,
        RouteConfig:       true,
        ResourceTable:     true,
        ActionMenu:        true,
        Loading:           true,
      }
    });

    // Ensure receiverTypes is initialized, then call the method
    const originalReceiverTypes = [
      { label: 'alertmanagerConfigReceiver.alerta', value: 'alerta' },
      { label: 'alertmanagerConfigReceiver.dingtalk', value: 'dingtalk' }
    ];

    // Manually set receiverTypes for the test (it's normally populated from an import)
    // In a real scenario, you'd mock the import or ensure it's loaded before the test.
    // For this test, we'll directly manipulate the vm.
    wrapper.setData({ receiverTypes: originalReceiverTypes });

    const translatedTypes = wrapper.vm.translateReceiverTypes();

    expect(translatedTypes).toStrictEqual([
      { label: '%alertmanagerConfigReceiver.alerta%', value: 'alerta' },
      { label: '%alertmanagerConfigReceiver.dingtalk%', value: 'dingtalk' }
    ]);
  });
});
