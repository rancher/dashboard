import { shallowMount, VueWrapper } from '@vue/test-utils';
import About from '@shell/pages/about.vue';
import { SETTING } from '@shell/config/settings';
import { DOCS_BASE } from '@shell/config/private-label';
import { setVersionData } from '@shell/config/version';

let mockFullVersion = 'v2.12.2';

jest.mock('@shell/utils/version', () => ({
  ...jest.requireActual('@shell/utils/version'),
  getVersionInfo: () => ({ fullVersion: mockFullVersion }),
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

async function createWrapper(config: { dashboardVersion?: string } = { dashboardVersion: 'v2.12.2' }): Promise<VueWrapper<any, any>> {
  const wrapper: VueWrapper<any, any> = shallowMount(About, {
    global: {
      mocks: {
        t,
        $fetchState: { pending: false },
        $config:     config,
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
        RcHeading:      { template: '<div><slot /></div>' },
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
      expect(link.text()).toStrictEqual('%about.cli.docsLink% %generic.opensInNewTab%');
    });

    it('should link to the new CLI GitHub repository', async() => {
      const wrapper = await createWrapper();

      const link = wrapper.find('[data-testid="about__new_cli_github_link"]');

      expect(link.attributes('href')).toStrictEqual('https://github.com/rancher/rancher-cli');
    });

    it('should show the new CLI GitHub link text', async() => {
      const wrapper = await createWrapper();

      const link = wrapper.find('[data-testid="about__new_cli_github_link"]');

      expect(link.text()).toStrictEqual('%about.cli.new.githubLink% %generic.opensInNewTab%');
    });

    it('should show a "new" badge next to the new CLI title', async() => {
      const wrapper = await createWrapper();

      const badge = wrapper.findComponent('[data-testid="about__new_cli_badge"]');

      expect(badge.attributes('status')).toStrictEqual('success');
    });

    it('should not link to CLI binaries even when the cli-url settings are set', async() => {
      const wrapper = await createWrapper();

      expect(wrapper.findAll('a[href^="https://releases.rancher.com/cli2"]')).toHaveLength(0);
    });
  });

  describe('versions', () => {
    afterEach(() => {
      mockFullVersion = 'v2.12.2';
      setVersionData({ RancherPrime: 'false' });
    });

    describe('in Community', () => {
      it.each([
        ['a minor release', 'v2.16.0', 'v2.16'],
        ['a double-digit minor release', 'v2.10.0', 'v2.10'],
        ['a patch release', 'v2.16.1', 'v2.16.1'],
        ['a double-digit patch ending in zero', 'v2.16.10', 'v2.16.10'],
        ['a head build', 'v2.16.0-f548dfa-head', 'v2.16.0-f548dfa-head'],
        ['a version without a leading v', '2.16.0', '2.16.0'],
        ['a non-numeric version', 'head', 'head'],
      ])('shows the rancher version for %s as %s', async(_case, version, expected) => {
        mockFullVersion = version;

        const wrapper = await createWrapper();

        expect(wrapper.vm.rancherVersion).toBe(expected);
      });

      it.each([
        ['a minor release', 'v2.16.0', 'v2.16'],
        ['a patch release', 'v2.16.1', 'v2.16.1'],
        ['a head build', 'v2.16.0-f548dfa-head', 'v2.16.0-f548dfa-head'],
      ])('shows the dashboard version for %s as %s', async(_case, version, expected) => {
        const wrapper = await createWrapper({ dashboardVersion: version });

        expect(wrapper.vm.dashboardVersion).toBe(expected);
      });
    });

    describe('in Prime', () => {
      beforeEach(() => {
        setVersionData({ RancherPrime: 'true' });
      });

      it('keeps the patch version of a minor release in the rancher version', async() => {
        mockFullVersion = 'v2.16.0';

        const wrapper = await createWrapper();

        expect(wrapper.vm.rancherVersion).toBe('v2.16.0');
      });

      it('keeps the patch version of a minor release in the dashboard version', async() => {
        const wrapper = await createWrapper({ dashboardVersion: 'v2.16.0' });

        expect(wrapper.vm.dashboardVersion).toBe('v2.16.0');
      });
    });

    describe('when the dashboard version is not set', () => {
      it('renders the page', async() => {
        const wrapper = await createWrapper({});

        expect(wrapper.vm.dashboardVersion).toBeUndefined();
      });
    });
  });
});
