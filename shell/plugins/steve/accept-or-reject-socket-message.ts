import pAndNFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';

type TypeIsCached = { [type: string]: boolean }

/**
 * There are scenarios where we can't subscribe to subsets of a resource type
 * - Multiple namespaces or projects
 * - Result of Pagination (a single page of resources that have been sorted / filtered)
 *
 * For those scenarios we subscribe to allll changes BUT ignore changes that are not applicable to that subset
 */
class AcceptOrRejectSocketMessage {
  typeIsNamespaced({ getters }: any, type: string): boolean {
    return getters.haveNamespace(type)?.length > 0;
  }

  typeIsPaginated({ getters }: any, type: string): boolean {
    return !!getters.havePage(type);
  }

  filteredNamespaces({ rootGetters }: any) {
    // Note - activeNamespaceCache should be accurate for both namespace/project filtering and pagination namespace/project filtering
    return rootGetters.activeNamespaceCache;
  }

  /**
   * Note - namespace can be a list of projects or namespaces
   */
  subscribeNamespace(namespace: string[]) {
    if (pAndNFiltering.isApplicable({ namespaced: namespace, type: 'n/a' }) && namespace.length) {
      return undefined; // AKA sub to everything
    }

    return namespace;
  }

  validChange({ getters, rootGetters }: any, type: string, data: any) {
    // If the resource is in namespace outside of the one's we have selected in the header... ignore the change
    if (this.typeIsNamespaced({ getters }, type)) {
      const namespaces = this.filteredNamespaces({ rootGetters });

      if (!namespaces[data.metadata.namespace]) {
        return false;
      }
    }

    // If the resource does not meet the previously fetched paginated resource... ignore the change
    if (this.typeIsPaginated({ getters }, type)) {
      const page = getters['all'](type);

      return !!page.find((pR: any) => pR.id === data.id);
    }

    return true;
  }

  validateBatchChange({ getters, rootGetters }: any, batch: { [key: string]: any}) {
    const namespaces = this.filteredNamespaces({ rootGetters });

    const typeIs: { namespaced: TypeIsCached, paginated: TypeIsCached} = {
      namespaced: {},
      paginated:  {},
    };

    Object.entries(batch).forEach(([type, entries]) => {
      if (typeIs.namespaced[type] === undefined) {
        typeIs.namespaced[type] = this.typeIsNamespaced({ getters }, type);
      }
      if (typeIs.namespaced[type]) {
        const schema = getters.schemaFor(type);

        if (!schema?.attributes?.namespaced) {
          return;
        }

        Object.keys(entries).forEach((id) => {
          const namespace = id.split('/')[0];

          if (!namespace || !namespaces[namespace]) {
            delete entries[id];
          }
        });
      }

      if (typeIs.paginated[type] === undefined) {
        typeIs.paginated[type] = this.typeIsPaginated({ getters }, type);
      }
      if (typeIs.paginated[type]) {
        const page = getters['all'](type);

        Object.keys(entries).forEach((id) => {
          if (!page.find((pR: any) => pR.id === id)) {
            delete entries[id];
          }
        });
      }
    });

    return batch;
  }
}

export default new AcceptOrRejectSocketMessage();
