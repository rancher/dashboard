import SteveModel from '@shell/plugins/steve/steve-class';

export default class GroupMembershipRefreshRequest extends SteveModel {
  get canRefreshMemberships() {
    return this.schema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
  }
}
