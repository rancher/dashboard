import { PaginationParamProjectOrNamespace } from '@shell/types/store/pagination.types';

interface FleetListPaginationContext {
  $store: any;
  canPaginate: boolean;
  requestFilters: { projectsOrNamespaces: PaginationParamProjectOrNamespace[] };
}

/**
 * Companion mixin for Fleet list pages that use server-side pagination.
 *
 * Fleet uses a workspace switcher rather than the standard namespace filter. The selected
 * workspace (which maps 1:1 to a namespace) lives in the root `workspace` getter rather than in
 * `namespaceFilters`, so the `resource-fetch` pagination mixin's namespace handling doesn't pick
 * it up. This translates the selected workspace into a server-side `projectsornamespaces` filter
 * on the paginated request, and re-issues the request when the workspace changes.
 *
 * Use alongside the `resource-fetch` mixin (which provides `requestFilters` and `canPaginate`).
 */
export default {
  computed: {
    fleetWorkspace(this: FleetListPaginationContext): string | undefined {
      return this.$store.getters.workspace;
    },
  },

  watch: {
    fleetWorkspace: {
      immediate: true,
      handler(this: FleetListPaginationContext, workspace: string | null): void {
        if (!this.canPaginate) {
          return;
        }

        this.requestFilters.projectsOrNamespaces = workspace ? [new PaginationParamProjectOrNamespace({ projectOrNamespace: [workspace] })] : [];
      }
    },
  },
};
