import Chart from '@shell/pages/c/_cluster/apps/charts/chart.vue';

jest.mock('clipboard-polyfill', () => ({ writeText: () => {} }));

describe('page: Chart Detail', () => {
  describe('computed: maintainers', () => {
    it('should return an empty array if no maintainers are provided', () => {
      const thisContext = {
        version:     {},
        versionInfo: null,
      };
      const result = (Chart.computed!.maintainers as () => any[]).call(thisContext);

      expect(result).toStrictEqual([]);
    });

    it('should return an empty array for empty maintainers arrays', () => {
      const thisContext = {
        version:     { maintainers: [] },
        versionInfo: { chart: { maintainers: [] } },
      };
      const result = (Chart.computed!.maintainers as () => any[]).call(thisContext);

      expect(result).toStrictEqual([]);
    });

    it('should prioritize maintainers from "version"', () => {
      const thisContext = {
        version: {
          maintainers: [
            { name: 'Version Maintainer', email: 'version@test.com' }
          ]
        },
        versionInfo: {
          chart: {
            maintainers: [
              { name: 'VersionInfo Maintainer', email: 'versioninfo@test.com' }
            ]
          }
        },
      };
      const result = (Chart.computed!.maintainers as () => any[]).call(thisContext);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Version Maintainer');
    });

    it('should fall back to maintainers from "versionInfo"', () => {
      const thisContext = {
        version:     {},
        versionInfo: {
          chart: {
            maintainers: [
              { name: 'VersionInfo Maintainer', email: 'versioninfo@test.com' }
            ]
          }
        },
      };
      const result = (Chart.computed!.maintainers as () => any[]).call(thisContext);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('VersionInfo Maintainer');
    });

    it('should correctly map all maintainer fields', () => {
      const thisContext = {
        version: {
          maintainers: [
            {
              name: 'Full Maintainer', email: 'full@test.com', url: 'http://full.com'
            }
          ]
        },
        versionInfo: null,
      };
      const result = (Chart.computed!.maintainers as () => any[]).call(thisContext);
      const expected = {
        id:    'Full Maintainer-0',
        name:  'Full Maintainer',
        href:  'http://full.com',
        label: 'Full Maintainer'
      };

      expect(result[0]).toStrictEqual(expected);
    });

    it('should handle maintainers with missing optional fields', () => {
      const thisContext = {
        version: {
          maintainers: [
            { name: 'No Email Maintainer', url: 'http://noemail.com' },
            { name: 'No URL Maintainer', email: 'nourl@test.com' },
            { name: 'Name Only Maintainer' },
            { url: 'http://noname.com' },
            { email: 'noname@test.com' }
          ]
        },
        versionInfo: null,
      };
      const result = (Chart.computed!.maintainers as () => any[]).call(thisContext);

      expect(result).toHaveLength(5);
      expect(result[0]).toStrictEqual({
        id:    'No Email Maintainer-0',
        name:  'No Email Maintainer',
        href:  'http://noemail.com',
        label: 'No Email Maintainer'
      });
      expect(result[1]).toStrictEqual({
        id:    'No URL Maintainer-1',
        name:  'No URL Maintainer',
        href:  'mailto:nourl@test.com',
        label: 'No URL Maintainer'
      });
      expect(result[2]).toStrictEqual({
        id:    'Name Only Maintainer-2',
        name:  'Name Only Maintainer',
        href:  null,
        label: 'Name Only Maintainer'
      });
      expect(result[3]).toStrictEqual({
        id:    'undefined-3',
        name:  undefined,
        href:  'http://noname.com',
        label: 'http://noname.com'
      });
      expect(result[4]).toStrictEqual({
        id:    'undefined-4',
        name:  undefined,
        href:  'mailto:noname@test.com',
        label: 'noname@test.com'
      });
    });
  });
});
