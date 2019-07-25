export default class Resource {
  static entity = 'resources';

  static primaryKey = 'name';

  static fields() {
    return {
      name:     this.string(),
      basePath: this.string()
    };
  }
}
