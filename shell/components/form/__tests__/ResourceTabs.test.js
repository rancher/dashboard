import ResourceTabs from '@shell/components/form/ResourceTabs/index.vue';
import Tab from '@shell/components/Tabbed/Tab';
import { shallowMount } from '@vue/test-utils';
describe('component: ResourceTabs', () => {
  it('should be true for showEvent prop when the values of isView, needEvents and hasEvents are true', () => {
    const localThis = {
      isView:     true,
      needEvents: true,
      hasEvents:  true
    };

    expect(ResourceTabs.computed.showEvents.call(localThis)).toBe(true);
  });
  it.each([
    {
      isView:     false,
      needEvents: true,
      hasEvents:  true
    },
    {
      isView:     true,
      needEvents: false,
      hasEvents:  true
    },
    {
      isView:     true,
      needEvents: true,
      hasEvents:  false
    },
    {
      isView:     false,
      needEvents: false,
      hasEvents:  false
    }
  ])('should be false for showEvent prop when isView is $isView, needEvents is $needEvents and hasEvents is $hasEvents', (localThis) => {
    expect(ResourceTabs.computed.showEvents.call(localThis)).toBe(false);
  });

  it('should show event tab', () => {
    const wrapper = shallowMount(ResourceTabs, {
      mocks: {
        $store: {
          getters: {
            currentStore:        jest.fn(() => 'cluster'),
            'cluster/schemaFor': jest.fn(() => true),
            'i18n/t':            jest.fn()
          },
          dispatch: jest.fn(() => Promise.resolve())
        }
      }
    });

    expect(wrapper.vm.showEvents).toBe(true);
    expect(wrapper.findAllComponents(Tab).filter(t => t.props('labelKey') === 'resourceTabs.events.tab')).toHaveLength(1);
  });
  it('should remove event tab', () => {
    const wrapper = shallowMount(ResourceTabs, {
      propsData: { needEvents: false },
      mocks:     {
        $store: {
          getters: {
            currentStore:        jest.fn(() => 'cluster'),
            'cluster/schemaFor': jest.fn(() => true),
            'i18n/t':            jest.fn()
          },
          dispatch: jest.fn(() => Promise.resolve())
        }
      }
    });

    expect(wrapper.vm.showEvents).toBe(false);
    expect(wrapper.findAllComponents(Tab).filter(t => t.props('labelKey') === 'resourceTabs.events.tab')).toHaveLength(0);
  });
});
