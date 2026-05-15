export const VOLUME_TYPES = [
  'gp3',
  'gp2',
  'io2',
  'io1',
  'st1',
  'sc1',
  'standard',
] as const;

export type VolumeType = typeof VOLUME_TYPES[number];

export const VOLUME_TYPE_OPTIONS: { label: string; value: VolumeType }[] = VOLUME_TYPES.map((t) => ({
  label: t,
  value: t,
}));

export const HTTP_TOKENS_VALUES = {
  REQUIRED: 'required',
  OPTIONAL: 'optional',
} as const;
