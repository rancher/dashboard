export type VersionCompatibility = {
    isVersionCompatible: boolean;
    versionIncompatibilityData: any;
  };

export type ChartVersion = {
    name: string;
    version: string;
    description: string;
    icon: string;
    apiVersion: string;
    appVersion: string;
    annotations: {
      [key: string]: string;
    };
    type: string;
    urls: string[];
    created: string;
    digest: string;
    key: string;
    repoType: string;
    repoName: string;
  };

export type Version = ChartVersion & VersionCompatibility;

export type Chart = {
    key: string;
    type: string;
    id: string;
    certified: string;
    sideLabel?: string;
    repoType: string;
    repoName: string;
    repoNameDisplay: string;
    certifiedSort: number;
    icon: string;
    color?: string;
    chartType: string;
    chartName: string;
    chartNameDisplay: string;
    chartDescription: string;
    repoKey: string;
    versions: ChartVersion[];
    categories: any[];
    deprecated: boolean;
    experimental: boolean;
    hidden: boolean;
    targetNamespace: string;
    scope: string;
    provides: any[];
    windowsIncompatible: boolean;
    deploysOnWindows: boolean;
  };

export type Plugin = {
    name: string;
    label: string;
    description: string;
    id: string;
    versions: Version[];
    installed: boolean;
    builtin: boolean;
    experimental: boolean;
    certified: boolean;
    chart: Chart;
    incompatibilityMessage: string;
    installableVersions: ChartVersion[];
    displayVersion: string;
    /**
     * The installed version, as a Helm Chart version so it can be compared against the other
     * version fields. Only set when the extension is installed.
     */
    installedVersion?: string;
    pluginVersionLabel: string;
    icon?: string;
    helmError: boolean;
  };
