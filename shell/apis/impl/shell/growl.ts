import { Store } from 'vuex';
import { GrowlApi, GrowlMessage } from '@shell/apis/intf/shell';

export class GrowlApiImpl implements GrowlApi {
  constructor(private store: Store<any>) {}

  public show(config: GrowlMessage): void {
    const { type = 'error', timeout = 5000 } = config;

    this.store.dispatch(
      `growl/${ type }`,
      {
        title  : config.title,
        message: config.message,
        timeout: config.timeout,
      },
      { root: true }
    );
  }
};
