import { shallowMount } from '@vue/test-utils';
import FailWhale from '@shell/components/FailWhale.vue';

const createWrapper = (props: any = {}) => {
  return shallowMount(FailWhale, {
    props,
    slots:  props.slots,
    global: { stubs: { BrandImage: true } },
  });
};

describe('component: FailWhale', () => {
  it('renders a generic error title when the error has no status', () => {
    const wrapper = shallowMount(FailWhale, {
      props:  { error: new Error('boom') },
      global: { stubs: { BrandImage: true } },
    });

    expect(wrapper.find('h1').text()).toBe('Error');
  });

  it('renders an HTTP error title when the error has a status', () => {
    const wrapper = shallowMount(FailWhale, {
      props:  { error: { status: 404, statusText: 'Not Found' } },
      global: { stubs: { BrandImage: true } },
    });

    expect(wrapper.find('h1').text()).toContain('HTTP Error 404: Not Found');
  });

  it('renders the error message', () => {
    const wrapper = shallowMount(FailWhale, {
      props:  { error: { data: 'Resource type foo not found, unable to display list' } },
      global: { stubs: { BrandImage: true } },
    });

    expect(wrapper.find('h2').text()).toBe('Resource type foo not found, unable to display list');
  });

  it('renders content supplied via the actions slot', () => {
    const wrapper = shallowMount(FailWhale, {
      props:  { error: new Error('boom') },
      slots:  { actions: '<button class="my-action">Home</button>' },
      global: { stubs: { BrandImage: true } },
    });

    expect(wrapper.find('button.my-action').exists()).toBe(true);
  });

  it('does not render a message when there is no error', () => {
    const wrapper = createWrapper({ error: null });

    expect(wrapper.find('h2').exists()).toBe(false);
    expect(wrapper.find('h1').text()).toBe('Error');
  });
});
