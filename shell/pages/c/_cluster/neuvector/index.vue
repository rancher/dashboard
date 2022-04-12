<script>
import { mapGetters } from 'vuex';

import InstallRedirect from '@shell/utils/install-redirect';

import { NAME, CHART_NAME } from '@shell/config/product/neuvector';

import LazyImage from '@shell/components/LazyImage';

export default {
  components: { LazyImage },

  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    return {
      externalLinks:   [],
      neuvectorImgSrc: require('~shell/assets/images/vendor/neuvector.svg'),
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
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/cattle-neuvector-system/services/https:neuvector-service-webui:8443/proxy`
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
    <div class="links">
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
