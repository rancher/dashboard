
import { NotificationApi } from '@shell/types/notifications';
import { ModalApi } from '@shell/apis/intf/modal';
import { SlideInApi } from '@shell/apis/intf/slide-in';
import { SystemApi } from '@shell/apis/intf/system';

export * from '@shell/types/notifications';
export * from '@shell/apis/intf/modal';
export * from '@shell/apis/intf/slide-in';
export * from '@shell/apis/intf/system';

/**
 * @internal
 * Available "API's" inside Shell API
 */
export interface ShellApi {
  /**
   * Provides access to the Modal API which can be used for displaying modals in Rancher UI
   */
  get modal(): ModalApi;

  /**
   * Provides access to the Slide-In API which can be used for displaying Slide-In panels in Rancher UI
   */
  get slideIn(): SlideInApi;

  /**
   * Provides access to the Notification Center API which can be used for notifications in the Rancher UI Notification Center
   */
  get notification(): NotificationApi;

  /**
   * Provides access to the system API which providers information about the current system
   */
  get system(): SystemApi;
}
