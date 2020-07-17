import { DSL } from '@/store/type-map';
import { GATEKEEPER } from '@/config/types';

export const NAME = 'gatekeeper';
export const TEMPLATE_ID = 'cattle-global-data/system-library-rancher-gatekeeper-operator';
export const APP_ID = 'rancher-gatekeeper-operator';
export const CONFIG = `---
replicas: 1
auditInterval: 300
constraintViolationsLimit: 20
auditFromCache: false
image:
  repository: rancher/opa-gatekeeper
  tag: v3.1.0-beta.7
  pullPolicy: IfNotPresent
nodeSelector: {"beta.kubernetes.io/os": "linux"}
tolerations: []
resources:
  limits:
    cpu: 1000m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi
global:
  systemDefaultRegistry: ""
  kubectl:
    repository: rancher/istio-kubectl
    tag: 1.4.6
`;

export function init(store) {
  const {
    product,
    basicType,
    componentForType,
    // ignoreGroup,
    mapGroup,
    mapType,
    virtualType
  } = DSL(store, NAME);

  product({ ifHaveGroup: /^(.*\.)?gatekeeper\.sh$/ });

  mapGroup(/^(.*\.)?gatekeeper\.sh$/, 'OPA Gatekeeper');

  componentForType(/^constraints\.gatekeeper\.sh\..*$/, 'gatekeeper-constraint');
  mapType(/^constraints.gatekeeper.sh.*$/, 'Constraint');

  basicType([
    'getkeeper-overview',
    'gatekeeper-constraint',
    'gatekeeper-template',
  ]);

  virtualType({
    label:      'Overview',
    namespaced: false,
    name:       'gatekeeper-overview',
    route:      { name: 'c-cluster-gatekeeper' },
  });

  virtualType({
    label:      'Constraint',
    namespaced: false,
    name:       'gatekeeper-constraint',
    route:      { name: 'c-cluster-gatekeeper-constraints' },
    ifHaveType: GATEKEEPER.CONSTRAINT_TEMPLATE
  });

  virtualType({
    label:      'Template',
    namespaced: false,
    name:       'gatekeeper-template',
    route:      { name: 'c-cluster-gatekeeper-templates' },
    ifHaveType: GATEKEEPER.CONSTRAINT_TEMPLATE
  });
}
