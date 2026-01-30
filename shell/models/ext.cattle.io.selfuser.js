import SteveModel from '@shell/plugins/steve/steve-class';

export default class SelfUser extends SteveModel {
  get canGetUser() {
    return this.schema?.collectionMethods.find((x) => ['post'].includes(x.toLowerCase()));
  }
}
