export abstract class BaseApi {
  // The Vuex store, available to all API classes
  protected $store: any;

  // Documented requirement: each API should define its static apiName.
  static apiName(): string {
    throw new Error('apiName() static method has not been implemented');
  }

  constructor(store: any) {
    this.$store = store;
  }
}
