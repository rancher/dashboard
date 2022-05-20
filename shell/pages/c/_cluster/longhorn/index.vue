<script>
import { mapGetters } from 'vuex';

import InstallRedirect from '@shell/utils/install-redirect';

import { NAME, CHART_NAME } from '@shell/config/product/longhorn';

import LazyImage from '@shell/components/LazyImage';

export default {
  components: { LazyImage },

  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    return {
      externalLinks:  [],
      longhornImgSrc: require('~shell/assets/images/vendor/longhorn.svg'),
    };
  },

  computed: { ...mapGetters(['currentCluster']) },

  mounted() {
    this.externalLinks = [
      {
        enabled:     true,
        iconSrc:     this.longhornImgSrc,
        label:       'longhorn.overview.linkedList.longhorn.label',
        description:   'longhorn.overview.linkedList.longhorn.description',
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/longhorn-system/services/http:longhorn-frontend:80/proxy/`
      },
    ];
  },

  methods: {}
};
</script>

<template>
  <section>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="longhorn.overview.title" />
        </h1>
        <div>
          <t k="longhorn.overview.subtitle" :raw="true" />
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
