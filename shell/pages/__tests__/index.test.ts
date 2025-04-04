import { mount, VueWrapper } from '@vue/test-utils';
import IndexPage from '@shell/pages/index.vue';

describe('page: index', () => {
  it('should be rendered', () => {
    const wrapper: VueWrapper<any, any> = mount(IndexPage, {});

    expect(wrapper).toBe(true);
  });
});
