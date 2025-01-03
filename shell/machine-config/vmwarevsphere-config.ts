export const SENTINEL = '__SENTINEL__';

export const OS_OPTIONS = [
  'linux',
  'windows'
];

export const DEFAULT_VALUES = {
  cpuCount:                '2',
  diskSize:                '20000',
  memorySize:              '4096',
  hostsystem:              '',
  cloudConfig:             '#cloud-config\n\n',
  gracefulShutdownTimeout: '0',
  cfgparam:                ['disk.enableUUID=TRUE'],
  os:                      OS_OPTIONS[0]
};
