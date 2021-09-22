import EpinioResource from './epinio-resource-instance.class';

export default class EpinioOrgs extends EpinioResource {
  get name() { // TODO: RC API format of resources (common id)
    return this.id;
  }
}
