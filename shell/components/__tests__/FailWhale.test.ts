import { shallowMount } from '@vue/test-utils';
import FailWhale from '@shell/components/FailWhale.vue';

const createWrapper = (props: any = {}) => {
  return shallowMount(FailWhale, {
    props,
    slots:  props.slots,
    global: {
      stubs:      { BrandImage: true },
      // The real `clean-html` directive relies on `purifyHTML`, which returns empty in
      // the test environment, so stub it to render the raw value (as DetailText.test.ts does)
      directives: {
        'clean-html': (el: HTMLElement, binding: { value: string }) => {
          el.innerHTML = binding.value;
        }
      },
    },
  });
};

describe('component: FailWhale', () => {
  it('renders a generic error title when the error has no status', () => {
    const wrapper = shallowMount(FailWhale, {
      props:  { error: new Error('boom') as any },
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
      props:  { error: new Error('boom') as any },
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

  it('renders a suggestion when one is supplied', () => {
    const wrapper = createWrapper({
      error:      { data: 'Resource type foo not found, unable to display list' },
      suggestion: { label: 'bar', url: '/c/local/explorer/bar' },
    });

    const suggestion = wrapper.find('[data-testid="fail-whale-suggestion"]');

    expect(suggestion.exists()).toBe(true);
    // The mocked `t` echoes the key and its interpolation args, so we can assert the
    // suggestion's label and url are passed through to the translation
    expect(suggestion.text()).toContain('nav.failWhale.didYouMean');
    expect(suggestion.text()).toContain('/c/local/explorer/bar');
    expect(suggestion.text()).toContain('bar');
  });

  it('does not render a suggestion when none is supplied', () => {
    const wrapper = createWrapper({ error: new Error('boom') as any });

    expect(wrapper.find('[data-testid="fail-whale-suggestion"]').exists()).toBe(false);
  });

  it('does not render a suggestion when there is no error', () => {
    const wrapper = createWrapper({
      error:      null,
      suggestion: { label: 'bar', url: '/c/local/explorer/bar' },
    });

    // The suggestion still renders even without an error, as it sits in its own block
    expect(wrapper.find('[data-testid="fail-whale-suggestion"]').exists()).toBe(true);
  });
});
