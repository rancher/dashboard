import { shallowMount, VueWrapper } from '@vue/test-utils';
import About from '@shell/pages/about.vue';
import { SETTING } from '@shell/config/settings';
import { DOCS_BASE } from '@shell/config/private-label';

jest.mock('@shell/utils/version', () => ({
  ...jest.requireActual('@shell/utils/version'),
  getVersionInfo: () => ({ fullVersion: 'v2.12.2' }),
}));

const DARWIN_CLI = 'https://releases.rancher.com/cli2/v2.12.2/rancher-darwin-amd64-v2.12.2.tar.gz';
const LINUX_CLI = 'https://releases.rancher.com/cli2/v2.12.2/rancher-linux-amd64-v2.12.2.tar.gz';
const WINDOWS_CLI = 'https://releases.rancher.com/cli2/v2.12.2/rancher-windows-386-v2.12.2.zip';

const settings = [
  { id: SETTING.CLI_URL.DARWIN, value: DARWIN_CLI },
  { id: SETTING.CLI_URL.LINUX, value: LINUX_CLI },
  { id: SETTING.CLI_URL.WINDOWS, value: WINDOWS_CLI },
];

const t = (key: string) => `%${ key }%`;

async function createWrapper(): Promise<VueWrapper<any, any>> {
  const wrapper: VueWrapper<any, any> = shallowMount(About, {
    global: {
      mocks: {
        t,
        $fetchState: { pending: false },
        $config:     { dashboardVersion: 'v2.12.2' },
        $route:      { name: 'about', params: {} },
        $store:      {
          getters:  { releaseNotesUrl: 'https://github.com/rancher/rancher/releases' },
          dispatch: jest.fn(() => Promise.resolve(settings)),
        },
      },
      stubs: {
        BackLink:       { template: '<div />' },
        ExtensionPanel: { template: '<div />' },
        Loading:        { template: '<div />' },
        TabTitle:       { template: '<div><slot /></div>' },
        'rc-button':    { template: '<button><slot /></button>' },
      },
    },
  });

  await wrapper.setData({ settings });

  return wrapper;
}

describe('page: about', () => {
  describe('rancher CLI', () => {
    it('should link to the CLI documentation', async() => {
      const wrapper = await createWrapper();

      const link = wrapper.find('[data-testid="about__cli_docs_link"]');

      expect(link.attributes('href')).toBe(`${ DOCS_BASE }/reference-guides/cli-with-rancher/rancher-cli`);
      expect(link.text()).toBe('%about.cli.docsLink%');
    });

    it('should not link to CLI binaries even when the cli-url settings are set', async() => {
      const wrapper = await createWrapper();

      expect(wrapper.findAll('a[href^="https://releases.rancher.com/cli2"]')).toHaveLength(0);
    });
  });
});
