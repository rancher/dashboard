<script setup lang="ts">
import { READ_WHATS_NEW } from '@shell/store/prefs';
import { useStore } from 'vuex';
import { Notification, NotificationLevel } from '@shell/store/notifications';

const store = useStore();
const task: Notification = {
  id:      'test-task-notification',
  level:   NotificationLevel.Task,
  title:   'Cluster provisioning in progress',
  message: 'Provisioning demo-cluster ...',
};

const clearAll = () => {
  store.dispatch('notifications/clearAll');
};

const addAll = () => {
  // Add a set of test notifications
  // Register notification
  store.dispatch('notifications/add', {
    level:    NotificationLevel.Announcement,
    title:   'New version available!',
    message: 'Rancher v2.9 is now available for installation'
  });

  store.dispatch('notifications/add', {
    level:   NotificationLevel.Success,
    title:   'Cluster provisioning finished',
    message: 'The demo cluster has been provisioned.'
  });

  store.dispatch('notifications/add', {
    level:         NotificationLevel.Info,
    title:         'Hey, have I got some information for you',
    message:       'The StackState extension failed to load after 3 attempts.',
    primaryAction: {
      label:  'Learn More',
      target: 'https://www.rancher.com'
    },
    secondaryAction: {
      label:  'Logs',
      target: 'https://www.rancher.com'
    }
  });

  store.dispatch('notifications/add', task);

  store.dispatch('notifications/add', {
    level:   NotificationLevel.Warning,
    title:   'Node limitations warning',
    message: 'You are about to reach the maximum hosts limit soon - we are currently monitoring 90 out of 100 nodes.'
  });

  store.dispatch('notifications/add', {
    level:   NotificationLevel.Error,
    title:   'Extension failed to load',
    message: 'The StackState extension failed to load after 3 attempts.'
  });
};

const updateProgress = () => {
  if (!task.progress || task.progress === 100) {
    task.progress = 0;
  }

  if (task.progress < 100) {
    task.progress++;
  }

  store.dispatch('notifications/update', task);

  if (task.progress < 100) {
    setTimeout(updateProgress, 75);
  }
};

const reset = () => {
  store.dispatch('prefs/set', { key: READ_WHATS_NEW, value: '' });
};

const growl = () => {
  store.dispatch('growl/success', {
    title: 'Extension loaded',
    message: 'Virtual Clusters UI Extension loaded successfully',
  }, { root: true });  
}
</script>

<template>
  <div class="panel">
    <div class="header">Notification Test Panel</div>
    <div class="actions">
      <button
        @click="clearAll()"
        class="btn btn-sm role-primary"
      >Clear All</button>
      <button
        @click="addAll()"
        class="btn btn-sm role-primary"
      >Add All</button>
      <button
        @click="updateProgress()"
        class="btn btn-sm role-primary"
      >Update progress</button>
      <button
        @click="reset()"
        class="btn btn-sm role-primary"
      >Reset release notes read</button>
      <button
        @click="growl()"
        class="btn btn-sm role-primary"
      >
        Growl Test
      </button>      
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .panel {
    margin: 20px;
    border: 1px solid var(--border);
    padding: 10px;

    .header {
      font-weight: bold;
      margin-bottom: 10px;
    }

    .actions {
      button {
        margin-right: 10px;
      }
    }
  }
</style>
