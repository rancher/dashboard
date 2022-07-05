import { mount } from '@vue/test-utils';
import CopyCode from '@shell/components/CopyCode.vue';

describe('component: CopyCode', () => {
  it('should emit copied after click', async() => {
    const wrapper = mount(CopyCode, {
      mocks: { $copyText: () => new Promise(() => undefined) },
      slots: { default: '<div></div>' }
    });

    await wrapper.find('code').trigger('click');

    expect(wrapper.emitted('copied')).toHaveLength(1);
  });
});
