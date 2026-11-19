import Persona from '@shell/models/customization.ui.rancher.persona';

/**
 * The user's own priorities for their personas, by persona name
 */
export type PersonaPriorities = Record<string, number>;

/**
 * Personas API, which finds the personas of the signed in user
 *
 * A user has a persona when either
 * - it's assigned to them by an admin, directly or via one of their groups (a binding to the persona's global role)
 * - it's associated with them via resource permissions (they have the rights in any one of the persona's rules, in the current cluster)
 *
 * Usage example:
 * ```ts
 * import { useShell } from '@shell/apis';
 *
 * const shell = useShell();
 * const personas = await shell.personas.currentUsersPersonas();
 * console.log('Most important persona:', personas[0]?.spec.displayName);
 * ```
 */
export interface PersonasApi {
  /**
   * The signed in user's personas, most important first: highest priority first, then by display name. A persona's priority is the user's
   * own for it if they've set one (`currentUsersPersonaPriorities`), else its `spec.priority` (a persona without one is `0`)
   *
   * Personas assigned by an admin are fetched once, the first time they're asked for. Use `refreshCurrentUsersPersonas` to fetch them again
   */
  currentUsersPersonas(): Promise<Persona[]>;

  /**
   * As `currentUsersPersonas`, fetching the personas assigned by an admin again
   */
  refreshCurrentUsersPersonas(): Promise<Persona[]>;

  /**
   * The signed in user's own priorities for their personas, by persona name, stored as a user preference
   */
  currentUsersPersonaPriorities(): PersonaPriorities;

  /**
   * Save the signed in user's own persona priorities, replacing them. `{}` goes back to the personas' own priorities
   */
  setCurrentUsersPersonaPriorities(priorities: PersonaPriorities): Promise<void>;

  /**
   * Save the order the signed in user wants their personas in (persona names, most important first), as their own priorities.
   *
   * The listed personas' current priorities are handed out again in the new order, so they stay on the same scale as the personas' own and
   * a persona the user hasn't placed still lands where its priority puts it
   */
  reorderCurrentUsersPersonas(order: string[]): Promise<void>;
}
