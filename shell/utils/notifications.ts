import { StoredNotification } from '@shell/types/notifications';
import { decrypt } from '@shell/utils/crypto/encryption';

/**
 * Load data from a string
 *
 * @param dataString String containing JSON-serialized encrypted data
 */
export async function loadFromString(dataString: string, encryptionKey: CryptoKey) {
  let notifications: StoredNotification[] = [];

  try {
    const data = JSON.parse(dataString || '{}');

    // Legacy, not encrypted - perform basic check of data in the array
    if (Array.isArray(data)) {
      notifications = data.filter((n) => n.id && n.title);
    }

    if (data.cipher && data.iv) {
      const decrypted = await decrypt(data, encryptionKey);
      const persisted = JSON.parse(decrypted);

      if (Array.isArray(persisted)) {
        notifications = persisted as StoredNotification[];
      } else {
        console.error('Notification data is not in the expected format', persisted); // eslint-disable-line no-console
      }
    }
  } catch (e) {
    console.error('Unable to load notifications from data', e); // eslint-disable-line no-console
  }

  // Notifications needs to be an array, so check in case the data has been corrupted somehow and reset to empty state if so
  // This is an extra check
  if (!Array.isArray(notifications)) {
    console.error('Notification data looks to be corrupt - ignoring persisted data'); // eslint-disable-line no-console

    notifications = [] as StoredNotification[];
  }

  return notifications;
}
