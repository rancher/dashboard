import { mount } from '@vue/test-utils';
import DetailSummary from '../DetailSummary.vue';

const RouterLinkStub = {
  props:    ['to'],
  template: '<a class="router-link"><slot /></a>',
};

function render(items: any[]) {
  return mount(DetailSummary, {
    props:  { items },
    global: { stubs: { 'router-link': RouterLinkStub } },
  });
}

describe('component: DetailSummary', () => {
  it('should render a label and value for each item', () => {
    const wrapper = render([
      { label: 'Issuer', value: 'letsencrypt' },
      { label: 'Secret', value: 'my-tls' },
    ]);

    expect(wrapper.findAll('p.text-muted').map((p) => p.text())).toStrictEqual(['Issuer', 'Secret']);
    expect(wrapper.text()).toContain('letsencrypt');
    expect(wrapper.text()).toContain('my-tls');
  });

  it('should show a dash for an empty value', () => {
    const wrapper = render([{ label: 'Issuer' }]);

    expect(wrapper.find('span.text-muted').text()).toBe('—');
  });

  it('should render zero as a value rather than a dash', () => {
    const wrapper = render([{ label: 'Revision', value: 0 }]);

    expect(wrapper.find('span.text-muted').exists()).toBe(false);
    expect(wrapper.text()).toContain('0');
  });

  it('should drop items marked hideIfEmpty when they have no value', () => {
    const wrapper = render([
      { label: 'Issuer', value: 'letsencrypt' },
      { label: 'Account URI', hideIfEmpty: true },
    ]);

    expect(wrapper.findAll('p.text-muted').map((p) => p.text())).toStrictEqual(['Issuer']);
  });

  it('should render an internal link when a route is given', () => {
    const wrapper = render([{
      label: 'Issuer', value: 'letsencrypt', to: { name: 'somewhere' }
    }]);

    expect(wrapper.find('.router-link').text()).toBe('letsencrypt');
  });

  it('should not render a link when the route is present but the value is not', () => {
    const wrapper = render([{ label: 'Issuer', to: { name: 'somewhere' } }]);

    expect(wrapper.find('.router-link').exists()).toBe(false);
    expect(wrapper.find('span.text-muted').exists()).toBe(true);
  });

  it('should render external links safely', () => {
    const wrapper = render([{
      label: 'ACME Server', value: 'letsencrypt.org', href: 'https://acme-v02.api.letsencrypt.org/directory'
    }]);
    const link = wrapper.find('a');

    expect(link.attributes('href')).toBe('https://acme-v02.api.letsencrypt.org/directory');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener noreferrer nofollow');
  });

  it('should lay out as an auto-fitting grid rather than fixed columns', () => {
    // Fixed span-N columns overflow the page horizontally once there are more than four items.
    const wrapper = render([1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ label: `l${ n }`, value: `v${ n }` })));

    expect(wrapper.findAll('.item')).toHaveLength(8);
    expect(wrapper.find('.cert-manager-summary').classes()).not.toContain('row');
  });
});
