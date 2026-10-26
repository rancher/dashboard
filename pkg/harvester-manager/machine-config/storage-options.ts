import { reactive, toRaw } from 'vue';

export const DISK_CACHE_MODES = ['', 'none', 'writeback', 'writethrough'];
export const DISK_IO_MODES = ['', 'native', 'threads'];

export const PROFILE = {
  DEFAULT: 'default',
  HIGH:    'highPerformance',
  CUSTOM:  'custom',
};

export const IO_THREADS_POLICIES = ['', 'shared', 'auto', 'supplementalPool'];
export const DEFAULT_IO_THREAD_COUNT = '2';
export const UNSET_IO_THREAD_COUNT = '0';

const PERFORMANCE_FIELDS = ['cache', 'io', 'dedicatedIOThread'];

export interface Disk {
  type?: string;
  bus?: string;
  cache?: string;
  io?: string;
  dedicatedIOThread?: boolean;
  [key: string]: unknown;
}

/**
 * Disks set to "Custom" before any option was changed. Keyed by the disk object rather than by position, so the
 * choice follows the disk when volumes are moved or removed.
 */
const customRequested = reactive(new WeakSet<Disk>());

export function requestCustomProfile(disk: Disk, requested: boolean): void {
  if (requested) {
    customRequested.add(toRaw(disk));
  } else {
    customRequested.delete(toRaw(disk));
  }
}

export function hasPerformanceOptions(disk: Disk): boolean {
  return !!(disk.cache || disk.io || disk.dedicatedIOThread);
}

export function detectProfile(disk: Disk): string {
  if (customRequested.has(toRaw(disk))) {
    return PROFILE.CUSTOM;
  }

  if (!hasPerformanceOptions(disk)) {
    return PROFILE.DEFAULT;
  }

  if (disk.cache === 'none' && disk.io === 'native' && disk.dedicatedIOThread) {
    return PROFILE.HIGH;
  }

  return PROFILE.CUSTOM;
}

/**
 * Returns a copy of the disk with the given options applied. Unset options are removed rather than left empty,
 * so a pool that never used them keeps the same diskInfo and is not rolled out again.
 */
export function applyPerformanceOptions(disk: Disk, options: Disk): Disk {
  const out: Disk = { ...disk, ...options };

  // Native AIO needs an uncached (O_DIRECT) disk, and the driver rejects any other combination
  if (out.io === 'native') {
    out.cache = 'none';
  }

  PERFORMANCE_FIELDS.forEach((field) => {
    if (!out[field]) {
      delete out[field];
    }
  });

  return out;
}
