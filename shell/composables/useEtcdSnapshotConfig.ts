import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import isEmpty from 'lodash/isEmpty';
import { useI18n } from '@shell/composables/useI18n';
import { _VIEW } from '@shell/config/query-params';
import { isValidCronSchedule } from '@shell/utils/validators/cron-schedule';

export interface EtcdSnapshotS3 {
  bucket?: string;
  cloudCredentialName?: string | null;
  endpoint?: string;
  endpointCA?: string;
  folder?: string;
  region?: string;
  retention?: number | null;
  skipSSLVerify?: boolean;
}

export interface EtcdSnapshotConfigValue {
  disableSnapshots?: boolean;
  snapshotScheduleCron?: string;
  snapshotRetention?: number | null;
  s3?: EtcdSnapshotS3 | null;
  [key: string]: unknown;
}

export interface EtcdSnapshotConfigProps {
  mode: string;
  value?: EtcdSnapshotConfigValue | null;
  s3Backup?: boolean;
}

type EtcdSnapshotConfigEmit = {
  (e: 'update:value', value: EtcdSnapshotConfigValue): void;
  (e: 's3-backup-changed', value: boolean): void;
  (e: 'validation-changed', value: boolean): void;
};

/**
 * State and handlers for an etcd snapshot (backup) form. Never mutates `props.value`: every change emits a new etcd
 * object via `update:value`.
 *
 * Emits `validation-changed` straight away and whenever the form's validity changes. The form is valid when snapshots
 * are disabled, or when the cron schedule is empty or valid and, with S3 backups on, the S3 config reported valid via
 * `s3ValidationChanged`. Nothing is validated in view mode.
 */
export function useEtcdSnapshotConfig(props: EtcdSnapshotConfigProps, emit: EtcdSnapshotConfigEmit) {
  const store = useStore();
  const { t } = useI18n(store);

  const etcd = computed<EtcdSnapshotConfigValue>(() => props.value || {});
  const snapshotsEnabled = computed(() => etcd.value.disableSnapshots !== true);

  const disableSnapshotsOptions = computed(() => [
    { value: true, label: t('generic.disable') },
    { value: false, label: t('generic.enable') },
  ]);
  const s3BackupOptions = computed(() => [
    { value: false, label: t('generic.disable') },
    { value: true, label: t('generic.enable') },
  ]);

  const cronScheduleRules = computed<((schedule?: string) => string | undefined)[]>(() => (props.mode === _VIEW ? [] : [
    (schedule?: string) => (schedule && !isValidCronSchedule(schedule) ? t('cluster.rke2.etcd.snapshotScheduleCron.validationError') : undefined),
  ]));
  const s3ConfigValid = ref(true);
  const snapshotConfigValid = computed(() => {
    if (!snapshotsEnabled.value) {
      return true;
    }

    const cronScheduleValid = cronScheduleRules.value.every((rule) => !rule(etcd.value.snapshotScheduleCron));

    return cronScheduleValid && (!props.s3Backup || s3ConfigValid.value);
  });

  watch(snapshotConfigValid, (valid) => emit('validation-changed', valid), { immediate: true });

  function update(changes: Partial<EtcdSnapshotConfigValue>) {
    emit('update:value', { ...etcd.value, ...changes });
  }

  function s3BackupChanged(enabled: boolean) {
    // Keep any existing s3 config when (re)enabling, otherwise editing a cluster with s3 defined would clear it
    update({ s3: enabled ? (isEmpty(etcd.value.s3) ? {} : etcd.value.s3) : null });
    if (enabled && !props.s3Backup) {
      s3ConfigValid.value = false;
    }
    emit('s3-backup-changed', enabled);
  }

  function disableSnapshotsChanged(disableSnapshots: boolean) {
    if (disableSnapshots) {
      update({ disableSnapshots, s3: null });
      emit('s3-backup-changed', false);
    } else {
      update({ disableSnapshots });
    }
  }

  function s3ValidationChanged(valid: boolean) {
    s3ConfigValid.value = valid;
  }

  return {
    etcd,
    snapshotsEnabled,
    disableSnapshotsOptions,
    s3BackupOptions,
    cronScheduleRules,
    update,
    s3BackupChanged,
    disableSnapshotsChanged,
    s3ValidationChanged,
  };
}
