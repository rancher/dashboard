<script>
import InfoBox from '@/components/InfoBox';
import GatekeeperViolationsTable from '@/components/chart/gatekeeper/ViolationsTable';

export default {
  components: {
    GatekeeperViolationsTable,
    InfoBox
  },
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
