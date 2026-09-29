<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import day from 'dayjs';

import { SNAPSHOT, OPERATION } from '@shell/config/types';
import AsyncButton from '@shell/components/AsyncButton.vue';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import CopyToClipboardText from '@shell/components/CopyToClipboardText.vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { sortBy } from '@shell/utils/sort';
import { escapeHtml } from '@shell/utils/string';
import { DATE_FORMAT, TIME_FORMAT } from '@shell/store/prefs';
import { set } from '@shell/utils/object';
import { createOperationCR } from '@shell/utils/operation-cr';

// There's no existing convention in this codebase for how old an etcd
// snapshot has to be before it's "stale" -- this is a judgment call, not a
// value pulled from design, and should be confirmed with design/PM.
const STALE_SNAPSHOT_DAYS = 1;

export interface Props {
  cluster?: any;
}

const props = withDefaults(defineProps<Props>(), { cluster: () => ({}) });
const emit = defineEmits<{ close: [] }>();

const store = useStore();
const i18n = useI18n(store);

const errors = ref<string[]>([]);

async function getEtcdBackups() {
  const etcdBackups = await store.dispatch('management/findAll', { type: SNAPSHOT });

  if (props.cluster.isImportedWithDayTwoOps) {
    return etcdBackups.filter((backup: any) => backup.metadata.namespace === props.cluster.mgmt?.id && backup.spec?.clusterName === props.cluster.mgmt?.metadata?.name);
  }

  return etcdBackups.filter((backup: any) => backup.clusterId === props.cluster.id);
}

const fetch = useFetch(async() => {
  if (!store.getters['isRancher']) {
    // This fetch function is getting snapshots, which are associated with
    // cluster manager. Rancher Desktop doesn't come with cluster manager, so
    // for Rancher Desktop we return nothing.
    return [];
  }

  return await getEtcdBackups();
});

const latestBackup = computed(() => {
  const etcdBackups = fetch.value.data;

  if (!etcdBackups?.length) {
    return null;
  }

  // snapshotFile.createdAt is when the snapshot content was actually taken (same field
  // the cluster detail page's Snapshots tab sorts by) -- the resource's own top-level
  // `created` is just when the k8s object was created, which lags or drifts from that.
  const backups = sortBy(etcdBackups, ['snapshotFile.createdAt']).reverse();
  const name = backups[0].id.split(':');

  return { name: name[0], created: backups[0].snapshotFile?.createdAt };
});

function getFormattedCreatedDate(createdDate: string) {
  const dateFormat = escapeHtml(store.getters['prefs/get'](DATE_FORMAT));
  const timeFormat = escapeHtml(store.getters['prefs/get'](TIME_FORMAT));
  const d = day(createdDate).format(dateFormat);
  const t = day(createdDate).format(timeFormat);

  return `${ d } ${ t }`;
}

const formattedBackupDate = computed(() => latestBackup.value ? getFormattedCreatedDate(latestBackup.value.created) : '');

const snapshotAgeDays = computed(() => latestBackup.value ? day().diff(day(latestBackup.value.created), 'day') : 0);

const isSnapshotStale = computed(() => !!latestBackup.value && snapshotAgeDays.value >= STALE_SNAPSHOT_DAYS);

const loading = computed(() => fetch.value.loading);

const showTakeSnapshot = computed(() => !loading.value && (!latestBackup.value || isSnapshotStale.value));

const rotateDisabled = computed(() => loading.value || !latestBackup.value);

const warningMessage = computed(() => {
  if (loading.value) {
    return '';
  }

  if (!latestBackup.value) {
    return i18n.t('promptRotateEncryptionKey.warning.noBackup');
  }

  if (isSnapshotStale.value) {
    return i18n.t('promptRotateEncryptionKey.warning.outdated', { days: snapshotAgeDays.value });
  }

  return '';
});

const snapshotsLocation = computed(() => {
  if (!props.cluster.detailLocation) {
    return null;
  }

  return { ...props.cluster.detailLocation, hash: '#snapshots' };
});

function close(buttonDone?: (success: boolean) => void) {
  if (buttonDone && typeof buttonDone === 'function') {
    buttonDone(true);
  }
  emit('close');
}

function takeSnapshot() {
  // Progress can't be shown inside this dialog, so start the snapshot and
  // close immediately -- the user follows progress in the Snapshots tab and
  // re-opens this dialog to rotate once it's done.
  props.cluster.snapshotAction();
  close();
}

async function apply(buttonDone: (success: boolean) => void) {
  try {
    const isImportedWithDayTwoOps = props.cluster?.isImportedWithDayTwoOps || props.cluster?.mgmt?.isDayTwoOpsEnabled;

    if (isImportedWithDayTwoOps) {
      // For imported clusters with day 2 ops, create an encryption key rotation operation CR
      const namespace = props.cluster.mgmt?.id;
      const safePrefix = props.cluster.mgmt?.id;
      const spec = {
        clusterRef: {
          apiVersion: 'management.cattle.io/v3',
          kind:       'Cluster',
          name:       props.cluster.mgmt?.id,
        }
      };

      createOperationCR(store.dispatch, OPERATION.ENCRYPTION_KEY_ROTATE, spec, namespace, safePrefix);
    } else {
      const currentGeneration = props.cluster.spec?.rkeConfig?.rotateEncryptionKeys?.generation || 0;

      // To rotate the encryption keys, increment
      // rkeConfig.rotateEncyrptionKeys.generation in the YAML.
      set(props.cluster, 'spec.rkeConfig.rotateEncryptionKeys.generation', currentGeneration + 1);
      await props.cluster.save();
    }

    close(buttonDone);
  } catch (err) {
    errors.value = exceptionToErrorsArray(err);
    buttonDone(false);
  }
}

defineExpose({
  apply,
  takeSnapshot,
  close,
  latestBackup,
  warningMessage,
  showTakeSnapshot,
  rotateDisabled,
});
</script>

<template>
  <Card
    class="prompt-rotate"
    :show-highlight-border="false"
  >
    <template #title>
      <h4
        v-clean-html="i18n.t('promptRotateEncryptionKey.title')"
        class="text-default-text"
      />
    </template>

    <template #body>
      <div class="pl-10 pr-10">
        <p class="pb-10">
          {{ i18n.t('promptRotateEncryptionKey.description') }}
        </p>

        <Banner
          v-if="warningMessage"
          color="warning"
          :label="warningMessage"
        />

        <div
          v-if="latestBackup"
          class="snapshot-info"
        >
          <div class="snapshot-info__header">
            <label>{{ i18n.t('promptRotateEncryptionKey.snapshotInfo.title') }}</label>
            <router-link
              v-if="snapshotsLocation"
              :to="snapshotsLocation"
              @click="close"
            >
              {{ i18n.t('promptRotateEncryptionKey.snapshotInfo.viewSnapshots') }}
            </router-link>
          </div>

          <div class="snapshot-info__age">
            <i
              class="icon"
              :class="{
                'icon-checkmark text-success': !isSnapshotStale,
                'icon-warning text-warning': isSnapshotStale
              }"
            />
            <span>
              {{ i18n.t('promptRotateEncryptionKey.snapshotInfo.taken') }}
              <LiveDate
                :value="latestBackup.created"
                add-suffix
                suffix="ago"
                :show-tooltip="false"
              />
            </span>
            <span class="text-muted">{{ formattedBackupDate }}</span>
          </div>

          <div class="snapshot-info__id">
            <CopyToClipboardText
              plain
              :text="latestBackup.name"
            />
          </div>
        </div>
      </div>
    </template>

    <template #actions>
      <div class="buttons">
        <button
          class="btn role-secondary mr-10"
          @click="close()"
        >
          {{ i18n.t('generic.cancel') }}
        </button>

        <button
          v-if="showTakeSnapshot"
          class="btn role-secondary mr-10"
          @click="takeSnapshot"
        >
          {{ i18n.t('nav.takeSnapshot') }}
        </button>

        <AsyncButton
          mode="rotate"
          :action-label="i18n.t('promptRotateEncryptionKey.rotateKeys')"
          :disabled="rotateDisabled"
          @click="apply"
        />

        <Banner
          v-for="(err, i) in errors"
          :key="i"
          color="error"
          :label="err"
        />
      </div>
    </template>
  </Card>
</template>
<style lang='scss' scoped>
  .prompt-rotate {
    margin: 0;
  }
  .buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
  }
  .snapshot-info {
    margin-top: 10px;
    padding: 15px;
    border-radius: var(--border-radius);
    background: var(--body-bg);
    border: 1px solid var(--border);

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      label {
        font-weight: bold;
      }
    }

    &__age {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;

      .icon {
        font-size: 16px;
      }
    }

    &__id {
      margin-top: 10px;
      padding: 8px 10px;
      border-radius: var(--border-radius);
      background: var(--disabled-bg);
      font-family: monospace;
      overflow-wrap: break-word;
    }
  }
</style>
