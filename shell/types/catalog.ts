export interface IChartVersions {
  annotations?: Record<string, any>,
  version: string,
}

export interface IChart {
  versions: IChartVersions[];
  deprecated: boolean;
  hidden: boolean;
  repoKey: string;
  chartType: string;
  chartName: string;
  categories: string[];
  chartDescription: string;
  chartNameDisplay: string;
}

export interface IChartOptions {
  clusterProvider?: string;
  operatingSystems?: string | string[];
  category?: string;
  searchQuery?: string;
  showDeprecated?: boolean;
  showHidden?: boolean;
  showPrerelease?: boolean;
  hideRepos?: string[];
  showRepos?: string[];
  showTypes?: string[];
  hideTypes?: string[];
}
