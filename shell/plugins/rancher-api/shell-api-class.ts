import { Store } from 'vuex';

interface ShellApiOptions {
  store: Store<any>;
}

export default class ShellApi {
  protected $store: Store<any>;

  constructor(options: ShellApiOptions) {
    this.$store = options.store;
  }
}
