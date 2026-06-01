import { computed, ref, type Ref, type ComputedRef } from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { Store } from 'vuex';
import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE, NAME,
  DESCRIPTION as DESCRIPTION_QUERY, DEPRECATED as DEPRECATED_QUERY,
  HIDDEN, _FLAGGED, _CREATE, _EDIT
} from '@shell/config/query-params';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { NAME as EXPLORER } from '@shell/config/product/explorer';
import { NAME as MANAGER } from '@shell/config/product/manager';
import { OPA_GATE_KEEPER_ID } from '@shell/pages/c/_cluster/gatekeeper/index.vue';
import { formatSi, parseSi } from '@shell/utils/units';
import { CAPI, CATALOG } from '@shell/config/types';
import { isPrerelease } from '@shell/utils/version';
import { compareChartVersions } from '@shell/utils/chart';
import difference from 'lodash/difference';
import { LINUX, APP_UPGRADE_STATUS } from '@shell/store/catalog';
import { clone } from '@shell/utils/object';
import { merge } from 'lodash';

interface ChartQuery {
  repoType: string;
  repoName: string;
  chartName: string;
  versionName: string;
  appNamespace: string;
  appName: string;
  description: string;
  hidden: string;
  deprecated: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VuexStore = Store<any>;
type TranslateFn = (key: string, args?: any, raw?: boolean) => string;

export interface UseChartReturn {
  // Refs
  chart: Ref<any>;
  version: Ref<any>;
  versionInfo: Ref<any>;
  versionInfoError: Ref<any>;
  existing: Ref<any>;
  mode: Ref<string>;
  ignoreWarning: Ref<boolean>;

  // Computed
  showPreRelease: ComputedRef<boolean>;
  repo: ComputedRef<any>;
  showReadme: ComputedRef<boolean>;
  hasReadme: ComputedRef<boolean>;
  mappedVersions: ComputedRef<any[]>;
  filteredVersions: ComputedRef<any[]>;
  query: ComputedRef<ChartQuery>;
  showDeprecated: ComputedRef<boolean>;
  showHidden: ComputedRef<boolean>;
  warnings: ComputedRef<string[]>;
  requires: ComputedRef<string[]>;
  currentVersion: ComputedRef<string | undefined>;
  targetVersion: ComputedRef<string>;
  action: ComputedRef<{ name: string; tKey: string; icon: string }>;
  isChartTargeted: ComputedRef<boolean>;
  hasQuestions: ComputedRef<boolean>;
  currentCluster: ComputedRef<any>;
  isRancher: ComputedRef<boolean>;

  // Methods
  fetchStoreChart: () => any;
  fetchChart: () => Promise<void>;
  fetchAutoInstallInfo: () => Promise<void>;
  selectVersion: (option: { id: string }) => void;
  provider: (gvr: string) => any;
  chartLocation: (install?: boolean, prov?: any) => any;
  appLocation: () => any;
  clusterToolsLocation: () => any;
  clustersLocation: () => any;
}

export function useChart(
  store: VuexStore,
  route: RouteLocationNormalizedLoaded,
  router: Router,
  t: TranslateFn,
): UseChartReturn {
  const chart = ref<any>(null);
  const version = ref<any>(null);
  const versionInfo = ref<any>(null);
  const versionInfoError = ref<any>(null);
  const existing = ref<any>(null);
  const mode = ref(_CREATE);
  const ignoreWarning = ref(false);

  const currentCluster = computed(() => store.getters.currentCluster);
  const isRancher = computed(() => store.getters.isRancher);
  const showPreRelease = computed(() => store.getters['prefs/get'](SHOW_PRE_RELEASE));

  const query = computed<ChartQuery>(() => {
    const q = route.query;

    return {
      repoType:     (q[REPO_TYPE] as string) || '',
      repoName:     (q[REPO] as string) || '',
      chartName:    (q[CHART] as string) || '',
      versionName:  (q[VERSION] as string) || '',
      appNamespace: (q[NAMESPACE] as string) || '',
      appName:      (q[NAME] as string) || '',
      description:  (q[DESCRIPTION_QUERY] as string) || '',
      hidden:       (q[HIDDEN] as string) || '',
      deprecated:   (q[DEPRECATED_QUERY] as string) || '',
    };
  });

  const showDeprecated = computed(() => query.value.deprecated === 'true' || query.value.deprecated === _FLAGGED);
  const showHidden = computed(() => query.value.hidden === _FLAGGED);

  const repo = computed(() => store.getters['catalog/repo']({
    repoType: query.value.repoType,
    repoName: query.value.repoName,
  }));

  const showReadme = computed(() => !!versionInfo.value?.readme);
  const hasReadme = computed(() => !!versionInfo.value?.appReadme || !!versionInfo.value?.readme);

  const currentVersion = computed(() => existing.value?.spec?.chart?.metadata?.version);
  const targetVersion = computed(() => (version.value ? version.value.version : query.value.versionName));

  const mappedVersions = computed(() => {
    const versions = (chart.value?.versions || []).slice();

    versions.sort((a: any, b: any) => compareChartVersions(b.version, a.version));

    const selectedVersion = targetVersion.value;
    const OSs = currentCluster.value?.workerOSs;
    const out: any[] = [];

    versions.forEach((v: any) => {
      const nue: any = {
        label:           v.version,
        version:         v.version,
        originalVersion: v.version,
        id:              v.version,
        created:         v.created,
        disabled:        false,
        keywords:        v.keywords,
      };

      const permittedSystems = (v?.annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || LINUX).split(',');

      if (permittedSystems.length > 0 && difference(OSs, permittedSystems).length > 0) {
        nue.disabled = true;
      }

      if (permittedSystems.length === 1) {
        nue.label = t(`catalog.install.versions.${ permittedSystems[0] }`, { ver: v.version });
      }

      if (!showPreRelease.value && isPrerelease(v.version)) {
        return;
      }

      out.push(nue);
    });

    const selectedMatch = out.find((v: any) => v.id === selectedVersion);

    if (!selectedMatch) {
      out.unshift({
        label:           selectedVersion,
        originalVersion: selectedVersion,
        id:              selectedVersion,
        created:         null,
        disabled:        false,
        keywords:        [],
      });
    }

    const cur = out.find((v: any) => v.originalVersion === currentVersion.value);

    if (cur) {
      cur.label = t('catalog.install.versions.current', { ver: currentVersion.value });
    }

    return out;
  });

  const filteredVersions = computed(() => {
    return showPreRelease.value ? mappedVersions.value : mappedVersions.value.filter((v: any) => !v.isPre);
  });

  const warnings = computed(() => {
    const out: string[] = [];

    if (existing.value) {
      // Ignore resource limits on upgrade
    } else {
      const needCpu = parseSi(version.value?.annotations?.[CATALOG_ANNOTATIONS.REQUESTS_CPU] || '0');
      const needMemory = parseSi(version.value?.annotations?.[CATALOG_ANNOTATIONS.REQUESTS_MEMORY] || '0');
      const availableCpu = currentCluster.value?.availableCpu;
      const availableMemory = currentCluster.value?.availableMemory;

      if (availableCpu !== null && availableCpu < needCpu) {
        out.push(t('catalog.install.error.insufficientCpu', {
          need: Math.round(needCpu * 100) / 100,
          have: Math.round(availableCpu * 100) / 100,
        }));
      }

      if (availableMemory !== null && availableMemory < needMemory) {
        out.push(t('catalog.install.error.insufficientMemory', {
          need: formatSi(needMemory, {
            increment: 1024, suffix: 'iB', firstSuffix: 'B'
          }),
          have: formatSi(availableMemory, {
            increment: 1024, suffix: 'iB', firstSuffix: 'B'
          }),
        }));
      }
    }

    if (chart.value?.id === OPA_GATE_KEEPER_ID) {
      out.unshift(t('gatekeeperIndex.deprecated', {}, true));
    }

    if (existing.value && existing.value.upgradeAvailable === APP_UPGRADE_STATUS.NOT_APPLICABLE) {
      const manager = existing.value?.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.MANAGED] || 'Rancher';

      out.unshift(t('catalog.install.warning.managed', {
        name:    existing.value.name,
        version: chart.value ? query.value.versionName : null,
        manager: manager === 'true' ? 'Rancher' : manager,
      }, true));
    }

    return out;
  });

  const requires = computed(() => {
    const out: string[] = [];
    const required = (version.value?.annotations?.[CATALOG_ANNOTATIONS.REQUIRES_GVK] || '')
      .split(/\s*,\s*/)
      .filter((x: string) => !!x)
      .reverse();

    if (required.length) {
      for (const gvr of required) {
        if (store.getters['catalog/isInstalled']({ gvr })) {
          continue;
        }

        const prov = provider(gvr);

        if (prov) {
          const url = router.resolve(chartLocation(true, prov)).href;

          out.push(t('catalog.install.error.requiresFound', { url, name: prov.name }, true));
        } else {
          out.push(t('catalog.install.error.requiresMissing', { name: gvr }));
        }
      }
    }

    return out;
  });

  const action = computed(() => {
    if (!existing.value) {
      return {
        name: 'install', tKey: 'install', icon: 'icon-plus'
      };
    }

    if (currentVersion.value === targetVersion.value) {
      return {
        name: 'editVersion', tKey: 'edit', icon: 'icon-edit'
      };
    }

    const diff = compareChartVersions(currentVersion.value, targetVersion.value);

    if (diff < 0) {
      return {
        name: 'upgrade', tKey: 'upgrade', icon: 'icon-upgrade-alt'
      };
    }

    return {
      name: 'downgrade', tKey: 'downgrade', icon: 'icon-downgrade-alt'
    };
  });

  const isChartTargeted = computed(() => !!chart.value?.targetNamespace && !!chart.value?.targetName);
  const hasQuestions = computed(() => !!versionInfo.value?.questions);

  function fetchStoreChart() {
    if (!chart.value && repo.value && query.value.chartName) {
      chart.value = store.getters['catalog/chart']({
        repoType:       query.value.repoType,
        repoName:       query.value.repoName,
        chartName:      query.value.chartName,
        includeHidden:  true,
        showDeprecated: showDeprecated.value,
      });
    }

    return chart.value;
  }

  async function fetchChart() {
    versionInfoError.value = null;

    await Promise.all([
      store.dispatch('catalog/load'),
      store.dispatch('cluster/findAll', { type: CATALOG.APP }),
    ]);

    fetchStoreChart();

    if (!chart.value) {
      return;
    }

    const q = query.value;
    let versionName = q.versionName;

    if (!versionName && chart.value.versions?.length) {
      if (showPreRelease.value) {
        versionName = chart.value.versions[0].version;
      } else {
        const firstRelease = chart.value.versions.find((v: any) => !isPrerelease(v.version));

        versionName = firstRelease?.version || chart.value.versions[0].version;
      }
    }

    if (!versionName) {
      return;
    }

    try {
      version.value = store.getters['catalog/version']({
        repoType:       q.repoType,
        repoName:       q.repoName,
        chartName:      q.chartName,
        versionName,
        showDeprecated: showDeprecated.value,
      });
    } catch (e) {
      console.error('Unable to fetch Version: ', e); // eslint-disable-line no-console
    }

    if (!version.value) {
      console.warn('No version found: ', q.repoType, q.repoName, q.chartName, versionName); // eslint-disable-line no-console
    }

    try {
      versionInfo.value = await store.dispatch('catalog/getVersionInfo', {
        repoType:  q.repoType,
        repoName:  q.repoName,
        chartName: q.chartName,
        versionName,
      });
    } catch (e) {
      versionInfoError.value = e;
      console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
    }

    if (q.appNamespace && q.appName) {
      try {
        existing.value = await store.dispatch('cluster/find', {
          type: CATALOG.APP,
          id:   `${ q.appNamespace }/${ q.appName }`,
        });

        await existing.value?.fetchValues(true);
        mode.value = _EDIT;
      } catch (e) {
        mode.value = _CREATE;
        existing.value = null;
      }
    } else {
      const targetNamespace = version.value?.annotations?.[CATALOG_ANNOTATIONS.NAMESPACE];
      const targetName = version.value?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME];

      if (targetNamespace && targetName) {
        try {
          existing.value = await store.dispatch('cluster/find', {
            type: CATALOG.APP,
            id:   `${ targetNamespace }/${ targetName }`,
          });
          mode.value = _EDIT;
        } catch (e) {
          mode.value = _CREATE;
          existing.value = null;
        }
      } else if (chart.value) {
        const matching = chart.value.matchingInstalledApps;

        if (matching?.length === 1) {
          existing.value = matching[0];
          mode.value = _EDIT;
        } else {
          mode.value = _CREATE;
        }
      } else {
        mode.value = _CREATE;
      }
    }
  }

  async function fetchAutoInstallInfo() {
    const out: any[] = [];
    const auto = (version.value?.annotations?.[CATALOG_ANNOTATIONS.AUTO_INSTALL] || '')
      .split(/\s*,\s*/)
      .filter((x: string) => !!x)
      .reverse();

    for (const constraint of auto) {
      const prov = store.getters['catalog/versionSatisfying']({
        constraint,
        repoName:     chart.value.repoName,
        repoType:     chart.value.repoType,
        chartVersion: version.value.version,
      });

      if (prov) {
        try {
          const crdVersionInfo = await store.dispatch('catalog/getVersionInfo', {
            repoType:    prov.repoType,
            repoName:    prov.repoName,
            chartName:   prov.name,
            versionName: prov.version,
          });

          let existingCRDApp;

          if (mode.value === _EDIT) {
            const crdTargetNamespace = crdVersionInfo?.chart?.annotations?.[CATALOG_ANNOTATIONS.NAMESPACE];
            const crdTargetName = crdVersionInfo?.chart?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME];

            if (crdTargetName && crdTargetNamespace) {
              existingCRDApp = await store.dispatch('cluster/find', {
                type: CATALOG.APP,
                id:   `${ crdTargetNamespace }/${ crdTargetName }`,
              });
            }
          }

          if (existingCRDApp) {
            await existingCRDApp.fetchValues(true);

            const existingValues = clone(existingCRDApp.values || {});
            const defaultValues = clone(existingCRDApp.chartValues || {});

            crdVersionInfo.existingValues = existingValues;
            crdVersionInfo.allValues = merge(defaultValues, existingValues);
          } else {
            crdVersionInfo.allValues = clone(crdVersionInfo.values);
          }

          out.push(crdVersionInfo);
        } catch (e) {
          console.error('Unable to fetch VersionInfo: ', e); // eslint-disable-line no-console
        }
      } else {
        console.error(`This chart requires ${ constraint } but no matching chart was found`); // eslint-disable-line no-console
      }
    }

    return out;
  }

  function selectVersion({ id: versionId }: { id: string }) {
    router.replace({
      query: {
        ...route.query,
        [VERSION]: versionId,
      },
    });
  }

  function provider(gvr: string) {
    return store.getters['catalog/versionProviding']({
      gvr,
      repoName: chart.value.repoName,
      repoType: chart.value.repoType,
    });
  }

  function chartLocation(install = false, prov?: any) {
    const p = prov || {
      repoType: chart.value.repoType,
      repoName: chart.value.repoName,
      name:     chart.value.chartName,
      version:  query.value.versionName,
    };

    const q: Record<string, string> = {
      [REPO_TYPE]: p.repoType,
      [REPO]:      p.repoName,
      [CHART]:     p.name,
      [VERSION]:   p.version,
    };

    if (showDeprecated.value) {
      q[DEPRECATED_QUERY] = query.value.deprecated;
    }

    return {
      name:   install ? 'c-cluster-apps-charts-install' : 'c-cluster-apps-charts-chart',
      params: {
        cluster: route.params.cluster,
        product: store.getters['productId'],
      },
      query: q,
    };
  }

  function appLocation() {
    return existing.value?.detailLocation || {
      name:   'c-cluster-product-resource',
      params: {
        product:  store.getters['productId'],
        cluster:  store.getters['clusterId'],
        resource: CATALOG.APP,
      },
    };
  }

  function clusterToolsLocation() {
    const q: Record<string, string> = {};

    if (showDeprecated.value) {
      q[DEPRECATED_QUERY] = query.value.deprecated;
    }

    return {
      name:   'c-cluster-explorer-tools',
      params: {
        product:  EXPLORER,
        cluster:  store.getters['clusterId'],
        resource: CATALOG.APP,
      },
      query: q,
    };
  }

  function clustersLocation() {
    return {
      name:   'c-cluster-product-resource',
      params: {
        cluster:  route.params.cluster,
        product:  MANAGER,
        resource: CAPI.RANCHER_CLUSTER,
      },
    };
  }

  return {
    chart,
    version,
    versionInfo,
    versionInfoError,
    existing,
    mode,
    ignoreWarning,

    showPreRelease,
    repo,
    showReadme,
    hasReadme,
    mappedVersions,
    filteredVersions,
    query,
    showDeprecated,
    showHidden,
    warnings,
    requires,
    currentVersion,
    targetVersion,
    action,
    isChartTargeted,
    hasQuestions,
    currentCluster,
    isRancher,

    fetchStoreChart,
    fetchChart,
    fetchAutoInstallInfo,
    selectVersion,
    provider,
    chartLocation,
    appLocation,
    clusterToolsLocation,
    clustersLocation,
  };
}
