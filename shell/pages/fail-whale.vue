<script>
import BrandImage from '@shell/components/BrandImage';
import { mapState } from 'vuex';
import { stringify } from '@shell/utils/error';
import { getVendor } from '@shell/config/private-label';
import { NAME as HARVESTER } from '@shell/config/product/harvester';

export default {
  layout: 'home',

  components: { BrandImage },

  data() {
    const home = this.$router.resolve({ name: 'home' }).href;
    const store = this.$store;

    if ( process.client && !store.state.error && !store.state.cameFromError) {
      store.commit('cameFromError');
      this.$router.replace('/');
    }

    const isOnlyHarvester = getVendor() === HARVESTER;

    return {
      home:          isOnlyHarvester ? 'c/local/harvester/harvesterhci.io.dashboard' : home,
      previousRoute: '',
      styles:        { '--custom-content': `'${ this.t('nav.failWhale.separator') }'` }
    };
  },

  computed: {
    ...mapState(['error']),

    displayError() {
      return stringify(this.error);
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
  <div v-if="error">
    <main class="error">
      <div class="text-center">
        <BrandImage file-name="error-desert-landscape.svg" width="900" height="300" />
        <h1 v-if="error.status">
          HTTP Error {{ error.status }}: {{ error.statusText }}
        </h1>
        <h1 v-else>
          Error
        </h1>
        <h2 v-if="error" class="text-secondary mt-20">
          {{ displayError }}
        </h2>
        <p class="mt-20">
          <a :href="home" class="btn role-primary">
            {{ t('nav.home') }}
          </a>
        </p>
        <hr class="custom-content" :style="styles">
        <p class="mt-20">
          <a class="btn role-secondary" @click="$router.push(previousRoute.fullPath)">
            {{ t('nav.failWhale.reload') }}
          </a>
        </p>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
  .error {
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
</style>
