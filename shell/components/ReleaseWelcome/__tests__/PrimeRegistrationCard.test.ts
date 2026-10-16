import { shallowMount } from '@vue/test-utils';
import PrimeRegistrationCard from '@shell/components/ReleaseWelcome/PrimeRegistrationCard.vue';
import { PRIME_BENEFITS, SCC_URL, SUPPORT_HANDBOOK_URL } from '@shell/config/release-welcome';

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({ getters: {} }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const REGISTRATION = {
  title:       'Register now',
  description: 'Remote registration card',
  benefits:    [
    { text: 'Remote benefit', link: { action: 'Read more', link: 'https://www.suse.com/remote' } },
    { text: 'Other benefit' },
  ],
  cta: { action: 'Register', link: 'https://scc.suse.com/remote' },
};

const createWrapper = (registration?: any) => shallowMount(PrimeRegistrationCard, {
  props:  { registration },
  global: {
    mocks: { t: (key: string) => key },
    // Render the slots, the content sits inside the card and the button
    stubs: { PrimeCard: { template: '<section><slot /></section>' }, RcButton: { template: '<a><slot /></a>' } },
  },
});

describe('component: PrimeRegistrationCard', () => {
  it('should list every benefit', () => {
    const wrapper = createWrapper();
    const benefits = wrapper.findAll('.benefits li').map((li) => li.text().split(' ')[0]);

    expect(benefits).toStrictEqual(PRIME_BENEFITS);
  });

  it('should hide the benefit icons from screen readers', () => {
    const wrapper = createWrapper();
    const hidden = wrapper.findAll('.icon-checkmark').map((icon) => icon.attributes('aria-hidden'));

    expect(hidden).toStrictEqual(PRIME_BENEFITS.map(() => 'true'));
  });

  it('should link the support handbook once', () => {
    const wrapper = createWrapper();
    const links = wrapper.findAll('[data-testid^="release-welcome-benefit-link-"]');

    expect(links.map((link) => link.attributes('href'))).toStrictEqual([SUPPORT_HANDBOOK_URL]);
  });

  it('should link the support handbook under the support benefit', () => {
    const wrapper = createWrapper();
    const support = wrapper.findAll('.benefits li')[0];

    expect(support.find('[data-testid="release-welcome-benefit-link-0"]').exists()).toStrictEqual(true);
  });

  it('should link the SUSE Customer Center', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-registration-open"]').attributes('href')).toStrictEqual(SCC_URL);
  });

  it('should name the card after its title', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('section').attributes('aria-labelledby')).toStrictEqual(wrapper.find('h3').attributes('id'));
  });

  describe('with a card from dynamic content', () => {
    it('should show its title', () => {
      const wrapper = createWrapper(REGISTRATION);

      expect(wrapper.find('h3').text()).toStrictEqual(REGISTRATION.title);
    });

    it('should show its description', () => {
      const wrapper = createWrapper(REGISTRATION);

      expect(wrapper.find('p').text()).toStrictEqual(REGISTRATION.description);
    });

    it('should list its benefits', () => {
      const wrapper = createWrapper(REGISTRATION);
      const benefits = wrapper.findAll('.benefit').map((benefit) => benefit.text().split('Read more')[0].trim());

      expect(benefits).toStrictEqual(['Remote benefit', 'Other benefit']);
    });

    it('should link only the benefits with a link', () => {
      const wrapper = createWrapper(REGISTRATION);
      const links = wrapper.findAll('[data-testid^="release-welcome-benefit-link-"]');

      expect(links.map((link) => link.attributes('href'))).toStrictEqual(['https://www.suse.com/remote']);
    });

    it('should label the benefit link', () => {
      const wrapper = createWrapper(REGISTRATION);

      expect(wrapper.find('[data-testid="release-welcome-benefit-link-0"]').text()).toContain('Read more');
    });

    it('should link its call to action', () => {
      const wrapper = createWrapper(REGISTRATION);

      expect(wrapper.find('[data-testid="release-welcome-registration-open"]').attributes('href')).toStrictEqual(REGISTRATION.cta.link);
    });

    it('should label its call to action', () => {
      const wrapper = createWrapper(REGISTRATION);

      expect(wrapper.find('[data-testid="release-welcome-registration-open"]').text()).toContain(REGISTRATION.cta.action);
    });
  });
});
