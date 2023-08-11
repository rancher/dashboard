import pAndNFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';

/**
 * Sockets will not be able to subscribe to more than one namespace. If this is requested we pretend to handle it
 * - Changes to all resources are monitored (no namespace provided in sub)
 * - We ignore any events not from a required namespace (we have the conversion of project --> namespaces already)
 */
class SubscribeNamespaceHandler {
  typeIsNamespaced({ getters }: any, type: string): boolean {
    return getters.haveNamespace(type)?.length > 0;
  }

  typeIsPaginated({ getters }: any, type: string): boolean {
    return !!getters.havePaginated(type);
  }

  filteredNamespaces({ rootGetters }: any) {
    // Note - activeNamespaceCache should be accurate for both namespace/project filtering and pagination namespace/project filtering
    return rootGetters.activeNamespaceCache;
  }

  /**
   * Note - namespace can be a list of projects or namespaces
   */
  subscribeNamespace(namespace: string[]) {
    if (pAndNFiltering.isApplicable({ namespaced: namespace }) && namespace.length) {
      return undefined; // AKA sub to everything
    }

    return namespace;
  }

  validChange({ getters, rootGetters }: any, type: string, data: any) {
    if (this.typeIsNamespaced({ getters }, type)) {
      const namespaces = this.filteredNamespaces({ rootGetters });

      if (!namespaces[data.metadata.namespace]) {
        return false;
      }
    }

    if (this.typeIsPaginated({ getters }, type)) {
      const page = getters['all'](type);

      return !!page.find((pR: any) => pR.id === data.id);
    }

    return true;
  }

  validateBatchChange({ getters, rootGetters }: any, batch: { [key: string]: any}) {
    const namespaces = this.filteredNamespaces({ rootGetters });

    Object.entries(batch).forEach(([type, entries]) => {
      if (this.typeIsNamespaced({ getters }, type)) {
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

      if (this.typeIsPaginated({ getters }, type)) {
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

export default new SubscribeNamespaceHandler();
