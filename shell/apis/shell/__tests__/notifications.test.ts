// notifications.test.ts

import {
  describe, it, expect, jest, beforeEach
} from '@jest/globals';
import { NotificationApiImpl } from '../notifications';
import { Store } from 'vuex';
import { NotificationLevel } from '@shell/types/notifications'; // Assuming this path

describe('notificationApiImpl', () => {
  let mockStore: Store<any>;
  let notificationApi: NotificationApiImpl;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    // 1. Arrange
    mockDispatch = jest.fn() as any;
    mockStore = { dispatch: mockDispatch } as any;

    // 2. Arrange
    notificationApi = new NotificationApiImpl(mockStore);
  });

  it('should send a notification and return its ID', async() => {
    const mockNotificationId = 'notif-12345';
    const config = { progress: 80 };

    // Arrange: Mock the dispatch to return a promise resolving to the ID
    mockDispatch.mockResolvedValue(mockNotificationId);

    // 3. Act: Call the async method
    const result = await notificationApi.send(
      NotificationLevel.Success,
      'Test Title',
      'Test Message',
      config
    );

    // 4. Assert
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      'notifications/add',
      {
        level:    NotificationLevel.Success,
        title:    'Test Title',
        message:  'Test Message',
        progress: 80,
      },
      { root: true }
    );

    // Assert the return value
    expect(result).toBe(mockNotificationId);
  });

  it('should update notification progress', () => {
    // 3. Act
    notificationApi.updateProgress('notif-abc', 75);

    // 4. Assert
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      'notifications/update',
      {
        id:       'notif-abc',
        progress: 75,
      },
      { root: true }
    );
  });
});
