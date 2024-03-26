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
      <span v-clean-html="t('authConfig.associatedWarning', tArgs, true)" />
    </Banner>
  </div>
</template>
