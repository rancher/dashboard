import { STATE, NAME as NAME_HEADER } from '@shell/config/table-headers';
import { KUBEWARDEN, KUBEWARDEN_PRODUCT_GROUP } from '../types';
import { createKubewardenRoute } from '../utils/custom-routing';

export const CHART_NAME = 'rancher-kubewarden';

export const ADMISSION_POLICY_STATE = {
  name:      'policyStatus',
  sort:      ['stateSort', 'nameSort'],
  value:     'status.policyStatus',
  label:     'Status',
  width:     100,
  formatter: 'PolicyStatus',
};

export const RELATED_POLICY_SUMMARY = {
  name:      'summary',
  label:     'Policies',
  value:     'allRelatedPolicies.length',
  sort:      false,
  search:    false,
  formatter: 'PolicySummaryGraph',
  align:     'center',
};

export function init($plugin, store) {
  const {
    product,
    basicType,
    configureType,
    spoofedType,
    weightType,
    headers,
  } = $plugin.DSL(store, $plugin.name);

  const {
    POLICY_SERVER,
    ADMISSION_POLICY,
    CLUSTER_ADMISSION_POLICY,
    SPOOFED
  } = KUBEWARDEN;

  product({
    ifHaveGroup:         KUBEWARDEN_PRODUCT_GROUP,
    inStore:             'cluster',
    icon:                'kubewarden',
    removeable:          false,
    showNamespaceFilter: true,
  });

  configureType(POLICY_SERVER, {
    isCreatable:    true,
    isEditable:     true,
    isRemovable:    true,
    showConfigView: true,
    showState:      false,
    canYaml:        true,
    customRoute:    createKubewardenRoute('c-cluster-resource', { resource: POLICY_SERVER }),
    resourceEdit:   POLICY_SERVER,
  });

  configureType(ADMISSION_POLICY, {
    isCreatable:    true,
    isEditable:     true,
    isRemovable:    true,
    showConfigView: true,
    showState:      false,
    canYaml:        true,
    customRoute:    createKubewardenRoute('c-cluster-resource', { resource: ADMISSION_POLICY }),
    resourceEdit:   ADMISSION_POLICY,
  });

  configureType(CLUSTER_ADMISSION_POLICY, {
    isCreatable:    true,
    isEditable:     true,
    isRemovable:    true,
    showConfigView: true,
    showState:      false,
    canYaml:        true,
    customRoute:    createKubewardenRoute('c-cluster-resource', { resource: CLUSTER_ADMISSION_POLICY }),
    resourceEdit:   CLUSTER_ADMISSION_POLICY,
  });

  // These are policies from the Policy Hub
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
          seccomp_psp:                    { type: SPOOFED.SECCOMP_PSP },
          selinux_psp:                    { type: SPOOFED.SELINUX_PSP },
          sysctl_psp:                     { type: SPOOFED.SYSCTL_PSP },
          trusted_repos:                  { type: SPOOFED.TRUSTED_REPOS },
          user_group_psp:                 { type: SPOOFED.USER_GROUP_PSP },
          verify_image_signatures:        { type: SPOOFED.VERIFY_IMAGE_SIGNATURES },
          volumes_psp:                    { type: SPOOFED.VOLUMES_PSP },
        }
      }
    ]
  });

  basicType([
    POLICY_SERVER,
    ADMISSION_POLICY,
    CLUSTER_ADMISSION_POLICY
  ]);

  weightType(POLICY_SERVER, 99, true);
  weightType(CLUSTER_ADMISSION_POLICY, 98, true);
  weightType(ADMISSION_POLICY, 97, true);

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
    RELATED_POLICY_SUMMARY,
    {
      name:      'psAge',
      label:     'Age',
      value:     'metadata.creationTimestamp',
      formatter: 'LiveDate'
    }
  ]);

  headers(ADMISSION_POLICY, [
    ADMISSION_POLICY_STATE,
    NAME_HEADER,
    {
      name:  'capPolicyServer',
      label: 'Policy Server',
      value: 'spec.policyServer'
    },
    {
      name:  'mode',
      label: 'Mode',
      value: 'spec.mode'
    },
    {
      name:          'kubewardenAdmissionPolicies',
      label:         'Module',
      value:         'spec.module',
      formatterOpts: {
        options: { internal: true },
        to:      {
          name:   'c-cluster-product-resource-id',
          params: { resource: ADMISSION_POLICY }
        }
      },
    },
    {
      name:      'capCreated',
      label:     'Created',
      value:     'metadata.creationTimestamp',
      formatter: 'LiveDate'
    }
  ]);

  headers(CLUSTER_ADMISSION_POLICY, [
    ADMISSION_POLICY_STATE,
    NAME_HEADER,
    {
      name:  'capPolicyServer',
      label: 'Policy Server',
      value: 'spec.policyServer'
    },
    {
      name:  'mode',
      label: 'Mode',
      value: 'spec.mode'
    },
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
      name:      'capCreated',
      label:     'Created',
      value:     'metadata.creationTimestamp',
      formatter: 'LiveDate'
    }
  ]);
}
