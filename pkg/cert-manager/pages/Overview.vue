<script setup lang="ts">
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';

const { t } = useI18n(useStore());
</script>

<template>
  <div>
    <h1>{{ t('certManager.nav.overview') }}</h1>
    <p>{{ t('certManager.overview.notImplemented') }}</p>
  </div>
</template>
