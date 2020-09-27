<script>
import { mapGetters } from 'vuex';

import InstallRedirect from '@/utils/install-redirect';

import { NAME, CHART_NAME } from '@/config/product/longhorn';

import LazyImage from '@/components/LazyImage';

export default {
  components: { LazyImage },

  middleware: InstallRedirect(NAME, CHART_NAME),

  data() {
    return {
      externalLinks:  [],
      longhornImgSrc: require('~/assets/images/longhorn.svg'),
    };
  },

  computed: { ...mapGetters(['currentCluster']) },

  mounted() {
    this.externalLinks = [
      {
        enabled: true,
        iconSrc: this.longhornImgSrc,
        label:   'longhorn.overview.linkedList.longhorn.label',
        link:    `/k8s/clusters/${ this.currentCluster.id }/api/v1/namespaces/longhorn-system/services/http:longhorn-frontend:80/proxy/`
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
            <LazyImage class="round-image" :src="fel.iconSrc" />
          </div>
          <div class="link-content">
            <t :k="fel.label" />
            <i class="icon icon-external-link pull-right" />
          </div>
        </a>
      </div>
    </div>
  </section>
</template>

<style lang="scss">
.links {
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  .link-container {
    background-color: var(--input-bg);
    border-radius: var(--border-radius);
    border: solid 1px var(--input-border);
    display: flex;
    flex-basis: 40%;
    margin: 0 10px 10px 0;
    max-width: 325px;
    min-height: 100px;

    a[disabled] {
      cursor: not-allowed;
      background-color: var(---disabled-bg);
    }

    &:hover {
      box-shadow: 0px 0px 1px var(--outline-width) var(--outline);
    }

    > a {
      align-items: center;
      display: flex;
      flex: 1 0;
      padding: 10px;

      .link-logo,
      .link-content {
        display: inline-block;
      }

      .link-content {
        width: 100%;
      }
    }

    .round-image {
      border-radius: 50%;
      height: 50px;
      margin: 10px;
      min-width: 50px;
      overflow: hidden;
    }
  }
}
</style>
