<script setup lang="ts">
/**
 * etcd snapshot (backup) configuration form.
 *
 * Shared between RKE2/K3s clusters provisioned by Rancher (`spec.rkeConfig.etcd` on provisioning.cattle.io.cluster)
 * and imported RKE2/K3s clusters (`rke2Config.etcd` / `k3sConfig.etcd` on the management/norman cluster), which use the same
 * object shape: `{ disableSnapshots, snapshotScheduleCron, snapshotRetention, s3 }`.
 *
 * The component never mutates `value`, it emits a new etcd object via `update:value` on every change.
 */
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import UnitInput from '@shell/components/form/UnitInput.vue';
import S3Config from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config.vue';
import isEmpty from 'lodash/isEmpty';

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

defineOptions({ name: 'EtcdSnapshotConfig' });

const props = withDefaults(defineProps<{
  mode: string;
  /** The etcd config object. May be empty when the cluster has no etcd config yet (e.g. imported clusters) */
  value?: EtcdSnapshotConfigValue | null;
  /** Whether saving snapshots to S3 is enabled */
  s3Backup?: boolean;
  /** Namespace used when selecting/creating the S3 cloud credential */
  namespace: string;
  registerBeforeHook: Function;
}>(), {
  value:    null,
  s3Backup: false,
});

const emit = defineEmits<{
  'update:value': [value: EtcdSnapshotConfigValue];
  's3-backup-changed': [value: boolean];
  'validation-changed': [value: boolean];
}>();

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

function update(changes: Partial<EtcdSnapshotConfigValue>) {
  emit('update:value', { ...etcd.value, ...changes });
}

function s3BackupChanged(enabled: boolean) {
  // Keep any existing s3 config when (re)enabling, otherwise editing a cluster with s3 defined would clear it
  update({ s3: enabled ? (isEmpty(etcd.value.s3) ? {} : etcd.value.s3) : null });
  emit('s3-backup-changed', enabled);
  emit('validation-changed', !enabled);
}

function disableSnapshotsChanged(disableSnapshots: boolean) {
  if (disableSnapshots) {
    update({ disableSnapshots, s3: null });
    emit('s3-backup-changed', false);
    emit('validation-changed', true);
  } else {
    update({ disableSnapshots });
  }
}
</script>

<template>
  <div class="etcd-snapshot-config">
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          :value="!snapshotsEnabled"
          name="etcd-disable-snapshots"
          data-testid="etcd-disable-snapshots"
          :options="disableSnapshotsOptions"
          :label="t('cluster.rke2.etcd.disableSnapshots.label')"
          :mode="mode"
          @update:value="disableSnapshotsChanged"
        />
      </div>
    </div>
    <div
      v-if="snapshotsEnabled"
      class="row"
    >
      <div class="col span-6">
        <LabeledInput
          :value="etcd.snapshotScheduleCron"
          type="cron"
          placeholder="0 * * * *"
          data-testid="etcd-snapshot-schedule-cron"
          :mode="mode"
          :label="t('cluster.rke2.etcd.snapshotScheduleCron.label')"
          @update:value="(snapshotScheduleCron: string) => update({ snapshotScheduleCron })"
        />
      </div>
      <div class="col span-6">
        <UnitInput
          :value="etcd.snapshotRetention ?? undefined"
          data-testid="etcd-snapshot-retention"
          :mode="mode"
          :label="t('cluster.rke2.etcd.snapshotRetention.label')"
          :suffix="s3Backup ? t('cluster.rke2.snapshots.s3Suffix') : t('cluster.rke2.snapshots.suffix')"
          :tooltip="s3Backup ? t('cluster.rke2.etcd.snapshotRetention.tooltip') : undefined"
          @update:value="(snapshotRetention: number) => update({ snapshotRetention })"
        />
      </div>
    </div>

    <template v-if="snapshotsEnabled">
      <div class="spacer" />

      <RadioGroup
        :value="s3Backup"
        name="etcd-s3"
        data-testid="etcd-s3-backup"
        :options="s3BackupOptions"
        :label="t('cluster.rke2.etcd.s3backups.label')"
        :mode="mode"
        @update:value="s3BackupChanged"
      />

      <S3Config
        v-if="s3Backup"
        :value="etcd.s3 || undefined"
        :local-retention-count="etcd.snapshotRetention ?? undefined"
        :namespace="namespace"
        :register-before-hook="registerBeforeHook"
        :mode="mode"
        @update:value="(s3: EtcdSnapshotS3) => update({ s3 })"
        @validationChanged="(valid: boolean) => emit('validation-changed', valid)"
      />
    </template>
  </div>
</template>
