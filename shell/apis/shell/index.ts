import { Store } from 'vuex';
import {
  GrowlApi, ModalApi, ShellApi, SlideInApi, NotificationApi
} from '@shell/apis/intf/shell';
import { GrowlApiImpl } from './growl';
import { ModalApiImpl } from './modal';
import { SlideInApiImpl } from './slide-in';
import { NotificationApiImpl } from './notifications';

export class ShellApiImpl implements ShellApi {
  private growlApi: GrowlApi;
  private modalApi: ModalApi;
  private slideInApi: SlideInApi;
  private notificationApi: NotificationApi;

  constructor(store: Store<any>) {
    this.growlApi = new GrowlApiImpl(store);
    this.modalApi = new ModalApiImpl(store);
    this.slideInApi = new SlideInApiImpl(store);
    this.notificationApi = new NotificationApiImpl(store);
  }

  get growl(): GrowlApi {
    return this.growlApi;
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
