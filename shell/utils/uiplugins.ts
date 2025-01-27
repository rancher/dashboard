import { matchesSomeRegex } from '@shell/utils/string';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { CATALOG } from '@shell/config/types';
import { UI_PLUGIN_BASE_URL, isSupportedChartVersion } from '@shell/config/uiplugins';

const MAX_RETRIES = 10;
const RETRY_WAIT = 2500;

type Action = 'install' | 'upgrade';
export type HelmRepository = any;
export type HelmChart = any;

/**
 *
 * @param store Vue store
 * @param chartName The chartName
 * @param rancherVersion Rancher version
 * @param kubeVersion K8s version
 * @param opt Store options
 * @returns The latest compatible version of the extension; return null If there are no compatible versions.
 */
export async function getLatestExtensionVersion(
  store: any,
  chartName: string,
  rancherVersion: string,
  kubeVersion: string,
  opt = { reset: true, force: true },
) {
  await store.dispatch('catalog/load', opt);

  const chart = store.getters['catalog/chart']({ chartName });

  const versions = chart?.versions || [];

  const compatibleVersions = versions.filter((version: any) => isSupportedChartVersion({
    version, rancherVersion, kubeVersion
  }));

  return compatibleVersions[0]?.version;
}

/**
 * Wait for a given UI Extension to be available
 *
 * @param store Vue store
 * @param name Name of the extension
 * @returns the extension object when available, null if timed out waiting for it to be available
 */
export async function waitForUIExtension(store: any, name: string): Promise<any> {
  let tries = 0;

  while (true) {
    try {
      const res = await store.dispatch('management/request', {
        url:                  `${ UI_PLUGIN_BASE_URL }`,
        method:               'GET',
        headers:              { accept: 'application/json' },
        redirectUnauthorized: false,
      });

      const entries = res.entries || res.Entries || {};
      const extension = entries[name];

      if (extension) {
        return extension;
      }
    } catch (e) {
    }

    tries++;

    if (tries > MAX_RETRIES) {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT));
  }
}

/**
 * Wait for a given UI Extension package to be available
 *
 * @param store Vue store
 * @param extension Extension object
 * @returns true when available, false if timed out waiting for it to be available
 */
export async function waitForUIPackage(store: any, extension: any): Promise<boolean> {
  let tries = 0;

  const { name, version } = extension;

  while (true) {
    try {
      await store.dispatch('management/request', {
        url:                  `${ UI_PLUGIN_BASE_URL }/${ name }/${ version }/plugin/${ name }-${ version }.umd.min.js`,
        method:               'GET',
        headers:              { accept: 'application/json' },
        redirectUnauthorized: false,
      });

      return true;
    } catch (error) {
    }

    tries++;

    if (tries > MAX_RETRIES) {
      return false;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT));
  }
}

/**
 * Install Helm Chart
 *
 * Note: This should really be provided via the shell rather than copied here
 */
export async function installHelmChart(repo: any, chart: any, values: any = {}, namespace = 'default', action: Action = 'install') {
  /*
    Refer to the developer docs at docs/developer/helm-chart-apps.md
    for details on what values are injected and where they come from.
  */
  // TODO: This is needed in order to support system registry for air-gapped environments
  // this.addGlobalValuesTo(values);

  const chartInstall = {
    chartName:   chart.name,
    version:     chart.version,
    releaseName: chart.name,
    description: chart.name,
    annotations: {
      [CATALOG_ANNOTATIONS.SOURCE_REPO_TYPE]: chart.repoType,
      [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: chart.repoName
    },
    values,
  };

  /*
    Configure Helm CLI options for doing the install or
    upgrade operation.
  */
  const installRequest = {
    charts:                   [chartInstall],
    noHooks:                  false,
    timeout:                  '1000s',
    wait:                     true,
    namespace,
    projectId:                '',
    disableOpenAPIValidation: false,
    skipCRDs:                 false,
  };

  // Install the Chart
  const res = await repo.doAction(action, installRequest);

  return res;
}

/**
 *
 * @param store Vue store
 * @param url Repository Url
 * @returns HelmRepository
 */
export async function getHelmRepositoryExact(store: any, url: string): Promise<HelmRepository> {
  return await getHelmRepository(store, (repository: any) => {
    const target = repository.spec?.gitRepo || repository.spec?.url;

    return target === url;
  });
}

/**
 *
 * @param store Vue store
 * @param urlRegexes Regex to match a community repository
 * @returns HelmRepository
 */
export async function getHelmRepositoryMatch(store: any, urlRegexes: string[]): Promise<HelmRepository> {
  return await getHelmRepository(store, (repository: any) => {
    const target = repository.spec?.gitBranch ? repository.spec?.gitRepo : repository.spec?.url;

    return matchesSomeRegex(target, urlRegexes);
  });
}

/**
 *
 * @param store Vue store
 * @param matchFn Match function for repository's urls
 * @returns HelmRepository
 */
async function getHelmRepository(store: any, matchFn: (repository: any) => boolean): Promise<HelmRepository> {
  if (store.getters['management/schemaFor'](CATALOG.CLUSTER_REPO)) {
    const repos = await store.dispatch('management/findAll', { type: CATALOG.CLUSTER_REPO, opt: { force: true, watch: false } });

    return repos.find(matchFn);
  } else {
    throw new Error('No permissions');
  }
}

/**
 *
 * @param store Vue store
 * @param url Repository Url
 */
export async function refreshHelmRepository(store: any, url: string): Promise<void> {
  const repository = await getHelmRepositoryExact(store, url);

  const now = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');

  repository.spec.forceUpdate = now;

  await repository.save();

  await repository.waitForState('active', 10000, 1000);

  await new Promise((resolve) => setTimeout(resolve, 2000));
}

/**
 *
 * @param store Vue store
 * @param name Repository name
 * @param url Repository Url
 * @param branch Repository Branch
 * @returns HelmRepository
 */
export async function createHelmRepository(store: any, name: string, url: string, branch?: string): Promise<HelmRepository> {
  const data = {
    type:     CATALOG.CLUSTER_REPO,
    metadata: { name },
    spec:     {} as any
  };

  if (branch) {
    data.spec.gitBranch = branch;
    data.spec.gitRepo = url;
  } else {
    data.spec.url = url;
  }

  // Create a model for the new repository and save it
  const repo = await store.dispatch('management/create', data);

  const helmRepo = await repo.save();

  // Poll the repository until it says it has been downloaded
  let fetched = false;
  let tries = 0;

  while (!fetched) {
    const repo = await store.dispatch('management/find', {
      type: CATALOG.CLUSTER_REPO,
      id:   helmRepo.id, // Get the ID from the Helm Repository
      opt:  { force: true, watch: false }
    });

    tries++;

    const downloaded = repo.status.conditions.find((s: any) => s.type === 'Downloaded');

    if (downloaded) {
      if (downloaded.status === 'True') {
        fetched = true;
      }
    }

    if (!fetched) {
      tries++;

      if (tries > MAX_RETRIES) {
        throw new Error('Failed to add Helm Chart Repository');
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT));
    }

    fetched = true;
  }

  // Return the Helm Repository
  return helmRepo;
}

/**
 * Get the given Helm Chart from the specified Helm Repository
 *
 * @param store Vue store
 * @param repository Repository Url
 * @param chartName Helm Chart name
 * @returns Helm Chart
 */
export async function getHelmChart(store: any, repository: any, chartName: string): Promise<HelmChart | null> {
  let tries = 0;

  while (true) {
    try {
      const versionInfo = await store.dispatch('management/request', {
        method: 'GET',
        url:    `${ repository?.links?.info }&chartName=${ chartName }`,
      });

      return versionInfo.chart;
    } catch (error) {
    }

    tries++;

    if (tries > MAX_RETRIES) {
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT));
  }
}
