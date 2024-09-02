<script>
import { NAME, CHART_NAME } from '@shell/config/product/gatekeeper';
import InstallRedirect from '@shell/utils/install-redirect';
import ChartHeading from '@shell/components/ChartHeading';
import SortableTable from '@shell/components/SortableTable';
import { Banner } from '@components/Banner';
import { CONSTRAINT_VIOLATION_CONSTRAINT_LINK, CONSTRAINT_VIOLATION_COUNT, CONSTRAINT_VIOLATION_TEMPLATE_LINK } from '@shell/config/table-headers';
import { GATEKEEPER } from '@shell/config/types';

export const OPA_GATE_KEEPER_ID = 'cluster/rancher-charts/rancher-gatekeeper';

export default {
  components: {
    ChartHeading, SortableTable, Banner
  },
  middleware: InstallRedirect(NAME, CHART_NAME),
  async fetch() {
    const constraints = this.constraint ? [this.constraint] : await this.$store.dispatch('cluster/findAll', { type: GATEKEEPER.SPOOFED.CONSTRAINT });

    this.violations = constraints
      .map((constraint, i) => ({
        id:             i,
        constraintLink: {
          text: constraint.nameDisplay,
          to:   constraint.detailLocation
        },
        templateLink: {
          text: constraint.kind,
          to:   {
            name:   'c-cluster-product-resource-id',
            params: {
              resource: 'templates.gatekeeper.sh.constrainttemplate', id: constraint.kind.toLowerCase(), product: 'gatekeeper'
            }
          }
        },
        count: constraint.totalViolations
      }));
  },
  data(ctx) {
    return {
      headers: [
        CONSTRAINT_VIOLATION_CONSTRAINT_LINK,
        CONSTRAINT_VIOLATION_TEMPLATE_LINK,
        CONSTRAINT_VIOLATION_COUNT
      ],
      violations: []
    };
  }
};
</script>

<template>
  <div>
    <ChartHeading
      :label="t('gatekeeperIndex.poweredBy')"
      url="https://github.com/open-policy-agent/gatekeeper"
    />
    <Banner color="warning">
      <span v-clean-html="t('gatekeeperIndex.deprecated', {}, true)" />
    </Banner>
    <div class="spacer" />
    <div class="mb-10">
      <h2><t k="gatekeeperIndex.violations" /></h2>
    </div>
    <div>
      <SortableTable
        :headers="headers"
        :rows="violations"
        :search="false"
        :table-actions="false"
        :row-actions="false"
        :paging="true"
        :rows-per-page="10"
        key-field="id"
        group-by="templateLink.text"
      />
    </div>
  </div>
</template>
