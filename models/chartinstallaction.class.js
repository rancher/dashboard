import { _VIEW } from '@/config/query-params';
import { set } from '@/utils/object';
import SteveModel from '@/plugins/steve/steve-class';

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
