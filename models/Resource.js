import { Model } from '@vuex-orm/core';

export default class BaseResource extends Model {
  static fields() {
    return {
      id:       this.string(),
      type:     this.string(),
      actions:  this.attr(),
      links:    this.attr(),
    };
  }
}
