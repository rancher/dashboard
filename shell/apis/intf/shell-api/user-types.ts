import UserType from '@shell/models/customization.ui.rancher.usertype';

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
 * User Types API, which finds the user types of the signed in user
 *
 * A user has a user type when either
 * - it's assigned to them by an admin, directly or via one of their groups (a binding to the user type's global role)
 * - it's associated with them via resource permissions (they have the rights in any one of the user type's rules, in the current cluster)
 *
 * and they haven't disabled it.
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
   * own for it if they've set one (`currentUserTypePreferences`), else its `spec.priority` (a user type without one is `0`). User types the
   * user has disabled are left out, unless `includeDisabled` is set
   *
   * User types assigned by an admin are fetched once, the first time they're asked for. Use `refreshCurrentUserTypes` to fetch them again
   */
  currentUserTypes(options?: CurrentUserTypesOptions): Promise<UserType[]>;

  /**
   * As `currentUserTypes`, fetching the user types assigned by an admin again
   */
  refreshCurrentUserTypes(options?: CurrentUserTypesOptions): Promise<UserType[]>;

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
