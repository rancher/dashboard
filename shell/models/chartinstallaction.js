import { _VIEW } from '@shell/config/query-params';
import { set } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class ChartInstallAction extends SteveModel {
  showMasthead(mode) {
    return mode === _VIEW;
  }

  applyDefaults() {
    if ( !this.charts ) {
      set(this, 'charts', [
        {}
      ]);
    }
  }
}
