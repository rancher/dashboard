import { Store } from 'vuex';
import { GrowlApi, ModalApi, ShellApi, SlideInApi } from '@shell/apis/intf/shell';
import { GrowlApiImpl } from './growl';
import { ModalApiImpl } from './modal';
import { SlideInApiImpl } from './slide-in';

export class ShellApiImpl implements ShellApi {
  private growlApi: GrowlApi;
  private modalApi: ModalApi;
  private slideInApi: SlideInApi;

  constructor(store: Store<any>) {
    this.growlApi = new GrowlApiImpl(store);
    this.modalApi = new ModalApiImpl(store);
    this.slideInApi = new SlideInApiImpl(store);
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
}
