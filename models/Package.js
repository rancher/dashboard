export default class Package {
  static entity = 'packages'

  static fields() {
    return {
      id:    this.increment(),
      name:  this.string(''),
      label: this.string()
    };
  }
}
