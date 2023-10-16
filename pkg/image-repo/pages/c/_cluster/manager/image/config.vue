<template>
  <div>
    <PageHeader>
      <template #title>
        {{ t('harborConfig.title') }}
      </template>
    </PageHeader>
    <AdminConfig />
    <!-- <h4>{{ t ('harborConfig.access.title') }}</h4>
    <Banner
      color="info"
      :label="t('harborConfig.access.subtitle')"
    /> -->
  </div>
</template>
<script>
import PageHeader from '@pkg/image-repo/components/PageHeader.vue';
import AdminConfig from '@pkg/image-repo/components/AdminConfig.vue';
import { Banner } from '@components/Banner';
import { MANAGEMENT } from '@shell/config/types';

export default {
  async fetch() {
    this.settings = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
  },
  components: {
    PageHeader, Banner, AdminConfig
  },
  data() {
    return { settings: null };
  }
};
</script>
