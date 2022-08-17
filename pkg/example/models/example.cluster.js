import BaseExampleResource from './base-example.resource';

export default class ExampleCluster extends BaseExampleResource {
  get state() {
    return this.metadata.state.name;
  }
}
