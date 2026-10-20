import SteveModel from '@shell/plugins/steve/steve-class';

/**
 * Base model for the day 2 operation CRs (operation.cattle.io.*) of imported clusters.
 */
export default class DayTwoOperation extends SteveModel {
  // Deleting an operation that hasn't finished cancels it, so use a delete dialog that can warn about that
  promptRemove() {
    this.$dispatch('promptModal', {
      component: 'RemoveOperationDialog',
      ownsModal: true,
      resources: [this],
    });
  }
}
