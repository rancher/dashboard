// addBasicType(type);

// setGroupWeight(group, weight); -- higher groups are shown first
// addGroupMapping(match, replace, priority = 1, continueOnMatch = false)

// setEntryWeight(type, weight); -- higher groups are shown first
// addEntryMapping(match, replace, priority = 1, continueOnMatch = false)

import { addBasicType, setGroupWeight, addGroupMapping } from '@/config/nav-cluster';
import { ucFirst } from '@/utils/string';

import {
  CONFIG_MAP, NAMESPACE, NODE, POD, SECRET
} from '@/config/types';

addBasicType(
  CONFIG_MAP,
  NAMESPACE,
  NODE,
  POD,
  SECRET
);

const CORE = 'Core';
const API = 'API';
const CERT_MANAGER = 'Cert Manager';
const GLOO = 'Gloo';
const ISTIO = 'Istio';
const KNATIVE = 'Knative';
const TEKTON = 'Tekton';
const RIO = 'Rio';
const RBAC = 'RBAC';
const LONGHORN = 'Longhorn';
const RANCHER = 'Rancher';
const ADMISSION = 'Admission';

setGroupWeight(CORE, 99);

addGroupMapping(/^(core)?$/, CORE, 99);
addGroupMapping(/^api.*\.k8s\.io$/, API);
addGroupMapping('rbac.authorizations.k8s.io', RBAC);
addGroupMapping('admissionregistration.k8s.io', ADMISSION);
addGroupMapping(/^(.+\.)?cert-manager.io$/, CERT_MANAGER);
addGroupMapping('certmanager.k8s.io', CERT_MANAGER);
addGroupMapping(/^gateway.solo.io(.v\d+)?$/, GLOO);
addGroupMapping('gloo.solo.io', GLOO);
addGroupMapping(/^(.*\.)?tekton.dev$/, TEKTON);
addGroupMapping(/^(.*\.)?rio.cattle.io$/, RIO);
addGroupMapping(/^(.*\.)?longhorn.rancher.io$/, LONGHORN);
addGroupMapping(/^(.*\.)?cattle.io$/, RANCHER);
addGroupMapping(/^(.*\.)?istio.io$/, ISTIO);
addGroupMapping(/^(.*\.)?knative.io$/, KNATIVE);
addGroupMapping(/^(.*)\.k8s.io$/, (type, match) => {
  return match[1].split(/\./).map(x => ucFirst(x)).join('.');
}, 1);
