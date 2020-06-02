export const TEMPLATE_ID = 'cattle-global-data/system-library-rancher-rio-operator';
export const APP_ID = 'rancher-rio';
export const CONFIG = `---
replicas: 1
auditInterval: 300
constraintViolationsLimit: 20
auditFromCache: false
image:
  repository: rancher/rio
  tag: v0.7.1
  pullPolicy: IfNotPresent
nodeSelector: {"beta.kubernetes.io/os": "linux"}
tolerations: []
resources:
  requests:
    cpu: 1
    memory: 2048Mi
global:
  systemDefaultRegistry: ""
  kubectl:
    repository: rancher/istio-kubectl
    tag: 1.4.6
`;
