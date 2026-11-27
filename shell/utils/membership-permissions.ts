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

export interface RoleTemplateLockable {
  id?: string;
  locked?: boolean | null;
}

export interface RoleLockProps {
  disabled?: true;
  locked?: true;
  tooltip?: string;
}

export interface PermissionGroupOption {
  value: string;
  disabled?: boolean;
}

/**
 * Returns the option properties needed to disable and badge a locked cluster or project role template.
 */
export function getRoleLockProps(
  roleOrId: RoleTemplateLockable | string | null | undefined,
  roleTemplates: RoleTemplateLockable[],
  lockedTooltip: string
): RoleLockProps {
  const role = typeof roleOrId === 'string' ? roleTemplates.find((r) => r.id === roleOrId) : roleOrId;

  if (role?.locked) {
    return {
      disabled: true,
      locked:   true,
      tooltip:  lockedTooltip,
    };
  }

  return {};
}

/**
 * Resolves a permission group selection to the nearest unlocked option in the direction of movement,
 * or keeps the current value when no unlocked option exists in that direction.
 */
export function resolveUnlockedPermissionGroup(
  nextValue: string,
  currentValue: string,
  options: PermissionGroupOption[]
): string {
  const nextIndex = options.findIndex((opt) => opt.value === nextValue);

  if (nextIndex === -1 || !options[nextIndex].disabled) {
    return nextValue;
  }

  const currentIndex = options.findIndex((opt) => opt.value === currentValue);
  const step = currentIndex !== -1 && nextIndex < currentIndex ? -1 : 1;

  for (let i = nextIndex + step; i >= 0 && i < options.length; i += step) {
    if (!options[i].disabled) {
      return options[i].value;
    }
  }

  return currentValue;
}
