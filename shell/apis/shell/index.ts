import { Store } from 'vuex';
import {
  ModalApi, ShellApi, SlideInApi, NotificationApi, SystemApi, ProxyApi, UserTypesApi
} from '@shell/apis/intf/shell';
import { ModalApiImpl } from './modal';
import { SlideInApiImpl } from './slide-in';
import { NotificationApiImpl } from './notifications';
import { SystemApiImpl } from './system';
import { ProxyApiImpl } from './proxy';
import { UserTypesApiImpl } from './user-types';

export class ShellApiImpl implements ShellApi {
  private modalApi: ModalApi;
  private slideInApi: SlideInApi;
  private notificationApi: NotificationApi;
  private systemApi: SystemApi;
  private proxyApi: ProxyApi;
  private userTypesApi: UserTypesApi;

  constructor(store: Store<any>) {
    this.modalApi = new ModalApiImpl(store);
    this.slideInApi = new SlideInApiImpl(store);
    this.notificationApi = new NotificationApiImpl(store);
    this.systemApi = new SystemApiImpl(store);
    this.proxyApi = new ProxyApiImpl(store);
    this.userTypesApi = new UserTypesApiImpl(store);
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

  get system(): SystemApi {
    return this.systemApi;
  }

  get proxy(): ProxyApi {
    return this.proxyApi;
  }

  get userTypes(): UserTypesApi {
    return this.userTypesApi;
  }
}
