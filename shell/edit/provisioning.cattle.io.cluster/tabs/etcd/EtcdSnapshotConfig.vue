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
import { LabeledInput } from '@components/Form/LabeledInput';
import { RadioGroup } from '@components/Form/Radio';
import UnitInput from '@shell/components/form/UnitInput.vue';
import S3Config from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/S3Config.vue';
import { useEtcdSnapshotConfig } from '@shell/composables/useEtcdSnapshotConfig';
import type { EtcdSnapshotConfigValue, EtcdSnapshotS3 } from '@shell/composables/useEtcdSnapshotConfig';

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

const {
  etcd,
  snapshotsEnabled,
  disableSnapshotsOptions,
  s3BackupOptions,
  cronScheduleRules,
  update,
  s3BackupChanged,
  disableSnapshotsChanged,
  s3ValidationChanged,
} = useEtcdSnapshotConfig(props, emit);
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
          :rules="cronScheduleRules"
          :require-dirty="false"
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
        @validationChanged="s3ValidationChanged"
      />
    </template>
  </div>
</template>
