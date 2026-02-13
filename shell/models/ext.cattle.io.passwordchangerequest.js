import SteveModel from '@shell/plugins/steve/steve-class';

export default class PasswordChangeRequest extends SteveModel {
  get canChangePassword() {
    return this.schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
  }
}
