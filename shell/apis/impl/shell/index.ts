import { Store } from 'vuex';
import { GrowlApi, ModalApi, ShellApi, SlideInApi } from '@shell/apis/intf/shell';
import { GrowlApiImpl } from './growl';
import { ModalApiImpl } from './modal';

export class ShellApiImpl implements ShellApi {
  private growlApi: GrowlApi;
  private modalApi: ModalApi;
  private slideInApi: SlideInApi;

  constructor(store: Store<any>) {
    this.growlApi = new GrowlApiImpl(store);
    this.modalApi = new ModalApiImpl(store);
    this.slideInApi = new ModalApiImpl(store);
  }

  get growl(): GrowlApi {
    return this.growlApi;
  }

  get modal(): ModalApi {
    throw this.modalApi;
  }

  get slideIn(): SlideInApi {
    throw this.slideInApi;
  }
}
