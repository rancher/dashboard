import { set } from '@shell/utils/object';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class ChartUpgradeAction extends SteveModel {
  applyDefaults() {
    if ( !this.charts ) {
      set(this, 'charts', [
        {}
      ]);
    }
  }
}
