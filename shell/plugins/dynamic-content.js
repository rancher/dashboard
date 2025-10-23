import { createHandler, DynamicContentAnnouncementHandlerName } from '@shell/utils/dynamic-content/notification-handler';
import { NotificationHandlerExtensionName } from '@shell/types/notifications';

/**
 * Register the notification handler for dynamic content
 */
export default function(context) {
  const { store, $extension } = context;

  const handler = createHandler(store);

  $extension.register(NotificationHandlerExtensionName, DynamicContentAnnouncementHandlerName, handler);
}
