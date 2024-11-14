<script>
import { mapGetters } from 'vuex';
import { SERVICE } from '@shell/config/types';
import IconMessage from '@shell/components/IconMessage';
import LazyImage from '@shell/components/LazyImage';
import Loading from '@shell/components/Loading';

export default {
  components: {
    IconMessage, LazyImage, Loading
  },

  async fetch() {
    if ( this.$store.getters['cluster/schemaFor'](SERVICE) ) {
      this.uiServices = await this.$store.dispatch('cluster/findMatching', {
        type:     SERVICE,
        selector: 'app=longhorn-ui'
      });
    }
  },

  data() {
    return {
      longhornImgSrc: require('~shell/assets/images/vendor/longhorn.svg'),
      uiServices:     null
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    externalLinks() {
      if ( this.uiServices && this.uiServices.length === 1 && this.uiServices[0].metadata?.namespace ) {
        return [
          {
            enabled:     true,
            iconSrc:     this.longhornImgSrc,
            label:       'longhorn.overview.linkedList.longhorn.label', // i18n-uses longhorn.overview.linkedList.longhorn.label
            description: 'longhorn.overview.linkedList.longhorn.description', // i18n-uses longhorn.overview.linkedList.longhorn.description
            link:        `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/${ this.uiServices[0].metadata.namespace }/services/http:longhorn-frontend:80/proxy/`
          },
        ];
      }

      return [];
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <section v-else>
    <header class="row">
      <div class="col span-12">
        <h1>
          <t k="longhorn.overview.title" />
        </h1>
        <div>
          <t
            k="longhorn.overview.subtitle"
            :raw="true"
          />
        </div>
      </div>
    </header>
    <div
      v-if="externalLinks && externalLinks.length"
      class="links"
    >
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

    <IconMessage
      v-else
      class="mt-40 mb-20"
      icon="icon-longhorn"
      :vertical="true"
    >
      <template #message>
        <p>
          {{ t('longhorn.overview.linkedList.longhorn.uiServiceUnavailable') }}
        </p>
      </template>
    </IconMessage>
  </section>
</template>
