import SYSTEM_NAMESPACES from '@/config/system-namespaces';
import { PROJECT, SYSTEM_NAMESPACE } from '@/config/labels-annotations';
import { MANAGEMENT } from '@/config/types';
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

    if ( this.project ) {
      return this.project.isSystem;
    }

    return false;
  },

  projectId() {
    return this.metadata?.labels?.[PROJECT] || null;
  },

  project() {
    if ( !this.projectId || !this.$rootGetters['isMultiCluster'] ) {
      return null;
    }

    const clusterId = this.$rootGetters['currentCluster'].id;
    const project = this.$rootGetters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ this.projectId }`);

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
