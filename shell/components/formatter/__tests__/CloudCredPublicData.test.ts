import { shallowMount } from '@vue/test-utils';
import CloudCredPublicData from '@shell/components/formatter/CloudCredPublicData.vue';

describe('component: formatter/CloudCredPublicData.vue', () => {
  const createWrapper = (value: string) => shallowMount(CloudCredPublicData, {
    props:  { value, row: { getSecret: jest.fn() } },
    global: { mocks: { $fetchState: { pending: false } } },
  });

  it('should show the key as text, not as markup', () => {
    const wrapper = createWrapper('<b>a&amp;b</b>…');

    expect(wrapper.find('b').exists()).toBe(false);
    expect(wrapper.text()).toBe('<b>a&amp;b</b>…');
  });

  it('should show a dash while the secret loads', () => {
    const wrapper = shallowMount(CloudCredPublicData, {
      props:  { value: 'abcd…', row: { getSecret: jest.fn() } },
      global: { mocks: { $fetchState: { pending: true } } },
    });

    expect(wrapper.find('.text-muted').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('abcd');
  });
});
