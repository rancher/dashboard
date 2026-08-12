import { mount } from '@vue/test-utils';
import DetailSummary from '../DetailSummary.vue';

const RouterLinkStub = {
  props:    ['to'],
  template: '<a class="router-link"><slot /></a>',
};

function render(items: any[], span?: number) {
  return mount(DetailSummary, {
    props:  span ? { items, span } : { items },
    global: { stubs: { 'router-link': RouterLinkStub } },
  });
}

describe('component: DetailSummary', () => {
  it('should render a label and value for each item', () => {
    const wrapper = render([
      { label: 'Issuer', value: 'letsencrypt' },
      { label: 'Secret', value: 'my-tls' },
    ]);

    expect(wrapper.findAll('h3').map((h) => h.text())).toStrictEqual(['Issuer', 'Secret']);
    expect(wrapper.text()).toContain('letsencrypt');
    expect(wrapper.text()).toContain('my-tls');
  });

  it('should show a dash for an empty value', () => {
    const wrapper = render([{ label: 'Issuer' }]);

    expect(wrapper.find('.text-muted').text()).toBe('—');
  });

  it('should render zero as a value rather than a dash', () => {
    const wrapper = render([{ label: 'Revision', value: 0 }]);

    expect(wrapper.find('.text-muted').exists()).toBe(false);
    expect(wrapper.text()).toContain('0');
  });

  it('should drop items marked hideIfEmpty when they have no value', () => {
    const wrapper = render([
      { label: 'Issuer', value: 'letsencrypt' },
      { label: 'Account URI', hideIfEmpty: true },
    ]);

    expect(wrapper.findAll('h3').map((h) => h.text())).toStrictEqual(['Issuer']);
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
    expect(wrapper.find('.text-muted').exists()).toBe(true);
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

  it('should default to a three column span and honour an override', () => {
    expect(render([{ label: 'a', value: 'b' }]).find('.col').classes()).toContain('span-3');
    expect(render([{ label: 'a', value: 'b' }], 6).find('.col').classes()).toContain('span-6');
  });
});
