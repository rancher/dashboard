import { escapeHtml } from '@shell/utils/string';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class FleetToken extends SteveModel {
  get groupByLabel() {
    const name = this.metadata.namespace;

    if ( name ) {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
    } else {
      return this.$rootGetters['i18n/t']('resourceTable.groupLabel.notInAWorkspace');
    }
  }
}
