import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

export const createPayloadData = {
  id:            'e2e-pod-security-admission-1705617529465',
  type:          'management.cattle.io.podsecurityadmissionconfigurationtemplate',
  apiVersion:    'management.cattle.io/v3',
  configuration: {
    defaults: {
      audit: 'baseline', 'audit-version': 'latest', enforce: 'privileged', 'enforce-version': 'latest', warn: 'restricted', 'warn-version': 'latest'
    },
    exemptions: {
      usernames: ['admin', 'user'], runtimeClasses: ['myclass1', 'myclass2'], namespaces: ['ingress-nginx', 'kube-system']
    }
  },
  kind:     'PodSecurityAdmissionConfigurationTemplate',
  metadata: {
    fields: ['e2e-pod-security-admission-1705617529465', '18s'], name: 'e2e-pod-security-admission-1705617529465', resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION
  },
  description: 'e2e-pod-security-admission-1705617529465-description'
};

export const updatePayloadData = {
  id:            'e2e-pod-security-admission-1705628550961',
  type:          'management.cattle.io.podsecurityadmissionconfigurationtemplate',
  apiVersion:    'management.cattle.io/v3',
  configuration: {
    defaults: {
      audit: 'baseline', 'audit-version': 'v1.25', enforce: 'privileged', 'enforce-version': 'v1.25', warn: 'restricted', 'warn-version': 'v1.25'
    },
    exemptions: {
      usernames: ['admin1', 'user1'], runtimeClasses: ['myclass3', 'myclass4'], namespaces: ['cattle-system', 'cattle-epinio-system']
    }
  },
  kind:     'PodSecurityAdmissionConfigurationTemplate',
  metadata: {
    fields: ['e2e-pod-security-admission-1705628550961', '7s'], name: 'e2e-pod-security-admission-1705628550961', resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION
  },
  description: 'e2e-pod-security-admission-1705628550961-description-edit'
};
