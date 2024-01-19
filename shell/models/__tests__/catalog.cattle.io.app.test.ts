import CatalogApp from '@shell/models/catalog.cattle.io.app';

describe('class CatalogApp', () => {
  describe('should return upgradeAvailable for this chart', () => {
    describe('as false to be excluded from some logic if', () => {
      const expectation = false;

      it('is fleet', () => {
        const catalogApp = new CatalogApp({ spec: { chart: { metadata: { annotations: { 'fleet.cattle.io/bundle-id': 'anything' } } } } });

        expect(catalogApp.upgradeAvailable).toStrictEqual(expectation);
      });

      it('is managed,', () => {
        const catalogApp = new CatalogApp({ spec: { chart: { metadata: { annotations: { 'catalog.cattle.io/managed': 'anything' } } } } });

        expect(catalogApp.upgradeAvailable).toStrictEqual(expectation);
      });
    });

    describe('as latest version', () => {
      it('excluding pre-releases', () => {
        const version = '1';
        const catalogApp = new CatalogApp({});

        catalogApp.spec = { chart: { metadata: { version: '0' } } };

        jest.spyOn(catalogApp, '$rootGetters', 'get').mockReturnValue({
          'catalog/chart': () => ({ versions: [{ version }] }),
          currentCluster:  jest.fn(),
          'prefs/get':     () => false
        });

        expect(catalogApp.upgradeAvailable).toStrictEqual(version);
      });
    });

    describe('as null', () => {
      const expectation = null;

      it('if no chart', () => {
        const catalogApp = new CatalogApp({});

        jest.spyOn(catalogApp, '$rootGetters', 'get').mockReturnValue({
          'catalog/chart': () => [],
          currentCluster:  jest.fn(),
          'prefs/get':     () => false
        });

        expect(catalogApp.upgradeAvailable).toStrictEqual(expectation);
      });

      it('if no version is available', () => {
        const catalogApp = new CatalogApp({});

        jest.spyOn(catalogApp, '$rootGetters', 'get').mockReturnValue({
          'catalog/chart': () => [],
          currentCluster:  jest.fn(),
          'prefs/get':     () => false
        });

        expect(catalogApp.upgradeAvailable).toStrictEqual(expectation);
      });

      it('if current version is the latest', () => {
        const catalogApp = new CatalogApp({});

        catalogApp.spec = { chart: { metadata: { version: '1' } } };

        jest.spyOn(catalogApp, '$rootGetters', 'get').mockReturnValue({
          'catalog/chart': () => ({ versions: [{ version: '0' }] }),
          currentCluster:  jest.fn(),
          'prefs/get':     () => false
        });

        expect(catalogApp.upgradeAvailable).toStrictEqual(expectation);
      });
    });
  });
});
