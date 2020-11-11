<script>
import GatekeeperViolationsTable from '@/components/gatekeeper/ViolationsTable';
import { NAME, CHART_NAME } from '@/config/product/gatekeeper';
import InstallRedirect from '@/utils/install-redirect';
import ChartHeading from '@/components/ChartHeading';
export default {
  components: { ChartHeading, GatekeeperViolationsTable },
  middleware: InstallRedirect(NAME, CHART_NAME),
};
</script>

<template>
  <div>
    <ChartHeading :label="t('gatekeeperIndex.poweredBy')" url="https://github.com/open-policy-agent/gatekeeper" />
    <div class="spacer" />
    <div class="mb-15">
      <h2><t k="gatekeeperIndex.violations" /></h2>
    </div>
    <div>
      <GatekeeperViolationsTable :include-constraint="true" />
    </div>
  </div>
</template>
