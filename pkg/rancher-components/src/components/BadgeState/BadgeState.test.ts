import { shallowMount } from '@vue/test-utils';
import { BadgeState } from './index';

describe('BadgeState.vue', () => {
  it('renders props.msg when passed', () => {
    const label = 'Hello, World!';

    const wrapper = shallowMount(BadgeState, { propsData: { label } });

    expect(wrapper.find('span').text()).toMatch(label);
  });
});
