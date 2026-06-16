/**
 * Composable to provide access to an announcement
 */

import { computed, ComputedRef } from 'vue';
import { useStore } from 'vuex';
import { Notification, StoredNotification, NotificationAction } from '@shell/types/notifications';
import { useRouter } from 'vue-router';

export type Styles = { [key: string]: string };

export interface UseDynamicInput {
  dynamicContent: ComputedRef<Notification | undefined>;
  primaryButtonStyle: ComputedRef<string>;
  styles: ComputedRef<Styles>;
  invokeAction: (action: NotificationAction) => void;
}

export interface DynamicInputProps {
  location?: string;
}

export const useDynamicContent = (props: DynamicInputProps, defaultLocation: string): UseDynamicInput => {
  const store = useStore();
  const router = useRouter();

  // Return the first un-read hidden notification for the given location
  const dynamicContent = computed(() => {
    const location = props.location || defaultLocation;
    const hiddenUnreadNotificationsForLocation: Notification[] = store.getters['notifications/hidden'].filter((n: StoredNotification) => !n.read && n.data?.location === location);

    return hiddenUnreadNotificationsForLocation.length > 0 ? hiddenUnreadNotificationsForLocation[0] : undefined;
  });

  const styles = computed(() => {
    const parts = dynamicContent?.value?.data?.style?.trim().split(',') || [];
    const res: Styles = {};

    parts.forEach((part: string) => {
      const kv = part.split(':');

      if (kv.length === 2) {
        res[kv[0].trim()] = kv[1].trim();
      }
    });

    return res;
  });

  const primaryButtonStyle = computed(() => {
    const buttonStyle = styles.value.btn === 'link' ? 'tertiary' : styles.value.btn || 'primary';

    return `role-${ buttonStyle }`;
  });

  // Invoke action (typically from either the primary or secondary buttons of a notification)
  // This can open a URL in a new tab OR navigate to an application route
  const invokeAction = (action: NotificationAction) => {
    if (action.target) {
      window.open(action.target, '_blank');
    } else if (action.route) {
      try {
        router.push(action.route);
      } catch (e) {
        console.error('Error navigating to route for the notification action', e); // eslint-disable-line no-console
      }
    } else {
      console.error('Notification action must either specify a "target" or a "route"'); // eslint-disable-line no-console
    }
  };

  return {
    dynamicContent,
    invokeAction,
    primaryButtonStyle,
    styles
  };
};
