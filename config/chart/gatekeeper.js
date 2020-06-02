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
