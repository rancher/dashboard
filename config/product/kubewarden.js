import { DSL } from '@/store/type-map';
import { KUBEWARDEN } from '@/config/types';
import { STATE, NAME as NAME_HEADER } from '@/config/table-headers';

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
    SPOOFED
  } = KUBEWARDEN;

  product({
    ifHaveGroup:         /^(.*\.)*kubewarden\.io$/,
    icon:                'kubewarden',
    showNamespaceFilter: true,
  });

  basicType([
    POLICY_SERVER,
    CLUSTER_ADMISSION_POLICY,
  ]);

  spoofedType({
    label:   'Policies',
    type:    SPOOFED.POLICIES,
    schemas: [
      {
        id:              SPOOFED.POLICIES,
        type:            'schema',
        resourcesFields: { policies: { type: `array[${ SPOOFED.POLICY }]` } }
      },
      {
        id:             SPOOFED.POLICY,
        type:           'schema',
        resourceFields: {
          allow_privilege_escalation_psp: { type: SPOOFED.ALLOW_PRIVILEGE_ESCALATION_PSP },
          allowed_fsgroups_psp:           { type: SPOOFED.ALLOWED_FSGROUPS_PSP },
          allowed_proc_mount_types_psp:   { type: SPOOFED.ALLOWED_PROC_MOUNT_TYPES_PSP },
          apparmor_psp:                   { type: SPOOFED.APPARMOR_PSP },
          capabilities_psp:               { type: SPOOFED.CAPABILITIES_PSP },
          disallow_service_loadbalancer:  { type: SPOOFED.DISALLOW_SERVICE_LOADBALANCER },
          disallow_service_nodeport:      { type: SPOOFED.DISALLOW_SERVICE_NODEPORT },
          flexvolume_drivers_psp:         { type: SPOOFED.FLEXVOLUME_DRIVERS_PSP },
          host_namespaces_psp:            { type: SPOOFED.HOST_NAMESPACES_PSP },
          hostpaths_psp:                  { type: SPOOFED.HOSTPATHS_PSP },
          ingress:                        { type: SPOOFED.INGRESS },
          pod_privileged_policy:          { type: SPOOFED.POD_PRIVILEGED_POLICY },
          pod_runtime:                    { type: SPOOFED.POD_RUNTIME },
          readonly_root_filesystem_psp:   { type: SPOOFED.READONLY_ROOT_FILESYSTEM_PSP },
          safe_annotations:               { type: SPOOFED.SAFE_ANNOTATIONS },
          safe_labels:                    { type: SPOOFED.SAFE_LABELS },
          selinux_psp:                    { type: SPOOFED.SELINUX_PSP },
          sysctl_psp:                     { type: SPOOFED.SYSCTL_PSP },
          trusted_repos:                  { type: SPOOFED.TRUSTED_REPOS },
          user_group_psp:                 { type: SPOOFED.USER_GROUP_PSP },
          volumes_psp:                    { type: SPOOFED.VOLUMES_PSP },
        }
      },
      {
        id:             SPOOFED.HOSTPATHS_PSP, // This is just recreating what I need to get from helm for policy charts
        type:           'schema',
        group:          'kubewarden',
        resourceFields: { questions: { allowedHostPaths: { type: 'array[string]' } } }
      }
    ]
  });

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
