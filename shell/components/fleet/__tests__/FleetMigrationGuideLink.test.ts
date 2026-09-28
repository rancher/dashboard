import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import FleetMigrationGuideLink from '@shell/components/fleet/FleetMigrationGuideLink.vue';

const store = createStore({ getters: { 'i18n/t': () => (key: string) => key } });

// Render RichTranslation's #docsLink slot (shallowMount would otherwise leave it unrendered) so the
// migration-guide anchor and its :href binding are actually exercised.
const richTranslationStub = { template: `<div><slot name="docsLink" :content="'guide'" /></div>` };

const createWrapper = () => shallowMount(FleetMigrationGuideLink, {
  global: {
    plugins:               [store],
    renderStubDefaultSlot: true,
    stubs:                 { RichTranslation: richTranslationStub },
  },
});

describe('component: FleetMigrationGuideLink', () => {
  it('links to the version-aware migration docs', () => {
    const link = createWrapper().find('[data-testid="fleet-migration-guide-link"]');

    expect(link.exists()).toBe(true);
    // getGitRepoRestrictionMigrationDocsUrl resolves to the fallback path in tests.
    expect(link.attributes('href')).toContain('how-tos-for-operators/tenant-setup');
  });

  it('opens the docs in a new tab safely', () => {
    const link = createWrapper().find('[data-testid="fleet-migration-guide-link"]');

    expect(link.attributes('target')).toStrictEqual('_blank');
    expect(link.attributes('rel')).toStrictEqual('noopener noreferrer nofollow');
  });
});
