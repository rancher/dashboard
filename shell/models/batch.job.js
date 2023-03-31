import Workload from './workload';
import { _getDuration } from '@shell/plugins/steve/resourceUtils/batch.job';

export default class Job extends Workload {
  get duration() {
    return _getDuration(this, this.$getters, this.$rootGetters);
  }
}
