import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { MANAGEMENT } from '@shell/config/types';
import { _EDIT } from '@shell/config/query-params';
import { findBy } from '@shell/utils/array';
import { allHash } from '@shell/utils/promise';
import { getAllOptionsAfterCurrentVersion, filterOutDeprecatedPatchVersions, isHarvesterSatisfiesVersion } from '@shell/utils/cluster';

export interface UseKubernetesVersionsProps {
  mode: string;
  liveValue: any;
  value: any;
}

/**
 * Resolves the RKE2/K3s Kubernetes version list, the version currently selected on the cluster
 * being edited, and the server/agent arg and chart metadata that come with that version.
 */
export function useKubernetesVersions(props: UseKubernetesVersionsProps) {
  const store = useStore();
  const { t } = useI18n(store);

  const rke2Versions = ref<any[] | null>(null);
  const k3sVersions = ref<any[] | null>(null);
  const defaultRke2 = ref('');
  const defaultK3s = ref('');
  const allPSAs = ref<any[]>([]);
  const showDeprecatedPatchVersions = ref(false);

  const versionOptions = computed(() => {
    const cur = props.liveValue?.spec?.kubernetesVersion || '';
    const existingRke2 = props.mode === _EDIT && cur.includes('rke2');
    const existingK3s = props.mode === _EDIT && cur.includes('k3s');

    let allValidRke2Versions = getAllOptionsAfterCurrentVersion(store, rke2Versions.value, (existingRke2 ? cur : null), defaultRke2.value);
    let allValidK3sVersions = getAllOptionsAfterCurrentVersion(store, k3sVersions.value, (existingK3s ? cur : null), defaultK3s.value);

    if (!showDeprecatedPatchVersions.value) {
      // Normally, we only want to show the most recent patch version
      // for each Kubernetes minor version. However, if the user
      // opts in to showing deprecated versions, we don't filter them.
      allValidRke2Versions = filterOutDeprecatedPatchVersions(allValidRke2Versions, cur);
      allValidK3sVersions = filterOutDeprecatedPatchVersions(allValidK3sVersions, cur);
    }

    const showRke2 = allValidRke2Versions.length && !existingK3s;
    const showK3s = allValidK3sVersions.length && !existingRke2;
    const out: any[] = [];

    if (showRke2) {
      if (showK3s) {
        out.push({ kind: 'group', label: t('cluster.provider.rke2') });
      }

      out.push(...allValidRke2Versions);
    }

    if (showK3s) {
      if (showRke2) {
        out.push({ kind: 'group', label: t('cluster.provider.k3s') });
      }

      out.push(...allValidK3sVersions);
    }

    if (cur) {
      const existing = out.find((x) => x.value === cur);

      if (existing) {
        existing.disabled = false;
      }
    }

    return out;
  });

  const selectedVersion = computed(() => {
    const str = props.value?.spec?.kubernetesVersion;

    if (!str) {
      return undefined;
    }

    const out = findBy(versionOptions.value, 'value', str);

    // Adding the option 'none' to Container Network select (used in Basics component)
    // https://github.com/rancher/dashboard/issues/10338
    // there's an update loop on refresh that might include 'none'
    // multiple times... Prevent that
    if (out?.serverArgs?.cni?.options && !out.serverArgs?.cni?.options.includes('none')) {
      out.serverArgs.cni.options.push('none');
    }

    return out;
  });

  const haveArgInfo = computed(() => Boolean(selectedVersion.value?.serverArgs && selectedVersion.value?.agentArgs));
  const serverArgs = computed(() => selectedVersion.value?.serverArgs || {});
  const agentArgs = computed(() => selectedVersion.value?.agentArgs || {});

  /**
   * The addons (charts) applicable for the selected k8s version
   *
   * { [chartName:string]: { repo: string, version: string } }
   */
  const chartVersions = computed(() => selectedVersion.value?.charts || {});

  async function fetchRke2Versions() {
    if (rke2Versions.value) {
      return;
    }

    const hash: Record<string, any> = {
      rke2Versions: store.dispatch('management/request', { url: '/v1-rke2-release/releases' }),
      k3sVersions:  store.dispatch('management/request', { url: '/v1-k3s-release/releases' }),
    };

    if (store.getters['management/canList'](MANAGEMENT.PSA)) {
      hash.allPSAs = await store.dispatch('management/findAll', { type: MANAGEMENT.PSA });
    }

    // Get the latest versions from the global settings if possible
    const globalSettings = await store.getters['management/all'](MANAGEMENT.SETTING) || [];
    const defaultRke2Setting = globalSettings.find((setting: any) => setting.id === 'rke2-default-version') || {};
    const defaultK3sSetting = globalSettings.find((setting: any) => setting.id === 'k3s-default-version') || {};

    let nextDefaultRke2 = defaultRke2Setting?.value || defaultRke2Setting?.default;
    let nextDefaultK3s = defaultK3sSetting?.value || defaultK3sSetting?.default;

    // RKE2: Use the channel if we can not get the version from the settings
    if (!nextDefaultRke2) {
      hash.rke2Channels = store.dispatch('management/request', { url: '/v1-rke2-release/channels' });
    }

    // K3S: Use the channel if we can not get the version from the settings
    if (!nextDefaultK3s) {
      hash.k3sChannels = store.dispatch('management/request', { url: '/v1-k3s-release/channels' });
    }

    const res = await allHash(hash);

    const nextRke2Versions = res.rke2Versions.data || [];
    const nextK3sVersions = res.k3sVersions.data || [];

    allPSAs.value = res.allPSAs || [];
    rke2Versions.value = nextRke2Versions;
    k3sVersions.value = nextK3sVersions;

    if (!nextDefaultRke2) {
      const rke2Channels = res.rke2Channels.data || [];

      nextDefaultRke2 = rke2Channels.find((x: any) => x.id === 'default')?.latest;
    }

    if (!nextDefaultK3s) {
      const k3sChannels = res.k3sChannels.data || [];

      nextDefaultK3s = k3sChannels.find((x: any) => x.id === 'default')?.latest;
    }

    if (!nextRke2Versions.length && !nextK3sVersions.length) {
      throw new Error('No version info found in KDM');
    }

    // Store default versions
    defaultRke2.value = nextDefaultRke2;
    defaultK3s.value = nextDefaultK3s;
  }

  return {
    rke2Versions,
    k3sVersions,
    defaultRke2,
    defaultK3s,
    allPSAs,
    showDeprecatedPatchVersions,
    versionOptions,
    selectedVersion,
    haveArgInfo,
    serverArgs,
    agentArgs,
    chartVersions,
    fetchRke2Versions,
  };
}

export interface GetDefaultVersionOptions {
  store: any;
  versionOptions: any[];
  defaultRke2: string;
  rke2Versions: any[] | null;
  /**
   * Kept as a plain boolean input rather than something this composable derives itself:
   * it's owned by an Options API computed on the consuming component (reads $route), and
   * setup() runs before Options API computed are initialized, so it can't be read from here.
   */
  isHarvesterDriver: boolean;
}

/**
 * Picks the version to preselect for a new cluster: the first Harvester-compatible rke2
 * version when on the Harvester driver, otherwise the configured default (falling back to
 * the first available option).
 */
export function getDefaultVersion(options: GetDefaultVersionOptions): string | undefined {
  const {
    store, versionOptions, defaultRke2, rke2Versions, isHarvesterDriver
  } = options;

  const all = versionOptions.filter((x) => !!x.value);
  const first = all[0]?.value;
  const preferred = all.find((x) => x.value === defaultRke2)?.value;

  const rke2 = getAllOptionsAfterCurrentVersion(store, rke2Versions, null);
  const showRke2 = rke2.length;
  let out;

  if (isHarvesterDriver && showRke2) {
    const satisfiesVersion = rke2.filter((v: any) => isHarvesterSatisfiesVersion(v.value)) || [];

    if (satisfiesVersion.length > 0) {
      out = satisfiesVersion[0]?.value;
    }
  }

  if (!out) {
    out = preferred || first;
  }

  return out;
}
