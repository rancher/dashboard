import { Store } from 'vuex';
import {
  GrowlApi, ModalApi, ShellApi, SlideInApi, NotificationsApi
} from '@shell/apis/intf/shell';
import { GrowlApiImpl } from './growl';
import { ModalApiImpl } from './modal';
import { SlideInApiImpl } from './slide-in';
import { NotificationsApiImpl } from './notifications';

export class ShellApiImpl implements ShellApi {
  private growlApi: GrowlApi;
  private modalApi: ModalApi;
  private slideInApi: SlideInApi;
  private notificationsApi: SlideInApi;

  constructor(store: Store<any>) {
    this.growlApi = new GrowlApiImpl(store);
    this.modalApi = new ModalApiImpl(store);
    this.slideInApi = new SlideInApiImpl(store);
    this.notificationsApi = new NotificationsApiImpl(store);
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

  get notifications(): NotificationsApi {
    return this.notificationsApi;
  }
}
