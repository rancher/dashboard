import { escapeHtml } from '@/utils/string';
import SteveModel from '@/plugins/steve/steve-class';
import typeHelper from '@/utils/type-helpers';

export default class FleetBundle extends SteveModel {
  get deploymentInfo() {
    const ready = this.status?.summary?.ready || 0;
    const total = this.status?.summary?.desiredReady || 0;

    return {
      ready,
      unready: total - ready,
      total,
    };
  }

  get lastUpdateTime() {
    return this.status.conditions[0].lastUpdateTime;
  }

  get bundleType() {
    if (typeHelper.memberOfObject(this.spec, 'helm')) {
      return 'helm';
    }

    return '';
  }

  get repoName() {
    return this.metadata.labels['fleet.cattle.io/repo-name'];
  }

  get groupByLabel() {
    const name = this.metadata.namespace;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  }
}
