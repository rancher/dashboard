<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import day from 'dayjs';

import { SNAPSHOT, OPERATION } from '@shell/config/types';
import { RcModal } from '@components/RcModal';
import { RcButton } from '@components/RcButton';
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

const STALE_SNAPSHOT_DAYS = 1;

export interface Props {
  cluster?: any;

  /**
   * `show` and the `close` handler, from whoever owns this dialog's visibility
   */
  modal: { show: boolean; onClose: () => void };
}

// PromptModal (opened with `ownsModal`) also passes `resources`, which this dialog doesn't use,
// so keep stray attributes off RcModal's dialog element.
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), { cluster: () => ({}) });

const store = useStore();
const i18n = useI18n(store);

const errors = ref<string[]>([]);
const rotating = ref(false);

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

const rotateDisabled = computed(() => rotating.value || loading.value || !latestBackup.value);

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

function close() {
  // Stay open while the request is in flight, so its outcome is never lost
  if (rotating.value) {
    return;
  }

  props.modal.onClose();
}

function takeSnapshot() {
  // Progress can't be shown inside this dialog, so start the snapshot and
  // close immediately -- the user follows progress in the Operations tab and
  // re-opens this dialog to rotate once it's done.
  props.cluster.snapshotAction();
  close();
}

async function rotate() {
  if (rotateDisabled.value) {
    return;
  }

  errors.value = [];
  rotating.value = true;

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

      await createOperationCR(store.dispatch, OPERATION.ENCRYPTION_KEY_ROTATE, spec, namespace, safePrefix, { notifyGeneratedName: true });
    } else {
      const currentGeneration = props.cluster.spec?.rkeConfig?.rotateEncryptionKeys?.generation || 0;

      // To rotate the encryption keys, increment
      // rkeConfig.rotateEncyrptionKeys.generation in the YAML.
      set(props.cluster, 'spec.rkeConfig.rotateEncryptionKeys.generation', currentGeneration + 1);
      await props.cluster.save();
    }

    rotating.value = false;
    close();
  } catch (err) {
    errors.value = exceptionToErrorsArray(err);
    rotating.value = false;
  }
}

defineExpose({
  rotate,
  takeSnapshot,
  close,
  latestBackup,
  warningMessage,
  showTakeSnapshot,
  rotateDisabled,
  rotating,
  errors,
});
</script>

<template>
  <!-- Not v-bind="modal": closing goes through close(), which refuses while a rotation is in flight -->
  <!-- large, not the medium default, so the etcd snapshot id (cluster name + node name + timestamp + hash,
       often 70+ chars) fits on one line -->
  <RcModal
    :show="modal.show"
    :title="i18n.t('promptRotateEncryptionKey.title')"
    size="large"
    :click-to-close="!rotating"
    class="rotate-encryption-key"
    data-testid="rotate-encryption-key-dialog"
    @close="close"
    @primary-action="rotate"
  >
    <p>
      {{ i18n.t('promptRotateEncryptionKey.description') }}
    </p>

    <Banner
      v-if="warningMessage"
      class="m-0"
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

    <Banner
      v-for="(error, i) in errors"
      :key="i"
      class="m-0"
      color="error"
      :label="error"
    />

    <!-- The whole footer, as Take Snapshot sits between Cancel and the primary action -->
    <template #actions="{ cancel, primaryAction }">
      <RcButton
        variant="tertiary"
        size="large"
        data-testid="rotate-encryption-key-cancel"
        @click="cancel"
      >
        {{ i18n.t('generic.cancel') }}
      </RcButton>
      <RcButton
        v-if="showTakeSnapshot"
        variant="secondary"
        size="large"
        :disabled="rotating"
        data-testid="rotate-encryption-key-take-snapshot"
        @click="takeSnapshot"
      >
        {{ i18n.t('nav.takeSnapshot') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        :disabled="rotateDisabled"
        :aria-busy="rotating"
        data-testid="rotate-encryption-key-rotate"
        @click="primaryAction"
      >
        {{ i18n.t('promptRotateEncryptionKey.rotateKeys') }}
      </RcButton>
    </template>
  </RcModal>
</template>
<style lang='scss' scoped>
  .snapshot-info {
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
