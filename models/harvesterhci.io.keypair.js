import { get } from '@/utils/object';
import { findBy } from '@/utils/array';

export default {
  stateDisplay() {
    const conditions = get(this, 'status.conditions');
    const status = (findBy(conditions, 'type', 'validated') || {}).status ;

    return status === 'True' ? 'Validated' : 'Not Validated';
  },
};
