import { NAME } from '@shell/config/product/settings';

export const PRODUCT_NAME = 'prime';
export const CUSTOM_PAGE_NAME = 'registration';
export const CRD = 'registration';
export const K8S_SCHEMA_NAME = 'registrations.management.cattle.io';
export const K8S_RESOURCE_NAME = 'management.cattle.io.registration';
export const BLANK_CLUSTER = '_';
export const PRODUCT_SETTING_NAME = NAME;
export const SETTING_PAGE_NAME = `c-cluster-${ PRODUCT_SETTING_NAME }-${ CUSTOM_PAGE_NAME }`;

export const REGISTRATION_CRD = {
  apiVersion: 'apiextensions.k8s.io/v1',
  kind:       'CustomResourceDefinition',
  metadata:   { name: K8S_SCHEMA_NAME },
  spec:       {
    group: 'management.cattle.io',
    names: {
      kind:     'Registration',
      listKind: 'RegistrationList',
      plural:   'registrations',
      singular: 'registration',
    },
    scope:    'Namespaced',
    versions: [
      {
        name:    'v1',
        served:  true,
        storage: true,
        schema:  {
          openAPIV3Schema: {
            type:       'object',
            properties: {
              spec: {
                type:       'object',
                properties: {
                  checkNow: {
                    type:        'boolean',
                    description: 'When set to true, the controller will force revalidation with SCC. Upon validation, it will revert to false (and then be omitted).',
                    default:     false,
                  },
                  mode: {
                    type:        'string',
                    description: 'Determines how the request is processed. Can be "online" or "offline".',
                    enum:        ['online', 'offline'],
                  },
                  registrationRequest: {
                    type:        'object',
                    description: 'An object containing the initial registration request.',
                    properties:  {
                      registrationCodeSecretRef: {
                        type:        'string', // SecretReference
                        description: 'A reference to a secret holding the Registration Code.',
                      },
                      serverUrl: {
                        type:        'string',
                        description: 'A field to set a custom RMT server to register with. Some situations, such as Pay-as-you-Go environments, require the use of a different endpoint.',
                      },
                    }
                  },
                  serverCertificateSecretRef: {
                    type:        'string', // SecretReference
                    description: "A reference to a secret holding the RMT server's TLS certificate.",
                  },
                  offlineRegistrationCertificateSecretRef: {
                    type:        'string', // SecretReference
                    description: 'A reference to a secret used when registering Rancher Prime in an air-gap.',
                  },
                },
              },
              status: {
                type:       'object',
                properties: {
                  conditions: {
                    type:        'string',
                    description: "A list of typical Kubernetes conditions to track the resource's state.",
                    items:       {
                      type:       'object',
                      properties: {
                        type:               { type: 'string' },
                        status:             { type: 'string' },
                        reason:             { type: 'string' },
                        message:            { type: 'string' },
                        lastTransitionTime: {
                          type:   'string',
                          format: 'date-time',
                        },
                      },
                    },
                  },
                  registrationProcessedTS: {
                    type:        'string',
                    description: 'A timestamp tracking when the initial SCC system registration (announce) was complete.',
                  },
                  sccSystemId: {
                    type:        'string',
                    description: "The Rancher Manager's SCC system ID.",
                  },
                  activationStatus: {
                    type:        'object',
                    description: 'An object tracking activation-specific status details.',
                    properties:  {
                      valid: {
                        type:        'boolean',
                        description: 'Indicates if the activation is valid and active.',
                      },
                      lastValidatedTS: {
                        type:        'string',
                        description: 'A timestamp tracking the last time Rancher synced with SCC.',
                      },
                      validUntilTS: {
                        type:        'string',
                        description: 'The timestamp of when Rancher must phone home to SCC by.',
                      },
                    },
                  },
                },
                certificate: {
                  type:        'string', // SecretReference
                  description: 'A reference to a secret holding the certificate blob required for SCC validation.',
                },
              },
            },
          },
        },
      },
    ],
  },
};
