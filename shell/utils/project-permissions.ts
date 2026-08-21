import { MANAGEMENT } from '@shell/config/types';

const PROJECT_RTB = MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING;

export interface ProjectMembershipPermission {
  /** current user may create project role template bindings in this project */
  create: boolean;
  /** current user may delete project role template bindings in this project */
  remove: boolean;
}

/**
 * Determine, per project, whether the current user can manage its members.
 *
 * Uses steve's `?checkPermissions=` query parameter (rancher/steve#594, built
 * for rancher#48788 / SURE-8995): the API returns a `resourcePermissions` map on
 * each project listing the verbs the user is granted on the given resource *in
 * that project's namespace*. This is the per-project answer that the global
 * schema `collectionMethods` can't give, delivered on the project data itself -
 * one request for all projects, no per-project fan-out.
 *
 * @param store     Vuex store
 * @param projectId optional single mgmt project id (e.g. `local/p-abc`); when
 *                  omitted, all projects are fetched
 * @returns map of mgmt project id -> { create, remove }
 */
export async function fetchProjectMembershipPermissions(
  store: any,
  projectId: string | null = null
): Promise<Record<string, ProjectMembershipPermission>> {
  const schema = store.getters['management/schemaFor'](MANAGEMENT.PROJECT);
  const collection = schema?.links?.collection;

  if (!collection) {
    return {};
  }

  const url = projectId ? `${ collection }/${ projectId.replace(':', '/') }?checkPermissions=${ PROJECT_RTB }` : `${ collection }?checkPermissions=${ PROJECT_RTB }`;

  let res;

  try {
    res = await store.dispatch('management/request', { url });
  } catch (e) {
    // Fail closed: without a definitive answer, don't offer member actions.
    // The server still enforces access regardless of what the UI shows.
    return {};
  }

  const projects = Array.isArray(res?.data) ? res.data : (res?.id ? [res] : []);

  return projects.reduce((acc: Record<string, ProjectMembershipPermission>, project: any) => {
    const perms = project.resourcePermissions?.[PROJECT_RTB] || {};

    acc[project.id] = { create: !!perms.create, remove: !!perms.delete };

    return acc;
  }, {});
}
