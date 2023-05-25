import Workload from './workload';
import { getSecondsDiff } from '@shell/utils/time';

export default class Job extends Workload {
  get duration() {
    const schema = this.$getters['schemaFor'](this.type);
    const rowValueGetter = this.$rootGetters['type-map/rowValueGetter'];

    const { completionTime, startTime } = this.status;

    const staticValue = schema && rowValueGetter ? rowValueGetter(schema, 'Duration')(this) : null;
    const seconds = staticValue && startTime ? getSecondsDiff(startTime, completionTime || new Date()) : 0;

    return {
      value: completionTime ? { staticValue } : { startTime },
      seconds,
    };
  }
}
