import Resource from './Resource';

export default class Schema extends Resource {
  static entity = 'schemas'

  static fields() {
    return {
      ...super.fields(),

      resourceMethods:   this.attr(),
      resourcFields:     this.attr(),
      resourceActions:   this.attr(),

      collectionMethods: this.attr(),
      collectionActions: this.attr(),
      collectionFilters: this.attr(),
    };
  }
}
