import {
  ignoreType,
  basicType,
  weightGroup,
  mapGroup,
  mapType
} from '@/config/nav-cluster';

import { ucFirst } from '@/utils/string';

import {
  CONFIG_MAP, NAMESPACE, NODE, POD, SECRET
} from '@/config/types';

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

export default function() {
  basicType([
    CONFIG_MAP,
    NAMESPACE,
    NODE,
    POD,
    SECRET
  ]);

  ignoreType('events.k8s.io.v1beta1.event'); // Events type moved into core

  mapType('', (typeStr, rule, match, typeObj) => {
    if ( typeObj && typeObj.label ) {
      return typeObj.label;
    }

    return typeStr;
  }, 1);

  weightGroup(CORE, 99);
  weightGroup(APPS, 98);

  mapGroup(/^(core)?$/, CORE, 99);
  mapGroup(/^api.*\.k8s\.io$/, API);
  mapGroup('rbac.authorization.k8s.io', RBAC);
  mapGroup('admissionregistration.k8s.io', ADMISSION);
  mapGroup(/^(.+\.)?cert-manager.io$/, CERT_MANAGER);
  mapGroup('certmanager.k8s.io', CERT_MANAGER);
  mapGroup(/^gateway.solo.io(.v\d+)?$/, GLOO);
  mapGroup('gloo.solo.io', GLOO);
  mapGroup(/^(.*\.)?tekton.dev$/, TEKTON);
  mapGroup(/^(.*\.)?rio.cattle.io$/, RIO);
  mapGroup(/^(.*\.)?longhorn.rancher.io$/, LONGHORN);
  mapGroup(/^(.*\.)?cattle.io$/, RANCHER);
  mapGroup(/^(.*\.)?istio.io$/, ISTIO);
  mapGroup(/^(.*\.)?knative.io$/, KNATIVE);

  mapGroup(/^(.*)\.k8s.io$/, (type, rule, match) => {
    return match[1].split(/\./).map(x => ucFirst(x)).join('.');
  }, 1);
}
