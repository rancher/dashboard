import SteveModel from '@shell/plugins/steve/steve-class';

export default class SelfUser extends SteveModel {
  get canGetUser() {
    return this.schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
  }

  cleanForSave(data) {
    const val = super.cleanForSave(data);

    delete val.type;

    return val;
  }
}
