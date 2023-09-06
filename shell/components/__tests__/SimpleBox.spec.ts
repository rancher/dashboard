import SimpleBox from '@shell/components/SimpleBox.vue';
import { mount } from '@vue/test-utils';

describe('component: SimpleBox.vue', () => {
  const wrapper = mount(SimpleBox, { propsData: { title: 'Simple box title' } });

  it('show title', () => {
    const title = wrapper.find(`[data-testid="simple-box-title"]`);

    expect(title.element).toBeDefined();
  });

  it('show close button', async() => {
    await wrapper.setProps({ canClose: true });
    const closeButton = wrapper.find(`[data-testid="simple-box-close"]`);

    expect(closeButton.element).toBeDefined();
  });

  it('close emit', async() => {
    await wrapper.setProps({ canClose: true });
    const closeButton = wrapper.find(`[data-testid="simple-box-close"]`);

    await closeButton.trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
