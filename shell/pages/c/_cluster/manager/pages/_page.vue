<script>
import EmbeddedPageView from '@shell/components/EmberPageView';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

export default {
  components: { EmbeddedPageView },

  data() {
    const auditLogServerUrl = this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.AUDIT_LOG_SERVER_URL)?.value;

    return {
      PAGES: {
        'rke-drivers':           '/n/drivers/cluster',
        'rke-templates':         '/g/rke-templates/index',
        'cloud-credentials':     '/g/security/cloud-credentials',
        'node-templates':        '/n/node-templates',
        'pod-security-policies': '/g/security/policies',

        'image-repo-config':     '/custom-extension/image-repo/image-router',
        'image-repo-projects':   '/custom-extension/image-repo/projects-router',
        'image-repo-logs':       '/custom-extension/image-repo/logs-router',
        'global-audit-log':      '/custom-extension/audit-log',
        'k8s-cluster-audit-log': `/meta/auditui/${ auditLogServerUrl?.replace('//', '/') }#/k8s-audit-log/${ this.$route.query.cluster }`
      }
    };
  }
};
</script>

<template>
  <EmbeddedPageView :pages="PAGES" />
</template>
