import { createHandler, DynamicContentNotificationHandlerName } from '@shell/utils/dynamic-content/notification-handler';

/**
 * Register the notification handler for dynamic content
 */
export default function(context) {
  const { store, $extension } = context;

  const handler = createHandler(store);

  $extension.register('notificationHandler', DynamicContentNotificationHandlerName, handler);
}
