<script>
import K8sAuditLog from '@pkg/components/K8sAuditLog.vue';
import InstallView from '@pkg/components/InstallView.vue';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import Loading from '@shell/components/Loading';

export default {
  name: 'K8sAuditLogPage',
  async fetch() {
    const auditLogSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.AUDIT_LOG_SERVER_URL);

    this.auditLogSetting = auditLogSetting;
    const id = this.$route.query.clusterId ?? this.$route.query.cluster;
    const { data: apps } = await this.$store.dispatch('management/request', { url: `/k8s/clusters/${ id === '_' ? 'local' : id }/v1/catalog.cattle.io.apps` });

    this.apps = apps;
  },
  data() {
    return { auditLogSetting: null, apps: [] };
  },
  computed: {
    hideInstallView() {
      return this.auditLogSetting?.value && this.auditLogCollector;
    },
    auditLogCollector() {
      return this.apps.find(app => app.spec?.chart?.metadata?.name === 'rancher-k8s-auditlog-collector');
    },
    auditLogServiceAddress() {
      return this.auditLogSetting?.value;
    }
  },
  components: {
    K8sAuditLog, InstallView, Loading
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <K8sAuditLog
      v-if="hideInstallView"
      :server-address="auditLogServiceAddress"
    />
    <InstallView
      v-else
      :audit-log-setting="auditLogSetting"
      :audit-log-collector="auditLogCollector"
      :k8s-audit-log="true"
      :cluster-id="$route.query.cluster"
    />
  </div>
</template>
<style scoped>

</style>
