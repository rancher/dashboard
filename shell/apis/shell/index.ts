import { Store } from 'vuex';
import { ModalApi, ShellApi, SlideInApi, NotificationApi } from '@shell/apis/intf/shell';
import { ModalApiImpl } from './modal';
import { SlideInApiImpl } from './slide-in';
import { NotificationApiImpl } from './notifications';

export class ShellApiImpl implements ShellApi {
  private modalApi: ModalApi;
  private slideInApi: SlideInApi;
  private notificationApi: NotificationApi;

  constructor(store: Store<any>) {
    this.modalApi = new ModalApiImpl(store);
    this.slideInApi = new SlideInApiImpl(store);
    this.notificationApi = new NotificationApiImpl(store);
  }

  get modal(): ModalApi {
    return this.modalApi;
  }

  get slideIn(): SlideInApi {
    return this.slideInApi;
  }

  get notification(): NotificationApi {
    return this.notificationApi;
  }
}
