import BaseExampleResource from './base-example.resource';
import { STATES_ENUM } from '@shell/plugins/dashboard-store/resource-class';

export default class ExampleResource extends BaseExampleResource {
  get links() {
    return {
      self:   this.id,
      create: '',
      remove: 'thisisrequiredtoshowdeletelinks' // A remove link is required to ensure the delete buttons show
    };
  }

  get stateObj() {
    const transitioning = this.state === STATES_ENUM.IN_PROGRESS;

    return {
      error:         false,
      transitioning,
      message:       transitioning ? 'Custom message for transitional state' : ''
    };
  }

  get creationTimestamp() {
    return this.age;
  }
}
