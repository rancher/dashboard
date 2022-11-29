import Workload from './workload';
import { getSecondsDiff } from '@shell/utils/time';

export default class Job extends Workload {
  get duration() {
    const schema = this.$getters['schemaFor'](this.type);
    const rowValueGetter = this.$rootGetters['type-map/rowValueGetter'];

    if (schema && rowValueGetter) {
      const value = rowValueGetter(schema, 'Duration')(this);
      const { completionTime, startTime } = this.status;
      let seconds = 0;

      if (value && startTime) {
        seconds = getSecondsDiff(startTime, completionTime || new Date());
      }

      return {
        value,
        seconds,
      };
    }

    return {};
  }
}
