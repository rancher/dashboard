import SteveModel from '@shell/plugins/steve/steve-class';

export default class ControllerRevision extends SteveModel {
  get revisionNumber() {
    return this.revision;
  }
}
