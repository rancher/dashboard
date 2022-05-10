import { mount, createLocalVue } from '@vue/test-utils';
import CopyCode from '@shell/components/CopyCode.vue';
import VTooltip from 'v-tooltip';

const localVue = createLocalVue();

localVue.use(VTooltip);

describe('component: CopyCode', () => {
  it('should emit copied after click', async() => {
    const wrapper = mount(CopyCode, {
      localVue,
      mocks: { $copyText: () => new Promise(() => undefined) },
      slots: { default: '<div></div>' }
    });

    await wrapper.find('code').trigger('click');

    expect(wrapper.emitted('copied')).toHaveLength(1);
  });
});
