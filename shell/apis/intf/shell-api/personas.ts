import Persona from '@shell/models/customization.ui.rancher.persona';

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
   * The signed in user's personas, most important first: highest `spec.priority` first (a persona without one is `0`), then by display name
   *
   * Personas assigned by an admin are fetched once, the first time they're asked for. Use `refreshCurrentUsersPersonas` to fetch them again
   */
  currentUsersPersonas(): Promise<Persona[]>;

  /**
   * As `currentUsersPersonas`, fetching the personas assigned by an admin again
   */
  refreshCurrentUsersPersonas(): Promise<Persona[]>;
}
