<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <PageHeader>
      <template #title>
        {{ t('harborConfig.title') }}
      </template>
    </PageHeader>
    <AdminConfig v-if="isAdmin" />
    <UserConfig v-else />
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
import UserConfig from '@pkg/image-repo/components/UserConfig.vue';
import Loading from '@shell/components/Loading';
import { MANAGEMENT } from '@shell/config/types';
import { mapGetters } from 'vuex';

export default {
  async fetch() {
    this.settings = await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.SETTING });
  },
  components: {
    PageHeader, AdminConfig, UserConfig, Loading
  },
  data() {
    return { settings: null };
  },
  computed: { ...mapGetters({ isAdmin: 'auth/isAdmin' }) }
};
</script>
