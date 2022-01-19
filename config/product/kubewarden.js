import { DSL } from '@/store/type-map';
import { KUBEWARDEN } from '@/config/types';
import { STATE, NAME as NAME_HEADER } from '@/config/table-headers';
import questions from '@/.questions/questions.json';
// import psp from '@/.questions/allow-privilege-escalation-psp.yml';

export const NAME = 'kubewarden';
export const CHART_NAME = 'rancher-kubewarden';

export function init(store) {
  const {
    product,
    basicType,
    spoofedType,
    weightType,
    headers,
  } = DSL(store, NAME);

  const {
    POLICY_SERVER,
    CLUSTER_ADMISSION_POLICY,
    SPOOFED: {
      POLICY,
      ALLOW_PRIVILEGE_ESCALATION_PSP,
      ALLOWED_FSGROUPS_PSP,
      ALLOWED_PROC_MOUNT_TYPES_PSP,
      APPARMOR_PSP,
      CAPABILITIES_PSP,
      DISALLOW_SERVICE_LOADBALANCER,
      DISALLOW_SERVICE_NODEPORT,
      FLEXVOLUME_DRIVERS_PSP,
      HOST_NAMESPACES_PSP,
      HOSTPATHS_PSP,
      INGRESS,
      POD_PRIVILEGED_POLICY,
      POD_RUNTIME,
      READONLY_ROOT_FILESYSTEM_PSP,
      SAFE_ANNOTATIONS,
      SAFE_LABELS,
      SELINUX_PSP,
      SYSCTL_PSP,
      TRUSTED_REPOS,
      USER_GROUP_PSP,
      VOLUMES_PSP
    }
  } = KUBEWARDEN;

  const subtypes = questions.data.map(subtype => subtype);

  product({
    ifHaveGroup:         /^(.*\.)*kubewarden\.io$/,
    icon:                'kubewarden',
    showNamespaceFilter: true,
  });

  spoofedType({
    label:   'Policy Charts',
    type:    POLICY,
    schemas: [
      {
        id:             ALLOW_PRIVILEGE_ESCALATION_PSP,
        type:           'schema',
        resourceFields: {
          id:         { type: 'string' },
          type:       { type: 'string' },
          apiVersion: { type: 'string' },
          kind:       { type: 'string' },
          metadata:   { type: 'json' },
          spec:       { type: 'json' }
        },
      }
    ],
    getInstances: () => {
      return subtypes
        .flatMap((subtype) => {
          return {
            id:          subtype.id,
            type:        subtype.type,
            apiVersion:  subtype.apiVersion,
            kind:        subtype.kind,
            metadata:    subtype.metadata,
            spec:        subtype.spec,
            subtype
          };
        });
    }
  });

  basicType([
    POLICY_SERVER,
    CLUSTER_ADMISSION_POLICY,
  ]);

  weightType(POLICY_SERVER, 2, true);
  weightType(CLUSTER_ADMISSION_POLICY, 1, true);

  headers(POLICY_SERVER, [
    STATE,
    NAME_HEADER,
    {
      name:          'kubewardenPolicyServers',
      label:         'Image',
      value:         'spec.image',
      formatterOpts: {
        options: { internal: true },
        to:      {
          name:   'c-cluster-product-resource-id',
          params: { resource: POLICY_SERVER }
        }
      },
    },
    {
      name:      'psCreated',
      label:     'Created',
      value:     'metadata.creationTimestamp',
      formatter: 'LiveDate'
    }
  ]);

  headers(CLUSTER_ADMISSION_POLICY, [
    STATE,
    NAME_HEADER,
    {
      name:          'kubewardenClusterAdmissionPolicies',
      label:         'Module',
      value:         'spec.module',
      formatterOpts: {
        options: { internal: true },
        to:      {
          name:   'c-cluster-product-resource-id',
          params: { resource: CLUSTER_ADMISSION_POLICY }
        }
      },
    },
    {
      name:      'capPolicyStatus',
      label:     'Policy Status',
      value:     'status.policyStatus',
    },
    {
      name:      'capCreated',
      label:     'Created',
      value:     'metadata.creationTimestamp',
      formatter: 'LiveDate'
    }
  ]);
}
