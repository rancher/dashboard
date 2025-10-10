import { Store } from 'vuex';
import { NotificationsApi } from '@shell/apis/intf/shell';

export class NotificationsApiImpl implements NotificationsApi {
  private store: Store<any>;

  constructor(store: Store<any>) {
    this.store = store;
  }

  public send(notification?: any): void {
    this.store.dispatch('notifications/add', notification, { root: true });
  }
}
