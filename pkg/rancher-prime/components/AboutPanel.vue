<script>
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({ theme: 'prefs/theme' }),

    logo() {
      const darkTheme = this.theme === 'dark';
      const logo = darkTheme ? require('../assets/logo_dark.svg') : require('../assets/logo_light.svg');

      return logo;
    }
  }
};
</script>
<template>
  <div
    data-testid="rancher-prime-about-panel"
    class="about-prime"
  >
    <img :src="logo">
    <div class="prime-info">
      <i class="prime-install icon icon-checkmark" />
      <p>{{ t('prime.installed') }}</p>
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .about-prime {
    margin-bottom: 40px;

    img {
      height: 32px;
    }

    .prime-info {
      align-items: center;
      display: flex;
      margin-left: 70px;
      margin-top: 10px;

      .prime-install {
        color: var(--success);
        font-weight: 600;
        margin-right: 10px;
      }
    }
  }
</style>
