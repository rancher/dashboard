import SYSTEM_NAMESPACES from '@/config/system-namespaces';
import { PROJECT } from '@/config/labels-annotations';
import { EXTERNAL } from '@/config/types';

export default {
  isSystem() {
    if ( SYSTEM_NAMESPACES.includes(this.metadata.name) ) {
      return true;
    }

    if ( this.$rootGetters['isRancher'] ) {
      const project = this.project;

      if ( project ) {
        return project.isSystem;
      }
    }

    return false;
  },

  projectId() {
    return this.metadata?.labels?.[PROJECT] || null;
  },

  project() {
    if ( !this.projectId || !this.$rootGetters['isRancher'] ) {
      return null;
    }

    const project = this.$rootGetters['clusterExternal/byId'](EXTERNAL.PROJECT, this.projectId);

    return project;
  },

  projectNameDisplay() {
    const name = this.project?.nameDisplay;

    if ( name ) {
      return this.$rootGetters['i18n/t']('model.namespace.project', { name });
    } else {
      return this.$rootGetters['i18n/t']('model.namespace.notInAProject');
    }
  },

  projectNameSort() {
    return this.project?.nameSort || '';
  }
};
