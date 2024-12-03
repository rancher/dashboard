import { UI_PLUGINS_REPOS } from '@shell/config/uiplugins';

export const HARVESTER_CHART = {
  name:        'harvester',
  version:     '',
  repoType:    'cluster',
  repoName:    'harvester',
};

export const HARVESTER_COMMUNITY_REPO = {
  type: 'catalog.cattle.io.clusterrepo',
  metadata: { 
    name: 'harvester',
  },
  spec: {
    clientSecret: null,
    gitRepo: 'https://github.com/harvester/harvester-ui-extension',
    gitBranch: 'gh-pages'
  }
};

export const HARVESTER_RANCHER_REPO = {
  type: 'catalog.cattle.io.clusterrepo',
  metadata: { 
    name: 'harvester',
  },
  spec: {
    clientSecret: null,
    gitRepo: UI_PLUGINS_REPOS.OFFICIAL.URL,
    gitBranch: UI_PLUGINS_REPOS.OFFICIAL.BRANCH,
  }
};
