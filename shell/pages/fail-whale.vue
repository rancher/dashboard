<script>
import BrandImage from '@shell/components/BrandImage';
import { mapGetters, mapState } from 'vuex';
import { stringify } from '@shell/utils/error';
import Header from '@shell/components/nav/Header';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import GrowlManager from '@shell/components/GrowlManager';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';
import PromptModal from '@shell/components/PromptModal';

export default {

  components: {
    BrandImage, FixedBanner, GrowlManager, Header, PromptModal
  },
  mixins: [Brand, BrowserTabVisibility],

  data() {
    const store = this.$store;

    if (!store.state.error && !store.state.cameFromError) {
      store.commit('cameFromError');
      this.$router.replace('/');
    }

    return {
      previousRoute: '',
      styles:        { '--custom-content': `'${ this.t('nav.failWhale.separator') }'` }
    };
  },

  computed: {
    ...mapState(['error']),
    ...mapGetters(['isSingleProduct']),
    ...mapState(['managementReady']),
    ...mapGetters(['showTopLevelMenu']),

    home() {
      if (this.isSingleProduct?.afterLoginRoute) {
        return this.$router.resolve(this.isSingleProduct.afterLoginRoute).href;
      }

      return this.$router.resolve({ name: 'home' }).href;
    },

    displayError() {
      return this.error?.data ? this.error.data : stringify(this.error);
    },
  },

  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.previousRoute = from;
    });
  },
};
</script>

<template>
  <div class="dashboard-root">
    <FixedBanner :header="true" />
    <PromptModal />
    <div
      class="dashboard-content"
      :class="{'dashboard-padding-left': showTopLevelMenu}"
    >
      <Header
        v-if="managementReady"
        :simple="true"
      />

      <main class="main-layout">
        <div
          v-if="error"
          class="outlet"
        >
          <main class="main-layout error">
            <div class="text-center">
              <BrandImage
                file-name="error-desert-landscape.svg"
                width="900"
                height="300"
              />
              <h1 v-if="error.status">
                HTTP Error {{ error.status }}: {{ error.statusText }}
              </h1>
              <h1 v-else>
                Error
              </h1>
              <h2
                v-if="error"
                class="text-secondary mt-20"
              >
                {{ displayError }}
              </h2>
              <p class="mt-20">
                <a
                  :href="home"
                  class="btn role-primary"
                >
                  {{ t('nav.home') }}
                </a>
              </p>
              <hr
                class="custom-content"
                :style="styles"
              >
              <p class="mt-20">
                <a
                  class="btn role-secondary"
                  @click="$router.push(previousRoute.fullPath)"
                >
                  {{ t('nav.failWhale.reload') }}
                </a>
              </p>
            </div>
          </main>
        </div>
      </main>
    </div>
    <FixedBanner :footer="true" />
    <GrowlManager />
  </div>
</template>

<style lang="scss" scoped>
  .error {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: center;
    overflow: hidden;

    .row {
      align-items: center;
    }

    h1 {
      font-size: 5rem;
    }

    .desert-landscape {
      img {
        max-width: 100%;
      }
    }
  }

  .custom-content {
    text-align: center;
    margin-top: 18px;
    margin-bottom: 18px;
    max-width: 450px;

    &::after {
      background: var(--body-bg);
      color: var(--body-text);
      content: var(--custom-content);
      padding: 0 12px;
      position: relative;
      top: -12px;
    }
  }

  .dashboard-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .dashboard-content {
    display: grid;
    flex-grow:1;

    grid-template-areas:
      "header"
      "main";

    grid-template-columns: auto;
    grid-template-rows:    var(--header-height) auto;

    > HEADER {
      grid-area: header;
    }
  }

  MAIN {
    grid-area: main;
    overflow: auto;

    .outlet {
      min-height: 100%;
      padding: 0;
    }
  }
</style>
