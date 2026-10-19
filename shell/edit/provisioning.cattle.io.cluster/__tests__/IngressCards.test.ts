import { mount } from '@vue/test-utils';
import IngressCards from '@shell/edit/provisioning.cattle.io.cluster/ingress/IngressCards.vue';

jest.mock('vuex', () => ({ useStore: () => ({}) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({ TRAEFIK: 'traefik' }));
jest.mock('@components/RcItemCard', () => ({
  RcItemCard: {
    props:    ['id'],
    template: '<div :id="id" class="card"><slot name="item-card-sub-header" /></div>'
  },
  RcItemCardAction: { template: '<div><slot /></div>' }
}));

const traefik = {
  id:        'traefik',
  header:    { title: { key: 'Traefik' } },
  subHeader: { label: { key: 'Recommended' } },
  content:   { key: 'Traefik content' }
};
const nginx = {
  id:        'ingress-nginx',
  header:    { title: { key: 'Ingress-NGINX' } },
  subHeader: { label: { key: 'Legacy' } },
  content:   { key: 'NGINX content' }
};

const createWrapper = (options = [traefik, nginx]) => mount(IngressCards, { props: { options } });

describe('IngressCards', () => {
  it('shows Recommended when Traefik is one of multiple options', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('#traefik .ingress-card-sub-header').text()).toContain('Recommended');
  });

  it('hides Recommended when Traefik is the only option', () => {
    const wrapper = createWrapper([traefik]);

    expect(wrapper.find('.ingress-card-sub-header').exists()).toBe(false);
  });

  it('updates Recommended when the available options change', async() => {
    const wrapper = createWrapper();

    await wrapper.setProps({ options: [traefik] });

    expect(wrapper.find('.ingress-card-sub-header').exists()).toBe(false);

    await wrapper.setProps({ options: [traefik, nginx] });

    expect(wrapper.find('.ingress-card-sub-header').text()).toContain('Recommended');
  });

  it('keeps the Legacy label when NGINX is the only option', () => {
    const wrapper = createWrapper([nginx]);

    expect(wrapper.find('.ingress-card-sub-header').text()).toContain('Legacy');
  });
});
