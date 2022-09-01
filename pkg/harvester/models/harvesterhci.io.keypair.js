import { get } from '@shell/utils/object';
import { findBy } from '@shell/utils/array';
import HarvesterResource from './harvester';

export default class HciKeypair extends HarvesterResource {
  get stateDisplay() {
    const conditions = get(this, 'status.conditions');
    const status = (findBy(conditions, 'type', 'validated') || {}).status ;

    return status === 'True' ? 'Validated' : 'Not Validated';
  }
}
