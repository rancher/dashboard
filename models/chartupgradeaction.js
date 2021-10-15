import { set } from '@/utils/object';
import SteveModel from '@/plugins/steve/steve-class';

export default class ChartUpgradeAction extends SteveModel {
  applyDefaults() {
    if ( !this.charts ) {
      set(this, 'charts', [
        {}
      ]);
    }
  }
}
