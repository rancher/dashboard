
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { isArray } from '@shell/utils/array';
import { isPrerelease } from '@shell/utils/version';
import difference from 'lodash/difference';

export const WINDOWS = 'windows';
export const LINUX = 'linux';

/*
catalog.cattle.io/deplys-on-os: OS -> requires global.cattle.OS.enabled: true
  default: nothing
catalog.cattle.io/permits-os: OS -> will break on clusters containing nodes that are not OS
  default if not found: catalog.cattle.io/permits-os: linux
*/
export function compatibleVersionsFor(chart, os, includePrerelease = true) {
  const versions = chart.versions;

  if (os && !isArray(os)) {
    os = [os];
  }

  return versions.filter(({ annotations, version } = {}) => {
    const osPermitted = (annotations?.[CATALOG_ANNOTATIONS.PERMITTED_OS] || LINUX).split(',');

    if ( !includePrerelease && isPrerelease(version) ) {
      return false;
    }

    if ( !os || difference(os, osPermitted).length === 0) {
      return true;
    }

    return false;
  });
}
