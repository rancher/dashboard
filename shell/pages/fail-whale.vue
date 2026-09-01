<script>
import FailWhale from '@shell/components/FailWhale';
import { mapGetters, mapState } from 'vuex';
import Header from '@shell/components/nav/Header';
import Brand from '@shell/mixins/brand';
import FixedBanner from '@shell/components/FixedBanner';
import GrowlManager from '@shell/components/GrowlManager';
import BrowserTabVisibility from '@shell/mixins/browser-tab-visibility';
import PromptModal from '@shell/components/PromptModal';
import { RcButton } from '@components/RcButton';
import { RcSeparator } from '@components/RcSeparator';

export default {

  components: {
    FailWhale, FixedBanner, GrowlManager, Header, PromptModal, RcButton, RcSeparator
  },
  mixins: [Brand, BrowserTabVisibility],

  data() {
    return {
      previousRoute: '',
      styles:        { '--custom-content': `'${ this.t('nav.failWhale.separator') }'` }
    };
  },

  created() {
    const store = this.$store;

    if (!store.state.error && !store.state.cameFromError) {
      store.commit('cameFromError');
      this.$router.replace('/');
    }
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
    <rc-button
      size="large"
      class="skip-to-content"
      :to="{ hash: '#main-content' }"
    >
      {{ t('nav.skipToContent') }}
    </rc-button>
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

      <main
        id="main-content"
        class="main-layout"
        aria-label="Fail whale layout"
        tabindex="-1"
      >
        <div
          v-if="error"
          class="outlet"
        >
          <FailWhale :error="error">
            <template #actions>
              <p class="mt-20">
                <rc-button
                  size="large"
                  :href="home"
                >
                  {{ t('nav.home') }}
                </rc-button>
              </p>
              <RcSeparator
                class="custom-content"
                :style="styles"
              />
              <p class="mt-20">
                <rc-button
                  size="large"
                  variant="secondary"
                  @click="$router.push(previousRoute.fullPath)"
                >
                  {{ t('nav.failWhale.reload') }}
                </rc-button>
              </p>
            </template>
          </FailWhale>
        </div>
      </main>
    </div>
    <FixedBanner :footer="true" />
    <GrowlManager />
  </div>
</template>

<style lang="scss" scoped>
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

  .skip-to-content {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    transform: translateY(-100%);

    &:focus {
      transform: translate(1rem, 1rem);
    }
  }
</style>
