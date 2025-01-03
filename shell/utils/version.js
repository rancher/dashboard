import { sortableNumericSuffix } from '@shell/utils/sort';
import semver from 'semver';
import { MANAGEMENT } from '@shell/config/types';
import { READ_WHATS_NEW, SEEN_WHATS_NEW } from '@shell/store/prefs';
import { SETTING } from '@shell/config/settings';

export function parse(str) {
  str = `${ str }`;

  // Trim off leading 'v'
  if ( str.substr(0, 1).toLowerCase() === 'v' ) {
    str = str.substr(1);
  }

  const parts = str.split(/[.+-]/);

  return parts;
}

export function sortable(str) {
  return parse(str).map((x) => sortableNumericSuffix(x)).join('.');
}

export function compare(in1, in2) {
  if ( !in1 ) {
    return 1;
  }

  if ( !in2 ) {
    return -1;
  }

  const p1 = parse(in1);
  const p2 = parse(in2);

  const minLen = Math.min(p1.length, p2.length);

  for ( let i = 0 ; i < minLen ; i++ ) {
    const res = comparePart(p1[i], p2[i]);

    if ( res !== 0 ) {
      return res;
    }
  }

  return p1.length - p2.length;
}

function isNumeric(str) {
  return (`${ str }`).match(/^([0-9]+\.)?[0-9]*$/);
}

function comparePart(in1, in2) {
  in1 = (`${ in1 }`).toLowerCase();
  in2 = (`${ in2 }`).toLowerCase();

  if ( isNumeric(in1) && isNumeric(in2) ) {
    const num1 = parseInt(in1, 10);
    const num2 = parseInt(in2, 10);

    if ( !isNaN(num1) && !isNaN(num2) ) {
      return num1 - num2;
    }
  }

  return in1.localeCompare(in2);
}

export function isPrerelease(version = '') {
  if (!semver.valid(version)) {
    version = semver.clean(version, { loose: true });
  }

  return !!semver.prerelease(version);
}

export function isDevBuild(version) {
  if ( ['dev', 'master', 'head'].includes(version) || version.endsWith('-head') || version.match(/-rc\d+$/) || version.match(/-alpha\d+$/) ) {
    return true;
  }

  return false;
}

export function getVersionInfo(store) {
  const setting = store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.VERSION_RANCHER);
  const fullVersion = setting?.value || 'unknown';
  let displayVersion = fullVersion;

  const match = fullVersion.match(/^(.*)-([0-9a-f]{40})-(.*)$/);

  if ( match ) {
    displayVersion = match[2].substr(0, 7);
  }

  return {
    displayVersion,
    fullVersion
  };
}

export function seenReleaseNotes(store) {
  const lastSeenNew = store.getters['prefs/get'](SEEN_WHATS_NEW) ;
  const fullVersion = getVersionInfo(store).fullVersion;

  return compare(lastSeenNew, fullVersion) >= 0 && !!lastSeenNew;
}

// Mark that the user has seen the release notes for this version if not already done
export async function markSeenReleaseNotes(store) {
  if (!seenReleaseNotes(store)) {
    await store.dispatch('prefs/set', { key: SEEN_WHATS_NEW, value: getVersionInfo(store).fullVersion });
  }
}

export function readReleaseNotes(store) {
  const lastSeenNew = store.getters['prefs/get'](READ_WHATS_NEW) ;
  const fullVersion = getVersionInfo(store).fullVersion;

  return compare(lastSeenNew, fullVersion) >= 0 && !!lastSeenNew;
}

// Mark that the user has read the release notes for this version if not already done
export async function markReadReleaseNotes(store) {
  if (!readReleaseNotes(store)) {
    await store.dispatch('prefs/set', { key: READ_WHATS_NEW, value: getVersionInfo(store).fullVersion });
  }
}
