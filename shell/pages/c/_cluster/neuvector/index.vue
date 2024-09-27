<script>
import { mapGetters } from 'vuex';
import { NEU_VECTOR_NAMESPACE } from '@shell/config/product/neuvector';

import LazyImage from '@shell/components/LazyImage';
import Loading from '@shell/components/Loading';

export default {
  components: { LazyImage, Loading },

  data() {
    return {
      externalLinks:   [],
      neuvectorImgSrc: require('~shell/assets/images/vendor/neuvector.svg'),
    };
  },

  computed: { ...mapGetters(['currentCluster']) },

  // i18n-uses neuvector.overview.linkedList.neuvector.label, neuvector.overview.linkedList.neuvector.description
  mounted() {
    this.externalLinks = [
      {
        enabled:     true,
        iconSrc:     this.neuvectorImgSrc,
        label:       'neuvector.overview.linkedList.neuvector.label',
        description: 'neuvector.overview.linkedList.neuvector.description',
        link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/${ NEU_VECTOR_NAMESPACE }/services/https:neuvector-service-webui:8443/proxy`
      },
    ];
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="neuvector.overview.title" />
        </h1>
        <div>
          <t
            k="neuvector.overview.subtitle"
            :raw="true"
          />
        </div>
      </div>
    </header>
    <div class="links">
      <div
        v-for="(fel, i) in externalLinks"
        :key="i"
        class="link-container"
      >
        <a
          :href="fel.link"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div class="link-logo">
            <LazyImage :src="fel.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="fel.label" />
            <i class="icon icon-external-link pull-right" />
            <hr>
            <div class="description"><t :k="fel.description" /></div>
          </div>
        </a>
      </div>
    </div>
  </section>
</template>
