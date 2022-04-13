<script>
import { mapGetters } from 'vuex';

import InstallRedirect from '@/utils/install-redirect';

import { NAME, CHART_NAME } from '@/config/product/neuvector';

import LazyImage from '@/components/LazyImage';
import Banner from '@/components/Banner';
import { NAMESPACE } from '@/config/types';

const NEUVECTOR_NAMESPACE = 'cattle-neuvector-system';

export default {
  components: { LazyImage, Banner },

  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    let hasNeuVectorNamespace = false;

    const allNamespaces = this.$store.getters[`cluster/all`](NAMESPACE);

    hasNeuVectorNamespace = allNamespaces.filter((namespace) => {
      return namespace.metadata.name === NEUVECTOR_NAMESPACE;
    }).length === 1;

    return {
      externalLinks:         [],
      neuvectorImgSrc:       require('~/assets/images/vendor/neuvector.svg'),
      hasNeuVectorNamespace,
    };
  },

  computed: { ...mapGetters(['currentCluster']) },

  mounted() {
    this.externalLinks = [
      {
        enabled:     true,
        iconSrc:     this.neuvectorImgSrc,
        label:       'neuvector.overview.linkedList.neuvector.label',
        description:   'neuvector.overview.linkedList.neuvector.description',
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/${ NEUVECTOR_NAMESPACE }/services/https:neuvector-service-webui:8443/proxy`
      },
    ];
  }
};
</script>

<template>
  <section>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="neuvector.overview.title" />
        </h1>
        <div>
          <t k="neuvector.overview.subtitle" :raw="true" />
        </div>
      </div>
    </header>
    <Banner v-if="!hasNeuVectorNamespace" color="error" :label="t('neuvector.errors.namespaceError')">
    </Banner>
    <div v-if="hasNeuVectorNamespace" class="links">
      <div v-for="fel in externalLinks" :key="fel.label" class="link-container">
        <a :href="fel.link" target="_blank" rel="noopener noreferrer">
          <div class="link-logo">
            <LazyImage :src="fel.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="fel.label" />
            <i class="icon icon-external-link pull-right" />
            <hr />
            <div class="description"><t :k="fel.description" /></div>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>
