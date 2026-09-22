import { shallowMount, VueWrapper } from '@vue/test-utils';
import About from '@shell/pages/about.vue';
import { SETTING } from '@shell/config/settings';

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

// Mimics the real translation for `about.versions.downloadCli` so we can assert on the
// rendered accessible name rather than just on the key being used.
const t = (key: string, args?: { os?: string, file?: string }) => {
  if (key === 'about.versions.downloadCli') {
    return `Download CLI for ${ args?.os }: ${ args?.file }`;
  }

  return `%${ key }%`;
};

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
  describe('downloads', () => {
    it.each([
      ['about.os.mac', DARWIN_CLI, 'rancher-darwin-amd64-v2.12.2.tar.gz'],
      ['about.os.linux', LINUX_CLI, 'rancher-linux-amd64-v2.12.2.tar.gz'],
      ['about.os.windows', WINDOWS_CLI, 'rancher-windows-386-v2.12.2.zip'],
    ])('should extract the file name for %p from the CLI url', async(label, cliLink, cliFile) => {
      const wrapper = await createWrapper();

      const download = wrapper.vm.downloadCli.find((d: any) => d.label === label);

      expect(download.cliLink).toBe(cliLink);
      expect(download.cliFile).toBe(cliFile);
    });

    it('should not list an OS with no CLI url configured', async() => {
      const wrapper = await createWrapper();

      await wrapper.setData({ settings: [{ id: SETTING.CLI_URL.DARWIN, value: DARWIN_CLI }] });

      expect(wrapper.vm.downloadCli).toHaveLength(1);
      expect(wrapper.vm.downloadCli[0].cliFile).toBe('rancher-darwin-amd64-v2.12.2.tar.gz');
    });
  });

  describe('a11y: CLI download links', () => {
    it('should include the visible file name in the accessible name of every link', async() => {
      const wrapper = await createWrapper();

      const links = wrapper.findAll('a[href^="https://releases.rancher.com/cli2"]');

      expect(links).toHaveLength(3);

      links.forEach((link) => {
        const visibleLabel = link.text();
        const accessibleName = link.attributes('aria-label');

        // WCAG 2.5.3 Label in Name - what is spoken/targeted must contain what is shown
        expect(visibleLabel).not.toBe('');
        expect(accessibleName).toContain(visibleLabel);
      });
    });

    it('should give each link a unique accessible name mentioning the OS and the file', async() => {
      const wrapper = await createWrapper();

      const accessibleNames = wrapper
        .findAll('a[href^="https://releases.rancher.com/cli2"]')
        .map((link) => link.attributes('aria-label'));

      expect(accessibleNames).toStrictEqual([
        'Download CLI for %about.os.mac%: rancher-darwin-amd64-v2.12.2.tar.gz',
        'Download CLI for %about.os.linux%: rancher-linux-amd64-v2.12.2.tar.gz',
        'Download CLI for %about.os.windows%: rancher-windows-386-v2.12.2.zip',
      ]);
      expect(new Set(accessibleNames).size).toBe(accessibleNames.length);
    });
  });
});
