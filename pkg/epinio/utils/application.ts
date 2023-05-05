import {
  APPLICATION_MANIFEST_SOURCE_TYPE, APPLICATION_SOURCE_TYPE, EpinioApplicationResource, EpinioAppSource, EPINIO_APP_DATA, EPINIO_APP_GIT_SOURCE
} from '../types';
import { parse as parseUrl } from '@shell/utils/url';
import { isGitRepo } from './git';

interface Utils {
  getAppSource: (data: EpinioApplicationResource) => EpinioAppSource;
  getAppSourceInfo: (data: EpinioApplicationResource) => any;
}

function getSourceType(origin: EpinioApplicationResource['origin']): APPLICATION_SOURCE_TYPE {
  switch (origin.Kind) {
  case APPLICATION_MANIFEST_SOURCE_TYPE.PATH:
    return origin.archive ? APPLICATION_SOURCE_TYPE.ARCHIVE : APPLICATION_SOURCE_TYPE.FOLDER;
  case APPLICATION_MANIFEST_SOURCE_TYPE.GIT:
    return (origin.git?.provider || APPLICATION_SOURCE_TYPE.GIT_URL) as APPLICATION_SOURCE_TYPE;
  case APPLICATION_MANIFEST_SOURCE_TYPE.CONTAINER:
    return APPLICATION_SOURCE_TYPE.CONTAINER_URL;
  default:
    return APPLICATION_SOURCE_TYPE.FOLDER;
  }
}

function getGitHubData(git: any): EPINIO_APP_GIT_SOURCE {
  const parsed = parseUrl(git.repository);

  const parts = parsed.path.split('/');

  return {
    usernameOrOrg: parts[1],
    branch:        { name: git.branch },
    commit:        git.revision,
    repo:          { name: parts[2] },
    url:           git.repository,
  };
}

function getGitLabData(git: any): EPINIO_APP_GIT_SOURCE {
  const parsed = parseUrl(git.repository);

  const parts = parsed.path.split('/');

  return {
    usernameOrOrg: parts[1],
    branch:        { name: git.branch },
    commit:        git.revision,
    repo:          {
      name: parts[2],
      id:   '' // Todo get id from somewhere
    },
    url: git.repository,
  };
}

function getAppData(data: EpinioApplicationResource): EPINIO_APP_DATA {
  const type = getSourceType(data.origin);

  const opt = {} as EPINIO_APP_DATA['source'];

  switch (type) {
  case APPLICATION_SOURCE_TYPE.ARCHIVE:
    opt.archive = { fileName: data.origin.path };
    break;
  case APPLICATION_SOURCE_TYPE.CONTAINER_URL:
    opt.container_url = { url: data.origin.container };
    break;
  case APPLICATION_SOURCE_TYPE.FOLDER:
    opt.folder = { fileName: data.origin.path };
    break;
  case APPLICATION_SOURCE_TYPE.GIT_URL:
    opt.git_url = {
      branch: data.origin.git?.branch || '',
      url:    data.origin.git?.repository || ''
    };
    break;
  case APPLICATION_SOURCE_TYPE.GIT_HUB:
    opt.git_hub = getGitHubData(data.origin.git);
    break;
  case APPLICATION_SOURCE_TYPE.GIT_LAB:
    opt.git_lab = getGitLabData(data.origin.git);
    break;
  default:
    break;
  }

  return {
    source: {
      ...opt,
      type,
      builderImage: data.staging.builder,
      appchart:     data.configuration.appchart,
    },
  };
}

function getAppSource(data: EpinioApplicationResource) {
  const { source } = getAppData(data);

  return {
    type:      source.type,
    appChart:  source.appchart,
    git:       isGitRepo(source.type) ? source[source.type] : null,
    gitUrl:    source.git_url,
    container: source.container_url,
    archive:   source.archive
  } as EpinioAppSource;
}

function getAppSourceInfo(data: EpinioApplicationResource) {
  const { source } = getAppData(data);

  const appChart = {
    label: 'App Chart',
    value: source.appchart
  };
  const builderImage = {
    label: 'Builder Image',
    value: source.builderImage
  };

  switch (source.type) {
  case APPLICATION_SOURCE_TYPE.FOLDER:
  case APPLICATION_SOURCE_TYPE.ARCHIVE:
    return {
      label:   'File system',
      icon:    'icon-file',
      details: [
        {
          label: 'Original Name',
          value: source.archive?.fileName
        }, appChart, builderImage
      ]
    };
  case APPLICATION_SOURCE_TYPE.GIT_URL:
    return {
      label:   'Git',
      icon:    'icon-file',
      details: [
        {
          label: 'Url',
          value: source.git_url?.url
        }, {
          label: 'Revision',
          icon:  'icon-commit',
          value: source.git_url?.branch
        }, appChart, builderImage
      ]
    };
  case APPLICATION_SOURCE_TYPE.GIT_HUB:
    return {
      label:   'GitHub',
      icon:    'icon-github',
      details: [
        {
          label: 'Url',
          value: source.git_hub?.url
        }, {
          label: 'Revision',
          icon:  'icon-commit',
          value: source.git_hub?.commit
        }, {
          label: 'Branch',
          icon:  'icon-commit',
          value: source.git_hub?.branch.name
        }, appChart, builderImage
      ]
    };
  case APPLICATION_SOURCE_TYPE.GIT_LAB:
    return {
      label:   'GitLab',
      icon:    'icon-gitlab',
      details: [
        {
          label: 'Url',
          value: source.git_lab?.url
        }, {
          label: 'Revision',
          icon:  'icon-commit',
          value: source.git_lab?.commit
        }, {
          label: 'Branch',
          icon:  'icon-commit',
          value: source.git_lab?.branch.name
        }, appChart, builderImage
      ]
    };
  case APPLICATION_SOURCE_TYPE.CONTAINER_URL:
    return {
      label:   'Container',
      icon:    'icon-docker',
      details: [{
        label: 'Image',
        value: source.container_url?.url
      }, appChart
      ]
    };
  default:
    return undefined;
  }
}

export const AppUtils: Utils = {
  getAppSource,
  getAppSourceInfo,
};
