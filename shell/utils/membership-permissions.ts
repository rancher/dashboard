import { Store } from 'vuex';
import { MANAGEMENT, NORMAN } from '@shell/config/types';

// these live in a .ts module, not in the membership .vue components, so that .ts code can import them:
// extension builds type check shell sources against a `*.vue` shim that declares only a default export

export function canViewMembershipEditor(store: Store<any>, needsProject = false): boolean {
  return (!!store.getters['management/schemaFor'](MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING) || !needsProject) &&
    !!store.getters['management/schemaFor'](MANAGEMENT.ROLE_TEMPLATE) &&
    !!store.getters['rancher/schemaFor'](NORMAN.PRINCIPAL);
}

// Can the user VIEW the membership list (read-only)? Unlike `canViewMembershipEditor` (which gates
// add/remove and needs the role-template + principal reads), viewing needs only the binding schema.
export function canViewMembershipEditorList(store: Store<any>, needsProject = false): boolean {
  const bindingType = needsProject ? NORMAN.PROJECT_ROLE_TEMPLATE_BINDING : NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING;

  return !!store.getters['rancher/schemaFor'](bindingType);
}

export function canViewClusterMembershipEditor(store: Store<any>): boolean {
  return canViewMembershipEditor(store);
}
