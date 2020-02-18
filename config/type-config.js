// addBasicType(type);

// setGroupWeight(group, weight); -- higher groups are shown first
// addGroupMapping(match, replace, priority = 1, continueOnMatch = false)

// setTypeWeight(type, weight); -- higher groups are shown first
// addTypeMapping(match, replace, priority = 1, continueOnMatch = false)

import { addBasicType, setGroupWeight, addGroupMapping, addTypeMapping } from '@/config/nav-cluster';
import { ucFirst } from '@/utils/string';

import {
  CONFIG_MAP, NAMESPACE, NODE, POD, SECRET
} from '@/config/types';

export default function() {
  addBasicType([
    CONFIG_MAP,
    NAMESPACE,
    NODE,
    POD,
    SECRET
  ]);

  const CORE = 'Core';
  const API = 'API';
  const APPS = 'Apps';
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
  setGroupWeight(APPS, 98);

  addGroupMapping(/^(core)?$/, CORE, 99);
  addGroupMapping(/^api.*\.k8s\.io$/, API);
  addGroupMapping('rbac.authorization.k8s.io', RBAC);
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

  addGroupMapping(/^(.*)\.k8s.io$/, (type, rule, match) => {
    return match[1].split(/\./).map(x => ucFirst(x)).join('.');
  }, 1);

  addTypeMapping('', (typeStr, rule, match, typeObj) => {
    if ( typeObj && typeObj.label ) {
      return typeObj.label;
    }

    return typeStr;
  }, 1);
}
