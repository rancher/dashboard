import { shallowMount } from '@vue/test-utils';
import WhatsNewCard from '@shell/components/ReleaseWelcome/WhatsNewCard.vue';
import { WHATS_NEW_FEATURES } from '@shell/config/release-welcome';

const RELEASE_NOTES_URL = 'https://github.com/rancher/rancher/releases/tag/v2.16.0';

jest.mock('vuex', () => ({ ...jest.requireActual('vuex'), useStore: () => ({ getters: { releaseNotesUrl: 'https://github.com/rancher/rancher/releases/tag/v2.16.0' } }) }));
jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const REMOTE_FEATURES = [
  {
    id: 'remote', title: 'Remote title', description: 'Remote description'
  },
];

const createWrapper = (features?: any[]) => shallowMount(WhatsNewCard, {
  props:  { version: '2.16', features },
  global: { mocks: { t: (key: string, args?: any) => (args?.version ? `${ key } ${ args.version }` : key) } },
});

describe('component: WhatsNewCard', () => {
  it('should show the release version', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-version"]').text()).toStrictEqual('releaseWelcome.whatsNew.version 2.16');
  });

  it('should link the release notes', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="release-welcome-release-notes"]').attributes('href')).toStrictEqual(RELEASE_NOTES_URL);
  });

  it('should open the release notes in a new tab', () => {
    const wrapper = createWrapper();
    const link = wrapper.find('[data-testid="release-welcome-release-notes"]');

    expect([link.attributes('target'), link.attributes('rel')]).toStrictEqual(['_blank', 'noopener noreferrer nofollow']);
  });

  it('should list every feature', () => {
    const wrapper = createWrapper();
    const ids = wrapper.findAll('li').map((li) => li.attributes('data-testid'));

    expect(ids).toStrictEqual(WHATS_NEW_FEATURES.map((f) => `release-welcome-feature-${ f.id }`));
  });

  it.each(WHATS_NEW_FEATURES.map((f) => [f.id, f]))('should show the title and description of %p', (id, feature: any) => {
    const wrapper = createWrapper();

    expect(wrapper.find(`[data-testid="release-welcome-feature-${ id }"]`).text()).toStrictEqual(`${ feature.titleKey }${ feature.descriptionKey }`);
  });

  it('should name the section after its title', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('section').attributes('aria-labelledby')).toStrictEqual(wrapper.find('h3').attributes('id'));
  });

  describe('with features from dynamic content', () => {
    it('should list the features instead of the built-in ones', () => {
      const wrapper = createWrapper(REMOTE_FEATURES);
      const ids = wrapper.findAll('li').map((li) => li.attributes('data-testid'));

      expect(ids).toStrictEqual(['release-welcome-feature-remote']);
    });

    it('should show the title and description of each feature', () => {
      const wrapper = createWrapper(REMOTE_FEATURES);

      expect(wrapper.find('[data-testid="release-welcome-feature-remote"]').text()).toStrictEqual('Remote titleRemote description');
    });

    it('should hide the card when there are no features', () => {
      const wrapper = createWrapper([]);

      expect(wrapper.find('[data-testid="release-welcome-whats-new"]').exists()).toStrictEqual(false);
    });
  });
});
