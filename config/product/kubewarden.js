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
    configureType,
    headers
  } = DSL(store, NAME);

  product({
    ifHaveGroup: /^(.*\.)*kubewarden\.io$/,
    icon:        'kubewarden',
  });

  weightType(KUBEWARDEN.POLICY_SERVER, 2, true);
  weightType(KUBEWARDEN.CLUSTER_ADMISSION_POLICY, 1, true);

  basicType([
    'policies.kubewarden.io.policyserver',
    'policies.kubewarden.io.clusteradmissionpolicy'
  ]);

  configureType(KUBEWARDEN.POLICY_SERVER, { canYaml: false, showAge: false });

  headers(KUBEWARDEN.POLICY_SERVER, [
    STATE,
    NAME_HEADER,
    {
      name:          'kubewardenPolicyServers',
      label:         'Policy Servers',
      value:         'spec',
      formatter:     'Link',
      formatterOpts: {
        options: { internal: true },
        to:      {
          name:   'c-cluster-product-resource-id',
          params: { resource: KUBEWARDEN.POLICY_SERVER }
        }
      },
    }
  ]);

  headers(KUBEWARDEN.CLUSTER_ADMISSION_POLICY, [
    STATE,
    NAME_HEADER,
    {
      name:          'kubewardenClusterAdmissionPolicies',
      label:         'Cluster Admission Policies',
      value:         'spec',
      formatter:     'Link',
      formatterOpts: {
        options: { internal: true },
        to:      {
          name:   'c-cluster-product-resource-id',
          params: { resource: KUBEWARDEN.CLUSTER_ADMISSION_POLICY }
        }
      },
    }
  ]);
}
