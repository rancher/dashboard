import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ExtrasCard from '@shell/components/Resource/Detail/Card/ExtrasCard.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';

const TRANSLATION_KEY = 'component.resource.detail.card.extrasCard.message';
const TRANSLATION_VALUE = 'Consider installing additional <extensionsLink>extensions</extensionsLink> and / or <clusterToolsLink>cluster tools</clusterToolsLink> to enrich your Rancher experience.';

jest.mock('@shell/store/type-map', () => ({ isAdminUser: jest.fn() }));
jest.mock('@shell/config/private-label', () => ({ DOCS_BASE: 'https://docs.example.com' }));

const { isAdminUser } = require('@shell/store/type-map');

function createMockStore() {
  return createStore({
    getters: {
      'i18n/t': () => (key: string) => {
        if (key === TRANSLATION_KEY) {
          return TRANSLATION_VALUE;
        }

        return key;
      },
    },
  });
}

function mountExtrasCard({ admin = false } = {}) {
  isAdminUser.mockReturnValue(admin);

  const store = createMockStore();

  return mount(ExtrasCard, {
    global: {
      plugins: [store],
      stubs:   { 'router-link': { template: '<a :href="JSON.stringify(to)" :class="$attrs.class"><slot /></a>', props: ['to'] } },
    },
  });
}

describe('component: ExtrasCard', () => {
  it('should render the Card component with the correct title', () => {
    const wrapper = mountExtrasCard();
    const card = wrapper.findComponent(Card);

    expect(card.exists()).toBe(true);
    expect(card.props('title')).toStrictEqual('component.resource.detail.card.extrasCard.title');
  });

  it('should render the RichTranslation component with the correct key', () => {
    const wrapper = mountExtrasCard();
    const richTranslation = wrapper.findComponent(RichTranslation);

    expect(richTranslation.exists()).toBe(true);
    expect(richTranslation.props('k')).toStrictEqual(TRANSLATION_KEY);
  });

  describe('when user is admin', () => {
    it('should render router-link for extensions', () => {
      const wrapper = mountExtrasCard({ admin: true });
      const links = wrapper.findAll('a');
      const extensionsLink = links.find((l) => l.text() === 'extensions');

      expect(extensionsLink).toBeDefined();
      expect(extensionsLink!.classes()).toContain('secondary');
      expect(extensionsLink!.classes()).toContain('text-deemphasized');
      expect(extensionsLink!.attributes('href')).toContain('c-cluster-uiplugins');
    });

    it('should render router-link for cluster tools', () => {
      const wrapper = mountExtrasCard({ admin: true });
      const links = wrapper.findAll('a');
      const clusterToolsLink = links.find((l) => l.text() === 'cluster tools');

      expect(clusterToolsLink).toBeDefined();
      expect(clusterToolsLink!.classes()).toContain('secondary-text-link');
      expect(clusterToolsLink!.attributes('href')).toContain('c-cluster-explorer-tools');
    });

    it('should not render external anchor tags', () => {
      const wrapper = mountExtrasCard({ admin: true });
      const anchors = wrapper.findAll('a[target="_blank"]');

      expect(anchors).toHaveLength(0);
    });
  });

  describe('when user is not admin', () => {
    it('should render an external link for extensions', () => {
      const wrapper = mountExtrasCard({ admin: false });
      const links = wrapper.findAll('a[target="_blank"]');
      const extensionsLink = links.find((l) => l.text() === 'extensions');

      expect(extensionsLink).toBeDefined();
      expect(extensionsLink!.attributes('href')).toStrictEqual('https://docs.example.com/integrations-in-rancher/rancher-extensions');
      expect(extensionsLink!.classes()).toContain('secondary');
      expect(extensionsLink!.classes()).toContain('text-deemphasized');
    });

    it('should render an external link for cluster tools', () => {
      const wrapper = mountExtrasCard({ admin: false });
      const links = wrapper.findAll('a[target="_blank"]');
      const clusterToolsLink = links.find((l) => l.text() === 'cluster tools');

      expect(clusterToolsLink).toBeDefined();
      expect(clusterToolsLink!.attributes('href')).toStrictEqual('https://docs.example.com/reference-guides/rancher-cluster-tools');
      expect(clusterToolsLink!.classes()).toContain('secondary-text-link');
    });
  });
});
