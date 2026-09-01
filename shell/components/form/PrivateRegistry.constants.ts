export const PRIVATE_REGISTRY_CONTEXT = {
  PROVISIONING: 'provisioning',
  IMPORTING:    'importing',
  CHARTS:       'charts',
} as const;

export type PrivateRegistryContext = typeof PRIVATE_REGISTRY_CONTEXT[keyof typeof PRIVATE_REGISTRY_CONTEXT];
