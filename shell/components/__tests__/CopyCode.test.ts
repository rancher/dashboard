import { mount } from '@vue/test-utils';
import CopyCode from '@shell/components/CopyCode.vue';

jest.mock('@shell/utils/clipboard', () => {
  return { copyTextToClipboard: () => new Promise(() => undefined) };
});

describe('component: CopyCode', () => {
  it('should emit copied after click', async() => {
    const wrapper = mount(CopyCode, { slots: { default: '<div></div>' } });

    await wrapper.find('code').trigger('click');

    expect(wrapper.emitted('copied')).toHaveLength(1);
  });
});
