import { RancherKubeMetadata } from '@shell/types/rancher/steve.api';
import { PolicyRule } from '@shell/types/resources/rbac';

/**
 * What a user type holds (its `spec`)
 */
export interface UserTypeSpec {
  displayName: string;
  /**
   * How important the user type is, when only one can apply: higher is more important
   */
  priority: number;
  tags?: string[];
  /**
   * Resource permissions: a user with the rights in any one of these rules is associated with the user type
   */
  rules?: PolicyRule[];
}

/**
 * A user type (`customization.ui.rancher.usertype`), as the User Types API returns it
 */
export interface UserTypeResource {
  id: string;
  type: string;
  metadata: RancherKubeMetadata;
  spec: UserTypeSpec;
}

/**
 * The user's own preference for one of their user types
 */
export interface UserTypePreference {
  /**
   * The user's own priority for it, over the user type's `spec.priority`
   */
  priority?: number;
  /**
   * The user has turned it off: it isn't one of their user types
   */
  disabled?: boolean;
}

/**
 * The user's own preferences for their user types, by user type name
 */
export type UserTypePreferences = Record<string, UserTypePreference>;

export interface CurrentUserTypesOptions {
  /**
   * Include the user types the user has disabled, in their place in the order
   */
  includeDisabled?: boolean;
}

/**
 * User Types API, responsible for the signed in user's user types: which they have, in what order, and which they've turned off
 *
 * A user has a user type when either
 * - it's assigned to them by an admin, directly or via one of their groups (a binding to the user type's global role). Only that
 *   explicit assignment counts: an admin's wildcard rules don't give them every user type
 * - it's associated with them via resource permissions: they have the rights in any one of the user type's rules, checked against
 *   the schemas of the cluster they're in, so the result can change from one cluster to the next
 *
 * and they haven't turned it off (see `setCurrentUserTypeEnabled`).
 *
 * The user must be able to list user types. When they can't, they have none.
 *
 * Usage example:
 * ```ts
 * import { useShell } from '@shell/apis';
 *
 * const shell = useShell();
 * const userTypes = await shell.userTypes.currentUserTypes();
 * console.log('Most important user type:', userTypes[0]?.spec.displayName);
 * ```
 */
export interface UserTypesApi {
  /**
   * The signed in user's user types, most important first: highest priority first, then by display name. A user type's priority is the user's
   * own for it if they've set one (`currentUserTypePreferences`), else its `spec.priority`. User types the user has disabled are left out,
   * unless `includeDisabled` is set
   *
   * User types assigned by an admin are fetched once, the first time they're asked for. Use `refreshCurrentUserTypes` to fetch them again.
   * User types associated via resource permissions are checked on every call
   */
  currentUserTypes(options?: CurrentUserTypesOptions): Promise<UserTypeResource[]>;

  /**
   * As `currentUserTypes`, fetching the user types assigned by an admin again
   */
  refreshCurrentUserTypes(options?: CurrentUserTypesOptions): Promise<UserTypeResource[]>;

  /**
   * The signed in user's own preferences for their user types (priority, disabled), by user type name, stored as a user preference
   */
  currentUserTypePreferences(): UserTypePreferences;

  /**
   * Save the signed in user's own user type preferences, replacing them. `{}` goes back to the user types' own priorities, all enabled
   */
  setCurrentUserTypePreferences(preferences: UserTypePreferences): Promise<void>;

  /**
   * Save the order the signed in user wants their user types in (user type names, most important first), as their own priorities.
   *
   * The listed user types' current priorities are handed out again in the new order, so they stay on the same scale as the user types' own and
   * a user type the user hasn't placed still lands where its priority puts it
   */
  reorderCurrentUserTypes(order: string[]): Promise<void>;

  /**
   * Turn one of the signed in user's user types on or off. A disabled user type isn't one of their user types
   */
  setCurrentUserTypeEnabled(name: string, enabled: boolean): Promise<void>;
}
