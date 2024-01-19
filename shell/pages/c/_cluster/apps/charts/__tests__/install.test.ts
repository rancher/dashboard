import { mount } from '@vue/test-utils';
import Install from '@shell/pages/c/_cluster/apps/charts/install.vue';
import { DefaultProps } from 'vue/types/options';
import { ExtendedVue, Vue } from 'vue/types/vue';

describe('view (Charts) Install should', () => {
  it('automatically select current version by matching available charts and query parameter', async() => {
    const version = '123';
    const wrapper = mount(Install as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      data() {
        return { existing: false };
      },
      computed: {
        chart:          () => ({ versions: [{ version }] }), // Charts provided by the store
        diffMode:       () => false, // Not used by the dropdown
        targetVersion:  () => 'targetVersion', // Not used by the dropdown
        currentVersion: () => 'currentVersion', // Not used by the dropdown
        showPreRelease: () => false, // Not used by the dropdown
      },
      mocks: {
        $fetchState: {},
        $route:      {
          query: {
            tools:       true,
            versionName: 'versionName', // The name is actually the version, so this is not relevant although required in computation
            version, // Required for displaying chart versions dropdown
          }
        },
        $store: {
          getters: {
            'i18n/withFallback': jest.fn(),
            'i18n/t':            jest.fn(),
            'catalog/repo':      () => 'catalog/repo', // Used as optional filter
            currentCluster:      'currentCluster', // Not used by the dropdown
            isRancher:           true,
          }
        }
      },
      stubs: {
        Wizard:            { template: '<div><slot name="basics"></slot></div>' }, // Required to render the slot content
        TypeDescription:   true,
        NameNsDescription: { template: '<div></div>' },
      }
    });

    // Override computed data after fetch initialization (we cannot mock async fetch hook atm)
    await wrapper.setData({ value: {} });

    const versionEl = wrapper.find('[data-testid="chart-install-existing-version"]');

    expect((versionEl.vm as any).value).toStrictEqual(version);
  });
});
