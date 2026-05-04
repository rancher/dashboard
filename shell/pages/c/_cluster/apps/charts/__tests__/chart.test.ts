import Chart from '@shell/pages/c/_cluster/apps/charts/chart.vue';
import { APP_UPGRADE_STATUS } from '@shell/store/catalog';

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

  describe('methods: computeSelectedAppStatuses', () => {
    const defaultStatuses = [
      {
        icon: 'icon-alert-alt', color: 'error', tooltip: { key: 'generic.deprecated' }
      },
      {
        icon: 'icon-upgrade-alt', color: 'info', tooltip: { key: 'generic.upgradeable' }
      },
      {
        icon: 'icon-confirmation-alt', color: 'success', tooltip: { text: 'generic.installed (1.0.0)' }
      }
    ];

    it('returns only deprecated status when no app is selected', () => {
      const thisContext = {
        selectedInstalledApp: null,
        t:                    (key: string) => key
      };

      const result = (Chart.methods!.computeSelectedAppStatuses as (statuses: any[]) => any[]).call(thisContext, defaultStatuses);

      expect(result).toHaveLength(1);
      expect(result[0].icon).toBe('icon-alert-alt');
    });

    it('returns empty array when no app is selected and chart is not deprecated', () => {
      const thisContext = {
        selectedInstalledApp: null,
        t:                    (key: string) => key
      };

      const statusesWithoutDeprecated = [
        {
          icon: 'icon-upgrade-alt', color: 'info', tooltip: { key: 'generic.upgradeable' }
        },
        {
          icon: 'icon-confirmation-alt', color: 'success', tooltip: { text: 'generic.installed (1.0.0)' }
        }
      ];

      const result = (Chart.methods!.computeSelectedAppStatuses as (statuses: any[]) => any[]).call(thisContext, statusesWithoutDeprecated);

      expect(result).toHaveLength(0);
    });

    it('returns installed status with version for selected app', () => {
      const thisContext = {
        selectedInstalledApp: {
          upgradeAvailable: APP_UPGRADE_STATUS.NO_UPGRADE,
          spec:             { chart: { metadata: { version: '2.0.0' } } }
        },
        t: (key: string) => key
      };

      const result = (Chart.methods!.computeSelectedAppStatuses as (statuses: any[]) => any[]).call(thisContext, defaultStatuses);

      const installedStatus = result.find((s: any) => s.icon === 'icon-confirmation-alt');

      expect(installedStatus).toBeDefined();
      expect(installedStatus.tooltip.text).toContain('2.0.0');
    });

    it('returns upgradeable status when selected app is upgradeable', () => {
      const thisContext = {
        selectedInstalledApp: {
          upgradeAvailable: APP_UPGRADE_STATUS.SINGLE_UPGRADE,
          spec:             { chart: { metadata: { version: '1.5.0' } } }
        },
        t: (key: string) => key
      };

      const result = (Chart.methods!.computeSelectedAppStatuses as (statuses: any[]) => any[]).call(thisContext, defaultStatuses);

      const upgradeableStatus = result.find((s: any) => s.icon === 'icon-upgrade-alt');

      expect(upgradeableStatus).toBeDefined();
    });

    it('does not include upgradeable status when selected app is not upgradeable', () => {
      const thisContext = {
        selectedInstalledApp: {
          upgradeAvailable: APP_UPGRADE_STATUS.NO_UPGRADE,
          spec:             { chart: { metadata: { version: '1.5.0' } } }
        },
        t: (key: string) => key
      };

      const result = (Chart.methods!.computeSelectedAppStatuses as (statuses: any[]) => any[]).call(thisContext, defaultStatuses);

      const upgradeableStatus = result.find((s: any) => s.icon === 'icon-upgrade-alt');

      expect(upgradeableStatus).toBeUndefined();
    });

    it('includes all relevant statuses: deprecated, upgradeable, and installed', () => {
      const thisContext = {
        selectedInstalledApp: {
          upgradeAvailable: APP_UPGRADE_STATUS.SINGLE_UPGRADE,
          spec:             { chart: { metadata: { version: '1.5.0' } } }
        },
        t: (key: string) => key
      };

      const result = (Chart.methods!.computeSelectedAppStatuses as (statuses: any[]) => any[]).call(thisContext, defaultStatuses);

      expect(result).toHaveLength(3);

      const hasDeprecated = result.some((s: any) => s.icon === 'icon-alert-alt');
      const hasUpgradeable = result.some((s: any) => s.icon === 'icon-upgrade-alt');
      const hasInstalled = result.some((s: any) => s.icon === 'icon-confirmation-alt');

      expect(hasDeprecated).toBe(true);
      expect(hasUpgradeable).toBe(true);
      expect(hasInstalled).toBe(true);
    });
  });

  describe('computed: installedAppOptions', () => {
    const makeApp = (namespace: string, name: string, upgradeStatus: string) => ({
      id:               `${ namespace }/${ name }`,
      metadata:         { namespace, name },
      upgradeAvailable: upgradeStatus
    });

    it('returns empty array when no installed instances', () => {
      const thisContext = {
        installedInstances: [],
        t:                  (key: string) => key
      };

      const result = (Chart.computed!.installedAppOptions as () => any[]).call(thisContext);

      expect(result).toStrictEqual([]);
    });

    it('returns options without upgradeable suffix for non-upgradeable apps', () => {
      const thisContext = {
        installedInstances: [
          makeApp('default', 'my-app', APP_UPGRADE_STATUS.NO_UPGRADE)
        ],
        t: (key: string) => key
      };

      const result = (Chart.computed!.installedAppOptions as () => any[]).call(thisContext);

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        value: 'default/my-app',
        label: 'default/my-app'
      });
    });

    it('adds upgradeable suffix for apps with available upgrade', () => {
      const thisContext = {
        installedInstances: [
          makeApp('cattle-system', 'rancher-app', APP_UPGRADE_STATUS.SINGLE_UPGRADE)
        ],
        t: (key: string) => key
      };

      const result = (Chart.computed!.installedAppOptions as () => any[]).call(thisContext);

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        value: 'cattle-system/rancher-app',
        label: 'cattle-system/rancher-app (generic.upgradeable)'
      });
    });

    it('correctly labels mixed upgradeable and non-upgradeable apps', () => {
      const thisContext = {
        installedInstances: [
          makeApp('default', 'app-one', APP_UPGRADE_STATUS.NO_UPGRADE),
          makeApp('kube-system', 'app-two', APP_UPGRADE_STATUS.SINGLE_UPGRADE),
          makeApp('monitoring', 'app-three', APP_UPGRADE_STATUS.NOT_APPLICABLE)
        ],
        t: (key: string) => key
      };

      const result = (Chart.computed!.installedAppOptions as () => any[]).call(thisContext);

      expect(result).toHaveLength(3);
      expect(result[0].label).toBe('default/app-one');
      expect(result[1].label).toBe('kube-system/app-two (generic.upgradeable)');
      expect(result[2].label).toBe('monitoring/app-three');
    });
  });
});
