import Licenses from '@shell/pages/licenses.vue';
import LicenseSlideIn from '@shell/components/LicenseSlideIn.vue';

const LICENSES_MODULE = '@shell/assets/licenses/licenses.json';

type FetchContext = {
  loading: boolean;
  error: string | null;
  data: any;
};

const runFetch = async(): Promise<FetchContext> => {
  const thisContext: FetchContext = {
    loading: true, error: null, data: null
  };

  await (Licenses.fetch as () => Promise<void>).call(thisContext);

  return thisContext;
};

describe('page: Licenses', () => {
  describe('openPanel', () => {
    const pkg = {
      name: 'left-pad', license: 'MIT', licenseField: 'MIT', home: 'https://github.com/o/p', author: 'Jane Doe', licenseRef: 'mit-1'
    };
    const openPanel = (licensesMap: Record<string, any>, overrides = {}) => {
      const open = jest.fn();

      (Licenses.methods as any).openPanel.call({ licensesMap, $shell: { slideIn: { open } } }, { ...pkg, ...overrides });

      return open;
    };

    it('should open the license in a narrow, full height drawer titled with the package name', () => {
      const content = { text: 'MIT License' };
      const open = openPanel({ 'mit-1': content });

      expect(open).toHaveBeenCalledWith(LicenseSlideIn, {
        props: {
          packageName:  'left-pad',
          licenseId:    'MIT',
          licenseField: 'MIT',
          home:         'https://github.com/o/p',
          author:       'Jane Doe',
          content
        },
        height: 'full'
      });
    });

    it('should open the drawer without content when the package has no license file', () => {
      const open = openPanel({ 'mit-1': { text: 'MIT License' } }, { licenseRef: undefined });

      expect(open.mock.calls[0][1].props.content).toBeNull();
    });
  });

  describe('fetch', () => {
    afterEach(() => {
      jest.dontMock(LICENSES_MODULE);
      jest.resetModules();
    });

    describe('when the bundled licenses load', () => {
      const body = { packages: [{ name: 'pkg', license: 'MIT' }], licenses: {} };

      beforeEach(() => {
        jest.resetModules();
        jest.doMock(LICENSES_MODULE, () => body);
      });

      it('stores the imported licenses', async() => {
        const result = await runFetch();

        expect(result.data).toStrictEqual(body);
      });

      it('does not set an error', async() => {
        const result = await runFetch();

        expect(result.error).toBeNull();
      });

      it('clears loading', async() => {
        const result = await runFetch();

        expect(result.loading).toBe(false);
      });
    });

    describe('when the licenses chunk fails to load', () => {
      beforeEach(() => {
        jest.resetModules();
        jest.doMock(LICENSES_MODULE, () => {
          throw new Error('Loading chunk licenses failed.');
        });
      });

      it('reports the error message', async() => {
        const result = await runFetch();

        expect(result.error).toBe('Loading chunk licenses failed.');
      });

      it('does not store any data', async() => {
        const result = await runFetch();

        expect(result.data).toBeNull();
      });

      it('clears loading', async() => {
        const result = await runFetch();

        expect(result.loading).toBe(false);
      });
    });

    it('loads the committed licenses file', async() => {
      const result = await runFetch();

      expect(Array.isArray(result.data.packages)).toBe(true);
    });
  });
});
