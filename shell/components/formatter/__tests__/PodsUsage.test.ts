import { mount } from '@vue/test-utils';
import PodsUsage from '@shell/components/formatter/PodsUsage.vue';

describe('component: PodsUsage', () => {
  it('should not display values if data is not ready', () => {
    const wrapper = mount(PodsUsage, {
      propsData: { row: {} },
      mocks:     { $store: { dispatch: { 'management/request': jest.fn() } } }
    });

    const element = wrapper.find('p').element;

    expect(element).toBeUndefined();
  });

  it('should display spinning icon', () => {
    const wrapper = mount(PodsUsage, {
      propsData: { row: {} },
      mocks:     { $store: { dispatch: { 'management/request': jest.fn() } } }
    });

    const element = wrapper.find('i').element;

    expect(element).toBeDefined();
  });

  it('should display podsUsage value', () => {
    const wrapper = mount(PodsUsage, {
      propsData: { row: { isReady: true } },
      data:      () => ({ loading: false }),
      mocks:     { $store: { dispatch: { 'management/request': jest.fn() } } }
    });

    const element = wrapper.find('p').element;

    expect(element.textContent).toBeDefined();
  });
});
