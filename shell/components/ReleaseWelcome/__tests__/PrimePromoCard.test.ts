import { shallowMount } from '@vue/test-utils';
import PrimePromoCard from '@shell/components/ReleaseWelcome/PrimePromoCard.vue';
import { PRIME_PRODUCTS, PRIME_URL } from '@shell/config/release-welcome';

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({ getters: {} }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const createWrapper = () => shallowMount(PrimePromoCard, {
  global: {
    mocks: { t: (key: string) => key },
    // Render the slots, the content sits inside the card and the tags
    stubs: { PrimeCard: { template: '<section><slot /></section>' }, RcTag: { template: '<span><slot /></span>' } },
  },
});

describe('component: PrimePromoCard', () => {
  it('should list every Prime product', () => {
    const wrapper = createWrapper();
    const products = wrapper.findAll('.products li').map((li) => li.text());

    expect(products).toStrictEqual(PRIME_PRODUCTS);
  });

  it('should link Rancher Prime', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-prime-explore"]').attributes('href')).toStrictEqual(PRIME_URL);
  });

  it('should open Rancher Prime in a new tab', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-prime-explore"]').attributes('target')).toStrictEqual('_blank');
  });

  it('should name the card after its title', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('section').attributes('aria-labelledby')).toStrictEqual(wrapper.find('h3').attributes('id'));
  });
});
