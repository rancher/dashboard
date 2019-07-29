import { Model } from '@vuex-orm/core';

export default class Package extends Model {
  static entity = 'packages'

  static fields() {
    return {
      id:    this.increment(),
      name:  this.string(''),
      label: this.string()
    };
  }
}
