import { get } from '@shell/utils/object';
import { findBy } from '@shell/utils/array';
import SteveModel from '@shell/plugins/steve/steve-class';

export default class HciKeypair extends SteveModel {
  get stateDisplay() {
    const conditions = get(this, 'status.conditions');
    const status = (findBy(conditions, 'type', 'validated') || {}).status ;

    return status === 'True' ? 'Validated' : 'Not Validated';
  }
}
