export abstract class BaseApi {
  // The Vuex store, available to all API classes
  protected $store: any;

  // Documented requirement: each API should define its static apiName.
  static apiName: string;

  constructor(store: any) {
    this.$store = store;
  }
}
