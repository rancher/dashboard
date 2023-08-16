import { mount } from '@vue/test-utils';
import PodsUsage from '@shell/components/formatter/PodsUsage.vue';

describe('component: PodsUsage', () => {
  it('should display podsUsage value', () => {
    const wrapper = mount(PodsUsage, {
      propsData: {
        row: {
          mgmt: {
            status: {
              requested:   { pods: 10 },
              allocatable: { pods: 20 }
            }
          }
        }
      },
      mocks: { $store: { dispatch: { 'management/request': jest.fn() } } }
    });

    const element = wrapper.find('p').element;

    expect(element.textContent).toBeDefined();
    expect(element.textContent).toBe('10/20');
  });
  it('should display dash when there are no totalPods', () => {
    const wrapper = mount(PodsUsage, {
      propsData: {
        row: {
          mgmt: {
            status: {
              requested:   { pods: 10 },
              allocatable: { pods: 0 }
            }
          }
        }
      },
      mocks: { $store: { dispatch: { 'management/request': jest.fn() } } }
    });

    const element = wrapper.find('p').element;

    expect(element.textContent).toBeDefined();
    expect(element.textContent).toBe('—');
  });
});
