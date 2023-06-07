<script>
import GlobalAuditLog from '@pkg/components/GlobalAuditLog.vue';
import InstallView from '@pkg/components/InstallView.vue';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  name: 'GlobalAuditLogPage',
  data() {
    const auditLogSetting = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.AUDIT_LOG_SERVER_URL);

    return { auditLogSetting };
  },
  computed: {
    auditLogServiceAddress() {
      return this.auditLogSetting?.value;
    }
  },
  components: { GlobalAuditLog, InstallView }
};
</script>
<template>
  <div
    class="global-audit-log-view"
  >
    <GlobalAuditLog
      v-if="auditLogServiceAddress"
      :server-address="auditLogServiceAddress"
    />
    <InstallView
      v-else
      :audit-log-setting="auditLogSetting"
    />
  </div>
</template>
<style scoped>
.global-audit-log-view {
  position: relative;
}
</style>
