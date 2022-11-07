<script>
import EmbeddedPageView from '@shell/components/EmberPageView';

export default {
  components: { EmbeddedPageView },

  data() {
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
      }
    };
  }
};
</script>

<template>
  <EmbeddedPageView :pages="PAGES" />
</template>
