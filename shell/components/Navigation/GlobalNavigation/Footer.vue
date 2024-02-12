<script>
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { isRancherPrime } from '@shell/config/version';

export default {
  props: {
    open: {
      type:     Boolean,
      required: true
    }
  },
  computed: {
    canEditSettings() {
      return (this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING)?.resourceMethods || []).includes('PUT');
    },

    hasSupport() {
      return isRancherPrime() || this.$store.getters['management/byId'](MANAGEMENT.SETTING, SETTING.SUPPORTED )?.value === 'true';
    },
  }
};
</script>
<template>
  <div
    class="footer"
    :class="{closed: !open}"
  >
    <div
      v-if="canEditSettings"
      class="support"
    >
      <nuxt-link
        :to="{name: 'support'}"
      >
        {{ t('nav.support', {hasSupport}) }}
      </nuxt-link>
    </div>
    <div
      class="version"
    >
      <nuxt-link
        :to="{ name: 'about' }"
      >
        {{ t('about.title') }}
      </nuxt-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  margin: 20px;
  width: 240px;
  display: flex;
  flex: 0;
  flex-direction: row;
  > * {
    flex: 1;
    color: var(--link);

    &:first-child {
      text-align: left;
    }
    &:last-child {
      text-align: right;
    }
    text-align: center;
  }

  .version {
    cursor: pointer;
  }

  &.closed {
    margin: 20px 15px;

    .support {
      display: none;
    }

    .version{
      text-align: left;
    }
  }
}
</style>
