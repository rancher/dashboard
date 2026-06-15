/**
 * Helper for collecting system information and formatting into to a query string
 */

import { sha256 } from '@shell/utils/crypto';
import {
  COUNT,
  MANAGEMENT,
} from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { getVersionData } from '@shell/config/version';
import { SettingsInfo } from '@shell/utils/dynamic-content/types';
import { STEVE_CACHE } from '@shell/store/features';

const QS_VERSION = 'v1'; // Include a version number in the query string in case we want to version the set of params we are sending
const UNKNOWN = 'unknown';

// List of known UI extensions from SUSE
const SUSE_EXTENSIONS = [
  'capi',
  'elemental',
  'harvester',
  'kubewarden',
  'neuvector-ui-ext',
  'observability',
  'supportability-review-app',
  'virtual-clusters'
];

type FeatureFlagInfos = {
  [id: string]: {
    /**
     * Query param, in format `ff-<param>`
     */
    param: string,
    /**
      * The actual value used by the UI, roughly spec.value || status.default
      */
    value: string,
  }
};

/**
 * Explicit ff's to send
 */
const ffs: FeatureFlagInfos = {
  [STEVE_CACHE]: {
    param: 'usc',
    value: '',
  }
};

/**
 * System information that is collected and which can then be encoded into a query string in the dyanmic content request
 */
type SystemInfo = {
  systemUUID: string;
  systemHash: string;
  serverVersionType: string;
  userHash: string;
  version: string;
  isDeveloperVersion: boolean;
  isPrime: boolean;
  isLTS: boolean;
  clusterCount: number;
  localCluster: any;
  extensions?: {
    knownInstalled: string[];
    customCount: number;
  };
  browserSize: string;
  screenSize: string;
  language: string;
  featureFlags: FeatureFlagInfos
};

/**
 * Helper that will gather system information and provided the `buildQueryString` method to format as a query string
 */
export class SystemInfoProvider {
  private info: SystemInfo;

  constructor(getters: any, settings: Partial<SettingsInfo>) {
    this.info = this.getSystemData(getters, settings);
  }

  /**
   * Get the data that we need from the system
   * @param getters Store getters to access the store
   * @returns System data
   */
  private getSystemData(getters: any, settingsInfo: Partial<SettingsInfo>): SystemInfo {
    let url;
    let systemUUID = UNKNOWN;
    let serverVersionType = UNKNOWN;

    const serverUrlSetting = getters['management/byId'](MANAGEMENT.SETTING, SETTING.SERVER_URL);

    // Server URL
    if (serverUrlSetting) {
      url = serverUrlSetting.value || UNKNOWN;
    }

    // UUID
    const uuidSetting = getters['management/byId'](MANAGEMENT.SETTING, 'install-uuid');

    if (uuidSetting) {
      systemUUID = uuidSetting.value || UNKNOWN;
    }

    // Server Version Type
    const serverVersionTypeSetting = getters['management/byId'](MANAGEMENT.SETTING, 'server-version-type');

    if (serverVersionTypeSetting) {
      serverVersionType = serverVersionTypeSetting.value || UNKNOWN;
    }

    // Otherwise, use the window location's host
    url = url || window.location?.host;

    // System and User hashes
    const systemHash = (sha256(url, 'hex') as string).substring(0, 32);
    const currentPrincipal = getters['auth/principalId'] || UNKNOWN;
    const userHash = (sha256(currentPrincipal, 'hex') as string).substring(0, 32);

    // Version info
    const versionData = getVersionData();
    const vers = versionData.Version.split('-');

    // General stats that can help us shape content delivery

    // High-level information from clusters
    const counts = this.getAll(getters, COUNT)?.[0]?.counts || {};
    const clusterCount = counts[MANAGEMENT.CLUSTER] || {};
    const localCluster = getters['localCluster'];

    // Stats for installed extensions
    const uiExtensionList = getters['uiplugins/plugins'];
    let extensions;

    if (uiExtensionList) {
      const suseExtensions = [
        ...SUSE_EXTENSIONS,
        ...settingsInfo?.suseExtensions || []
      ];
      const notBuiltIn = uiExtensionList.filter((e: any) => !e.builtin);
      const suseNames = notBuiltIn.filter((e: any) => suseExtensions.includes(e.name)).map((e: any) => e.name);
      const customCount = notBuiltIn.length - suseNames.length;

      extensions = {
        knownInstalled: suseNames,
        customCount,
      };
    }

    const screenSize = `${ window.screen?.width || '?' }x${ window.screen?.height || '?' }`;
    const browserSize = `${ window.innerWidth }x${ window.innerHeight }`;

    const safeFfs = Object.entries(ffs).reduce((res, [id, ff]) => {
      try {
        res[id] = {
          param: ff.param,
          value: getters['features/get'](id),
        };
      } catch (e) {
        console.debug(`Cannot include Feature Flag "${ id }" in dynamic feature request: `, e); // eslint-disable-line no-console
      }

      return res;
    }, {} as FeatureFlagInfos);

    return {
      systemUUID,
      userHash,
      systemHash,
      serverVersionType,
      version:            vers[0],
      isDeveloperVersion: vers.length > 1,
      isPrime:            versionData.RancherPrime === 'true',
      isLTS:              false,
      clusterCount:       clusterCount?.summary?.count,
      localCluster,
      extensions,
      screenSize,
      browserSize,
      language:           window.navigator?.language,
      featureFlags:       safeFfs,
    };
  }

  // Helper to get all resources of a type only if they are available
  private getAll(getters: any, typeName: string): any {
    if (getters['management/typeRegistered'](typeName)) {
      return getters['management/all'](typeName);
    }

    return undefined;
  }

  /**
   * Build query string of params to send so that we can deliver better content
   */
  public buildQueryString(): string {
    const systemData = this.info;
    const params = [`dcv=${ QS_VERSION }`];

    // System and User
    params.push(`s=${ systemData.systemHash }`);
    params.push(`u=${ systemData.userHash }`);

    // Install UUID
    if (systemData.systemUUID !== UNKNOWN) {
      params.push(`uuid=${ systemData.systemUUID }`);
    }

    // Server Version Type
    if (systemData.serverVersionType !== UNKNOWN) {
      params.push(`svt=${ systemData.serverVersionType }`);
    }

    // Version info
    params.push(`v=${ systemData.version }`);
    params.push(`dev=${ systemData.isDeveloperVersion }`);
    params.push(`p=${ systemData.isPrime }`);

    // Remove LTS for now, until we can determine LTS status
    // params.push(`lts=${ systemData.isLTS }`);

    // Clusters
    params.push(`cc=${ systemData.clusterCount }`);

    if (systemData.localCluster) {
      params.push(`lkv=${ systemData.localCluster.kubernetesVersionBase || UNKNOWN }`);
      params.push(`lcp=${ systemData.localCluster.provisioner || UNKNOWN }`);
      params.push(`lnc=${ systemData.localCluster.status.nodeCount || 0 }`);
    }

    // Extensions
    if (systemData.extensions) {
      params.push(`xkn=${ systemData.extensions.knownInstalled.join(',') }`);
      params.push(`xcc=${ systemData.extensions.customCount }`);
    }

    // Browser Language
    params.push(`bl=${ systemData.language }`);

    // Browser size
    params.push(`bs=${ systemData.browserSize }`);

    // Screen size
    if (systemData.screenSize !== '?x?') {
      params.push(`ss=${ systemData.screenSize }`);
    }

    Object.values(systemData.featureFlags).forEach((ff) => {
      params.push(`ff-` + `${ ff.param }=${ ff.value }`);
    });

    return params.join('&');
  }
}
