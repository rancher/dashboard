<script>
import InfoBox from '@/components/InfoBox';
import GatekeeperViolationsTable from '@/components/gatekeeper/ViolationsTable';
import { NAME, CHART_NAME } from '@/config/product/gatekeeper';
import InstallRedirect from '@/utils/install-redirect';

export default {
  components: {
    GatekeeperViolationsTable,
    InfoBox
  },

  middleware: InstallRedirect(NAME, CHART_NAME),
};
</script>

<template>
  <div>
    <InfoBox>
      <div class="mb-15">
        <h2><t k="gatekeeperIndex.violations" /></h2>
      </div>
      <div>
        <GatekeeperViolationsTable :include-constraint="true" />
      </div>
    </InfoBox>
  </div>
</template>
