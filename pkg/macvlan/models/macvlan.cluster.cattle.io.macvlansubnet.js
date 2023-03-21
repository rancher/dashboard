import SteveModel from '@shell/plugins/steve/steve-class';

export default class extends SteveModel {
  promptRemove(resources = this) {
    this.$dispatch('promptModal', {
      resources,
      component: 'promptRemoveMacvlanDialog'
    });
  }

  get doneRoute() {
    return this.listLocation.name;
  }
}
