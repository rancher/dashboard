import Resource from './resource';

export default class Collection extends Resource {
  static entity = 'schemas'

  toString() {
    return `collection:${ this.resourceType }[${ this.data.length }]`;
  }
}
