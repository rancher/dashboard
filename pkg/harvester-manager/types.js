import { UI_PLUGINS_REPOS } from '@shell/config/uiplugins';

export const HARVESTER_CATALOG_IMAGES = ['ui-plugin-catalog', 'ui-extension-harvester-ui-extension'];

export const harvesterRepoRegexes = [
  /^https:\/\/github\.com\/.*\/harvester-ui-extension+/g, // e.g. https://github.com/harvester/harvester-ui-extension
  /^https:\/\/.*\.github\.io\/harvester-ui-extension+/g, // e.g. https://github.io/harvester/harvester-ui-extension
  UI_PLUGINS_REPOS.OFFICIAL.URL, // rancher/ui-plugin-charts
];

export const HARVESTER_CHART = {
  name:     'harvester',
  version:  '',
  repoType: 'cluster',
  repoName: 'harvester',
};

export const HARVESTER_COMMUNITY_REPO = {
  metadata:  { name: 'harvester' },
  gitRepo:   'https://github.com/harvester/harvester-ui-extension',
  gitBranch: 'gh-pages',
};

export const HARVESTER_RANCHER_REPO = {
  metadata:  { name: 'rancher' },
  gitRepo:   UI_PLUGINS_REPOS.OFFICIAL.URL,
  gitBranch: UI_PLUGINS_REPOS.OFFICIAL.BRANCH,
};
