
import { mount, VueWrapper } from '@vue/test-utils';
import Header from '@shell/components/nav/Header.vue';

describe('component: Header', () => {
  it('should be rendered', () => {
    const wrapper: VueWrapper<any, any> = mount(Header, {});

    expect(wrapper).toBe(true);
  });
});
