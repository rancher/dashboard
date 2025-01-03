import { mount } from '@vue/test-utils';
import PodsUsage from '@shell/components/formatter/PodsUsage.vue';

describe('component: PodsUsage', () => {
  it('should display podsUsage value', () => {
    const wrapper = mount(PodsUsage, {
      props: {
        row: {
          isReady: true,
          mgmt:    {
            status: {
              requested:   { pods: 10 },
              allocatable: { pods: 20 }
            }
          }
        }
      },
      global: { mocks: { $store: { dispatch: { 'management/request': jest.fn() } } } }
    });

    const { element } = wrapper.find('p');

    expect(element.textContent).toBeDefined();
    expect(element.textContent).toBe('10/20');
  });
  it('should display dash when there are no totalPods', () => {
    const wrapper = mount(PodsUsage, {
      props: {
        row: {
          isReady: true,
          mgmt:    {
            status: {
              requested:   { pods: 10 },
              allocatable: { pods: 0 }
            }
          }
        }
      },
      global: { mocks: { $store: { dispatch: { 'management/request': jest.fn() } } } }
    });

    const { element } = wrapper.find('p');

    expect(element.textContent).toBeDefined();
    expect(element.textContent).toBe('—');
  });
  it('should display a dash when there is no management cluster ti query for status', () => {
    const wrapper = mount(PodsUsage, { props: { row: { isReady: true } } });

    const { element } = wrapper.find('p');

    expect(element.textContent).toBeDefined();
    expect(element.textContent).toBe('—');
  });
});
