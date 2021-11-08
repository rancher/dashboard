import EpinioResource from './epinio-resource-instance.class';

export default class EpinioInstance extends EpinioResource {
  get id() {
    return `${ this.name }`;
  }
}
