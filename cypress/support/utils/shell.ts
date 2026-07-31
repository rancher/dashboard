/**
 * Mirror of shell utilities for use in cypress tests
 * This replicates essential exports from shell modules to avoid cypress dependencies on the main shell directory
 */

// From @shell/store/store-types.js
export const STORE = {
  CLUSTER:    'cluster',
  RANCHER:    'rancher',
  MANAGEMENT: 'management',
};

export const BLANK_CLUSTER = '_';

// From @shell/utils/pagination-utils.ts
export const PAGINATION_UTILS = { defaultPageSize: 100000 };

// From @shell/types/fleet.d.ts
export type WorkloadType = 'workload' | 'pods' | 'apps.deployments' | 'replicasets' | 'daemonsets' | 'statefulsets' | 'jobs' | 'cronjobs';

// From @shell/config/types.js
export const DEFAULT_GRAFANA_STORAGE_SIZE = '10Gi';

// From @shell/utils/crypto/index.js
const NORMAL = 'normal';
const URL = 'url';

export function base64Encode(string: string | null | undefined, alphabet = NORMAL): string | null | undefined {
  if (string === null || typeof string === 'undefined') {
    return string;
  }

  const buf = Buffer.from(string);

  if (alphabet === URL) {
    const m: Record<string, string> = {
      '+': '-',
      '/': '_',
    };

    return buf.toString('base64').replace(/[+/]|=+$/g, (char) => m[char] || '');
  }

  return buf.toString('base64');
}

export function base64DecodeToBuffer(string: string | null | undefined): Buffer | string | null | undefined {
  if (string === null || typeof string === 'undefined') {
    return string;
  }

  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function' && Buffer.from !== Uint8Array.from) {
    return Buffer.from(string, 'base64');
  } else {
    return Buffer.from(string, 'base64');
  }
}

export function base64Decode(string: string | null | undefined): string | null | undefined {
  if (string) {
    return base64DecodeToBuffer(string.replace(/[-_]/g, (char) => char === '-' ? '+' : '/'))?.toString();
  }

  return '';
}
