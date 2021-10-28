import { insertAt } from '@/utils/array';
import Workload from './workload';

export default class CronJob extends Workload {
  get state() {
    if ( this.spec?.suspend ) {
      return 'suspended';
    }

    return super.state;
  }

  get _availableActions() {
    const out = super._availableActions;
    const suspended = this.spec?.suspend || false;

    // insertAt(out, 0, {
    //   action:     'runNow',
    //   label:      'Run Now',
    //   icon:       'icon icon-play',
    //   enabled:    true,
    //   bulkable:   true,
    // });

    insertAt(out, 0, {
      action:     'suspend',
      label:      'Suspend',
      icon:       'icon icon-pause',
      enabled:    !suspended,
      bulkable:   true,
    });

    insertAt(out, 1, {
      action:     'resume',
      label:      'Resume',
      icon:       'icon icon-play',
      enabled:    suspended,
      bulkable:   true,
    });

    return out;
  }

  // runNow() {

  // }

  suspend() {
    this.spec.suspend = true;
    this.save();
  }

  resume() {
    this.spec.suspend = false;
    this.save();
  }
}
