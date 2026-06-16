<script lang="ts">
import { defineComponent } from 'vue';
import { Banner } from '@components/Banner';

export default defineComponent({
  name: 'AuthProviderWarningBanners',

  components: { Banner },

  props: {
    tArgs: {
      type:     Object,
      required: true,
      default:  () => { },
    }
  }
});
</script>

<template>
  <div>
    <Banner
      :label="t('authConfig.stateBanner.disabled', tArgs)"
      color="warning"
      data-testid="auth-provider-disabled-warning-banner"
    />
    <Banner
      color="warning"
      data-testid="auth-provider-admin-permissions-warning-banner"
    >
      <span class="banner-content">
        <span v-clean-html="t('authConfig.associatedWarning', tArgs, true)" />
        <slot name="additional-warning">
          <!--Empty slot content-->
        </slot>
      </span>
    </Banner>
  </div>
</template>

<style lang="scss" scoped>
.banner-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
