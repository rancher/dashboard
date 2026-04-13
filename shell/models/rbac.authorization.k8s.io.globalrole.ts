import { K8sModel } from '../../plugins/k8s-type.ts';


export default class GlobalRole extends K8sModel {

  get apiVersion(): string {
    return 'rbac.authorization.k8s.io/v1';
  }

  get apiGroup(): string {
    return 'rbac.authorization.k8s.io';
  }

  get plural(): string {
    return 'globalroles';
  }

  get namespaced(): boolean {
    return false;
  }
}
