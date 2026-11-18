import Licenses from '@shell/pages/licenses.vue';

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
