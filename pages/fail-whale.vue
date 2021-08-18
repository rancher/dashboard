<script>
import BrandImage from '@/components/BrandImage';
import { mapState } from 'vuex';
import { stringify } from '@/utils/error';

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

    return {
      home,
      previousRoute: ''
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
        <hr>
        <p class="mt-20">
          <a class="btn role-secondary" @click="$router.push(previousRoute.fullPath)">
            {{ t('nav.reload') }}
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

  hr {
    text-align: center;
    margin-top: 18px;
    margin-bottom: 18px;
    max-width: 450px;
  }

  hr:after {
    background: var(--body-bg);
    color: var(--body-text);
    content: 'or';
    padding: 0 12px;
    position: relative;
    top: -12px;
  }

</style>
