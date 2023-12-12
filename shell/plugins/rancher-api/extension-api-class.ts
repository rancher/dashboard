import { Store } from 'vuex';

interface ExtensionApiOptions {
  store: Store<any>;
}

export default class ExtensionApi {
  protected $store: Store<any>;

  constructor(options: ExtensionApiOptions) {
    this.$store = options.store;
  }
}
