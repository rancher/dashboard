import { APPLICATION_MANIFEST_SOURCE_TYPE, APPLICATION_SOURCE_TYPE, EpinioApplicationResource, EPINIO_APP_GIT_SOURCE } from '../types';
import { parse as parseUrl } from '@shell/utils/url';

interface Utils {
  getSourceType: (origin: EpinioApplicationResource['origin']) => APPLICATION_SOURCE_TYPE;
  getManifestSourceType: (origin: EpinioApplicationResource['origin']) => APPLICATION_SOURCE_TYPE;
  getGitData: (git: any) => EPINIO_APP_GIT_SOURCE;
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

function getManifestSourceType(origin: EpinioApplicationResource['origin']): APPLICATION_SOURCE_TYPE {
  if (origin.git) {
    return (origin.git.provider || APPLICATION_SOURCE_TYPE.GIT_URL) as unknown as APPLICATION_SOURCE_TYPE;
  }
  if (origin.archive) {
    return APPLICATION_SOURCE_TYPE.ARCHIVE;
  }
  if (origin.container) {
    return APPLICATION_SOURCE_TYPE.CONTAINER_URL;
  }

  return APPLICATION_SOURCE_TYPE.FOLDER;
}

function getGitData(git: any): EPINIO_APP_GIT_SOURCE {
  const url = git.repository || git.url;
  const parsed = parseUrl(url);

  const parts = parsed.path.split('/');

  return {
    usernameOrOrg: parts[1],
    branch:        { name: git.branch },
    commit:        git.revision,
    repo:          { name: parts[2] },
    url,
  };
}

export const AppUtils: Utils = {
  getSourceType,
  getManifestSourceType,
  getGitData,
};
