import EpinioResource from './epinio-resource-instance.class';

export default class EpinioNamespaces extends EpinioResource {
  get id() {
    return `${ this.name }`;
  }
}
