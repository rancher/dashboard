import { DSL } from '@/store/type-map';
import { KUBEWARDEN } from '@/config/types';
import { STATE, NAME as NAME_HEADER } from '@/config/table-headers';

export const NAME = 'kubewarden';
export const CHART_NAME = 'rancher-kubewarden';

export function init(store) {
  const {
    product,
    basicType,
    weightType,
    headers
  } = DSL(store, NAME);

  product({
    ifHaveGroup:         /^(.*\.)*kubewarden\.io$/,
    icon:                'kubewarden',
    showNamespaceFilter: true,
  });

  weightType(KUBEWARDEN.POLICY_SERVER, 2, true);
  weightType(KUBEWARDEN.CLUSTER_ADMISSION_POLICY, 1, true);

  basicType([
    'policies.kubewarden.io.policyserver',
    'policies.kubewarden.io.clusteradmissionpolicy'
  ]);

  headers(KUBEWARDEN.POLICY_SERVER, [
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
          params: { resource: KUBEWARDEN.POLICY_SERVER }
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

  headers(KUBEWARDEN.CLUSTER_ADMISSION_POLICY, [
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
          params: { resource: KUBEWARDEN.CLUSTER_ADMISSION_POLICY }
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
