<script>
import Flow from '@/edit/logging.banzaicloud.io.flow';
import { LOGGING } from '@/config/types';
import { NAME, CONFIGURED_PROVIDERS } from '@/config/table-headers';

export default {
  extends: Flow,

  async fetch() {
    this.outputs = await this.$store.dispatch('cluster/findAll', { type: LOGGING.CLUSTER_OUTPUTS }) || [];
  },

  data() {
    this.value.metadata = this.value.metadata || {};
    this.value.metadata.namespace = 'cattle-logging-system';

    return {
      noOutputsBanner: this.t('logging.clusterFlow.noOutputsBanner'),
      tableHeaders:      [
        { ...NAME, labelKey: 'tableHeaders.clusterOutput' },
        CONFIGURED_PROVIDERS
      ],
    };
  }
};
</script>
