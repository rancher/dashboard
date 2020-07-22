import SYSTEM_NAMESPACES from '@/config/system-namespaces';
import { PROJECT, SYSTEM_NAMESPACE } from '@/config/labels-annotations';
import { EXTERNAL } from '@/config/types';
import { escapeHtml } from '@/utils/string';

export default {
  isSystem() {
    if ( !!this.metadata?.labels?.[SYSTEM_NAMESPACE] ) {
      return true;
    }

    if ( SYSTEM_NAMESPACES.includes(this.metadata.name) ) {
      return true;
    }

    if ( this.metadata.name.endsWith('-system') ) {
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

  groupByLabel() {
    const name = this.project?.nameDisplay;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.project', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAProject');
    }
  },

  projectNameSort() {
    return this.project?.nameSort || '';
  }
};
