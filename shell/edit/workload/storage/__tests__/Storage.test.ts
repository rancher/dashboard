import { mount } from '@vue/test-utils';
import Storage from '@shell/edit//workload/storage/index.vue';

describe('component: Storage', () => {
  // TODO: Complete test after integrating #5631
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should allow to add a new volume', async() => {
    const wrapper = mount(Storage, {
      propsData: { savePvcHookName: '' },
      mocks:     {
        t:      (text: string) => text, // Fixes another issue with another i18n logic not from the getters
        $store: { getters: { 'i18n/t': jest.fn() } }
      },
    });

    await wrapper.find('#add-volume').trigger('click');
    const title = wrapper.find('h3');

    expect(title.isVisible).toBe(true);
  });
});
