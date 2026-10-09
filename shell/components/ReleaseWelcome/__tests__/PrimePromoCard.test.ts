import { shallowMount } from '@vue/test-utils';
import PrimePromoCard from '@shell/components/ReleaseWelcome/PrimePromoCard.vue';
import { PRIME_PRODUCTS, PRIME_URL } from '@shell/config/release-welcome';

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({ getters: {} }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const PROMO = {
  title:       'Go Prime',
  description: 'Remote promotion',
  products:    ['Remote product', 'Other product'],
  cta:         { action: 'Explore', link: 'https://www.suse.com/remote' },
};

const createWrapper = (promo?: any) => shallowMount(PrimePromoCard, {
  props:  { promo },
  global: {
    mocks: { t: (key: string) => key },
    // Render the slots, the content sits inside the card, the tags and the button
    stubs: {
      PrimeCard: { template: '<section><slot /></section>' }, RcTag: { template: '<span><slot /></span>' }, RcButton: { template: '<a><slot /></a>' }
    },
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

  describe('with a promotion from dynamic content', () => {
    it('should show its title', () => {
      const wrapper = createWrapper(PROMO);

      expect(wrapper.find('h3').text()).toStrictEqual(PROMO.title);
    });

    it('should show its description', () => {
      const wrapper = createWrapper(PROMO);

      expect(wrapper.find('p').text()).toStrictEqual(PROMO.description);
    });

    it('should list its products', () => {
      const wrapper = createWrapper(PROMO);
      const products = wrapper.findAll('.products li').map((li) => li.text());

      expect(products).toStrictEqual(PROMO.products);
    });

    it('should hide the products when there are none', () => {
      const wrapper = createWrapper({ ...PROMO, products: [] });

      expect(wrapper.find('.products').exists()).toStrictEqual(false);
    });

    it('should link its call to action', () => {
      const wrapper = createWrapper(PROMO);

      expect(wrapper.find('[data-testid="release-welcome-prime-explore"]').attributes('href')).toStrictEqual(PROMO.cta.link);
    });

    it('should label its call to action', () => {
      const wrapper = createWrapper(PROMO);

      expect(wrapper.find('[data-testid="release-welcome-prime-explore"]').text()).toContain(PROMO.cta.action);
    });
  });
});
