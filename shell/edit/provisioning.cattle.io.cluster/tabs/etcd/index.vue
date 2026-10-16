<script>
import { RadioGroup } from '@components/Form/Radio';
import EtcdSnapshotConfig from '@shell/edit/provisioning.cattle.io.cluster/tabs/etcd/EtcdSnapshotConfig.vue';

export default {
  emits: ['s3-backup-changed', 'config-etcd-expose-metrics-changed', 'etcd-validation-changed'],

  components: {
    RadioGroup,
    EtcdSnapshotConfig
  },

  props: {
    mode: {
      type:     String,
      required: true,
    },

    value: {
      type:     Object,
      required: true,
    },
    selectedVersion: {
      type:     Object,
      required: true,
    },

    s3Backup: {
      type:     Boolean,
      required: false,
      default:  false
    },
    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },

  computed: {
    etcd() {
      return this.value.spec.rkeConfig.etcd;
    },
    argsEtcdExposeMetrics() {
      return !!this.selectedVersion?.serverArgs?.['etcd-expose-metrics'];
    },
    configEtcdExposeMetrics() {
      return !!this.value.spec.rkeConfig.machineGlobalConfig['etcd-expose-metrics'];
    },
  },
  methods: {
    etcdChanged(neu) {
      const rkeConfig = this.value.spec.rkeConfig;

      rkeConfig.etcd = neu;
    }
  }
};
</script>

<template>
  <div>
    <EtcdSnapshotConfig
      :value="etcd"
      :mode="mode"
      :s3-backup="s3Backup"
      :namespace="value.metadata.namespace"
      :register-before-hook="registerBeforeHook"
      @update:value="etcdChanged"
      @s3-backup-changed="$emit('s3-backup-changed', $event)"
      @validation-changed="$emit('etcd-validation-changed', $event)"
    />

    <div class="spacer" />

    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-if="argsEtcdExposeMetrics"
          :value="configEtcdExposeMetrics"
          name="etcd-expose-metrics"
          :options="[false, true]"
          :label="t('cluster.rke2.etcd.exportMetric.label')"
          :labels="[t('cluster.rke2.etcd.exportMetric.false'), t('cluster.rke2.etcd.exportMetric.true')]"
          :mode="mode"
          @update:value="$emit('config-etcd-expose-metrics-changed', $event)"
        />
      </div>
    </div>
  </div>
</template>
