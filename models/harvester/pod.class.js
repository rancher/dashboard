import includes from 'lodash/includes';
import { findBy } from '@/utils/array';
import { get } from '@/utils/object';
import { NODE } from '@/config/types';
import { Resource } from '@/plugins/core-store/resource-class';

const POD_STATUS_NOT_SCHEDULABLE = 'POD_NOT_SCHEDULABLE';

const POD_STATUS_FAILED = 'POD_FAILED';
const POD_STATUS_CRASHLOOP_BACKOFF = 'POD_CRASHLOOP_BACKOFF';
const POD_STATUS_UNKNOWN = 'POD_STATUS_UNKNOWN';
const POD_STATUS_CONTAINER_FAILING = 'POD_CONTAINER_FAILING';
const POD_STATUS_NOT_READY = 'POD_NOT_READY';

const POD_STATUS_PENDING = 'POD_STATUS_PENDING';
const POD_STATUS_COMPLETED = 'POD_STATUS_COMPLETED';
const POD_STATUS_SUCCEEDED = 'POD_STATUS_SUCCEEDED';
const POD_STATUS_RUNNING = 'POD_STATUS_RUNNING';

const failedWaitingContainerReasons = ['ImagePullBackOff', 'ErrImagePull', 'CrashLoopBackOff'];
const failedTerminationContaineReasons = ['Error'];

const errorStatusMapper = {
  Failed:           POD_STATUS_FAILED,
  CrashLoopBackOff: POD_STATUS_CRASHLOOP_BACKOFF,
  Unknown:          POD_STATUS_UNKNOWN,
};

const okStatusMapper = {
  Pending:   POD_STATUS_PENDING,
  Running:   POD_STATUS_RUNNING,
  Completed: POD_STATUS_COMPLETED,
  Succeeded: POD_STATUS_SUCCEEDED,
};

const stateReasonResolver = {
  terminated: ({ reason, exitCode }) => `Terminated with ${ reason }${ exitCode ? ` (exit code ${ exitCode }).` : '.' }`,
  waiting:    ({ reason }) => `Waiting (${ reason }).`,
};

export default class Pod extends Resource {
  inStore() {
    return this.$rootGetters['currentProduct'].inStore;
  }

  nodes() {
    return this.$rootGetters[`${ this.inStore }/all`](NODE);
  }

  node() {
    const { nodeName } = this.spec;

    return this.nodes.filter((node) => {
      return node?.metadata?.name === nodeName;
    })[0];
  }

  getPodStatus() {
    return this.isNotSchedulable ||
    this.hasErrorStatus ||
    this.isContainerFailing ||
    this.isNotReady ||
    this.hasOkStatus || { status: POD_STATUS_UNKNOWN };
  }

  isNotSchedulable() {
    if (!this.isPodSchedulable) {
      return {
        status:  POD_STATUS_NOT_SCHEDULABLE,
        message: 'Pod scheduling failed.',
      };
    }

    return null;
  }

  hasErrorStatus() {
    const status = errorStatusMapper[this?.status?.phase];

    if (status) {
      return {
        status,
        message: this.getContainerStatusReason(this.findFailingContainerStatus),
      };
    }

    return null;
  }

  isPodSchedulable() {
    const conditions = get(this, 'status.conditions');
    const podScheduledCond = findBy(conditions, 'type', 'PodScheduled');

    return !(
      podScheduledCond &&
      podScheduledCond.status !== 'True' &&
      podScheduledCond.reason === 'Unschedulable'
    );
  }

  findFailingContainerStatus() {
    return (get(this, 'status.containerStatuses'), []).find((container) => {
      return !container.ready &&
      (includes(failedWaitingContainerReasons, get(container, 'state.waiting.reason')) ||
      includes(failedTerminationContaineReasons, get(container, 'state.terminated.reason')));
    });
  }

  getContainerStatusReason() {
    return (containerStatus) => {
      if (containerStatus) {
        const stateName = Object.getOwnPropertyNames(containerStatus.state).find(
          pn => !!containerStatus.state[pn].reason,
        );

        if (stateName) {
          const state = containerStatus.state[stateName];

          return (
            state.message ||
            (stateReasonResolver[stateName] && stateReasonResolver[stateName](state)) ||
            stateName
          );
        }
      }

      return undefined;
    };
  }

  isContainerFailing() {
    const failingContainer = this.findFailingContainerStatus;

    if (failingContainer) {
      return {
        status:  POD_STATUS_CONTAINER_FAILING,
        message: this.getContainerStatusReason(failingContainer),
      };
    }

    return null;
  }

  isNotReady() {
    const message = this.findPodFalseStatusConditionMessage;

    if (message) {
      return {
        status: POD_STATUS_NOT_READY,
        message,
      };
    }

    return null;
  }

  hasOkStatus() {
    const status = okStatusMapper[this?.status?.phase];

    if (status) {
      return { status };
    }

    return null;
  }

  findPodFalseStatusConditionMessage() {
    const notReadyConditions = this.getPodFalseStatusConditions;

    if (notReadyConditions.length > 0) {
      return notReadyConditions[0].message || `Step: ${ notReadyConditions[0].type }`;
    }

    return undefined;
  }

  getPodFalseStatusConditions() {
    const conditions = get(this, 'status.conditions') || [];

    return conditions.filter(condition => condition.status !== 'True');
  }
}
