import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import BackLink from '@shell/components/BackLink.vue';

describe('component: BackLink', () => {
  it('should render component with the correct data applied', () => {
    const linkRoute = {
      name:   'some-route-name',
      params: { param1: 'paramval1' },
      query:  {
        query1: 'queryval1',
        query2: 'queryval2'
      }
    };

    const wrapper = shallowMount(BackLink, {
      props:  { link: linkRoute },
      global: { stubs: { 'router-link': RouterLinkStub } }
    });

    const link = wrapper.findComponent(RouterLinkStub);
    const icon = wrapper.find('i');

    expect(link.exists()).toBe(true);
    // assertion regarding the text will have to be pointed to whatever t() returns on the test
    expect(link.text()).toBe('%generic.back%');
    expect(link.classes()).toContain('back-link');
    expect(link.props().to).toStrictEqual(linkRoute);

    expect(icon.exists()).toBe(true);
    expect(icon.classes()).toContain('icon');
    expect(icon.classes()).toContain('icon-chevron-left');
  });
});
