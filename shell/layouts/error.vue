<script>
import Brand from '@shell/mixins/brand';

export default {
  name:   'NuxtError',
  mixins:     [Brand],
  props:  {
    error: {
      type:    Object,
      default: null
    }
  },

  data() {
    return { ready: false };
  },

  computed: {
    statusCode() {
      return (this.error && this.error.statusCode) || 599;
    },
    message() {
      return this.error.message || '';
    }
  },

  mounted() {
    // If the page isn't a sub-path of the base url, redirect to it instead of saying not found.
    // For clicking from manager -> explorer -> back, nuxt tries to load /g/clusters and doesn't
    // have a route for that.
    if (this.statusCode === 404 && !this.$route.path?.startsWith(this.$router.options.base) && window._popStateDetected) {
      window.location.href = this.$route.fullPath;

      return;
    }

    this.ready = true;
  },

  head() {
    return {
      title: this.message,
      meta:  [
        {
          name:    'viewport',
          content: 'width=device-width,initial-scale=1.0,minimum-scale=1.0'
        }
      ]
    };
  }
};
</script>

<template>
  <div v-if="ready" class="wrapper">
    <div class="error">
      <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" fill="#DBE1EC" viewBox="0 0 48 48">
        <path d="M22 30h4v4h-4zm0-16h4v12h-4zm1.99-10C12.94 4 4 12.95 4 24s8.94 20 19.99 20S44 35.05 44 24 35.04 4 23.99 4zM24 40c-8.84 0-16-7.16-16-16S15.16 8 24 8s16 7.16 16 16-7.16 16-16 16z" />
      </svg>

      <div class="title">
        {{ message }}
      </div>

      <p v-if="statusCode === 404" class="description">
        <a v-if="typeof $route === 'undefined'" class="error-link" href="/">Back to Home</a>
        <n-link v-else class="error-link" to="/">
          Back to Home
        </n-link>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  padding: 1rem;
  background: #F7F8FB;
  color: #47494E;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-family: sans-serif;
  font-weight: 100 !important;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;

  .error {
    max-width: 450px;
  }

  .title {
    font-size: 1.5rem;
    margin-top: 15px;
    color: #47494E;
    margin-bottom: 8px;
  }

  .description {
    color: #7F828B;
    line-height: 21px;
    margin-bottom: 10px;
  }

  a {
    color: #7F828B !important;
    text-decoration: none;
  }
}
</style>
