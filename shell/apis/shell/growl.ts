import { Store } from 'vuex';
import { GrowlApi, GrowlMessage } from '@shell/apis/intf/shell';

export class GrowlApiImpl implements GrowlApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  public show(config: GrowlMessage): void {
    const { type = 'error' } = config;

    this.store.dispatch(
      `growl/${ type }`,
      {
        title:   config.title,
        message: config.message,
        timeout: config.timeout || 5000,
      },
      { root: true }
    );
  }
}
