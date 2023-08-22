import Workload from './workload';
import { EVENT } from '@shell/config/types';

export default class DaemonSet extends Workload {
  async rollBack(cluster, daemonSet, revision) {
    const body = [
      {
        op:    'replace',
        path:  '/spec/template',
        value: {
          metadata: revision.data.spec.template.metadata,
          spec:     revision.data.spec.template.spec
        }
      }, {
        op:    'replace',
        path:  '/metadata/generation',
        value: revision.revision,
      }
    ];

    await this.rollBackWorkload(cluster, daemonSet, 'daemonsets', body);
  }

  get latestEventForDaemonSet() {
    const events = this.$getters['all'](EVENT) || [];
    const daemonSetEvents = events.filter((ev) => ev.id?.includes(this.id)) || [];

    if (daemonSetEvents.length) {
      return daemonSetEvents[daemonSetEvents.length - 1];
    }

    return {};
  }

  get stateObj() {
    // artificially manipulate state of DaemonSet to display error message in case of FailedCreate
    // https://github.com/rancher/dashboard/issues/8502
    if (this.latestEventForDaemonSet.reason === 'FailedCreate' && this.latestEventForDaemonSet.message) {
      return {
        name:          super.stateObj.name,
        transitioning: false,
        error:         true,
        message:       this.latestEventForDaemonSet.message
      };
    }

    return super.stateObj;
  }
}
