<script>
import { capitalize } from 'lodash';

export default {
  props: {
    /**
     * The cluster for info
     */
    cluster: {
      type:     Object,
      required: true,
    },
    /**
     * The node pools belonging to this cluster.
     * Node pools gives us the node template id use to launch the node pool
     */
    nodePools: {
      type:     Array,
      default:  () => [],
    },
    /**
     * The node templates used to launch node pools for this cluster.
     * Node Templates give us the provider name if the cluster is RKE based.
     */
    nodeTemplates: {
      type:     Array,
      default:  () => [],
    },
  },

  computed: {
    displayProvider() {
      const cluster = this.cluster;
      const driver = cluster.status?.driver.toLowerCase();
      const customShortLabel = this.$store.getters['i18n/t']('cluster.provider.rancherkubernetesengine.shortLabel');

      if (driver && this.$store.getters['i18n/exists'](`cluster.provider.${ driver }.shortLabel`)) {
        if (driver === 'rancherkubernetesengine') {
          const pools = this.nodePools;
          const firstNodePool = pools[0];

          if (firstNodePool) {
            const nodeTemplateId = firstNodePool?.spec?.nodeTemplateName;
            const normalizedId = nodeTemplateId.split(':').join('/');
            const nodeTemplate = this.nodeTemplates.find(nt => nt.id === normalizedId);
            const nodeDriver = nodeTemplate?.spec?.driver || null;

            if (nodeDriver) {
              if (this.$store.getters['i18n/exists'](`cluster.nodeDriver.displayName.${ nodeDriver.toLowerCase() }`)) {
                return this.$store.getters['i18n/t'](`cluster.nodeDriver.displayName.${ nodeDriver.toLowerCase() }`);
              } else if (nodeTemplate?.spec?.diver) {
                return capitalize( nodeTemplate.spec.driver );
              }

              return customShortLabel;
            } else {
              // things are not good if we get here
              return customShortLabel;
            }
          }
        }

        return this.$store.getters['i18n/t'](`cluster.provider.${ driver }.shortLabel`);
      } else if (driver) {
        return capitalize(driver);
      } else {
        return this.$store.getters['i18n/t']('cluster.provider.imported.shortLabel');
      }
    },
  },
};
</script>

<template>
  <span>
    {{ displayProvider }}
  </span>
</template>
