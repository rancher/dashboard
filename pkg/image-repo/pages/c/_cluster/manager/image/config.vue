<template>
  <div>
    <PageHeader>
      <template #title>
        {{ t('harborConfig.title') }}
      </template>
    </PageHeader>
    <h4>{{ t ('harborConfig.access.title') }}</h4>
    <Banner
      color="info"
      :label="t('harborConfig.access.subtitle')"
    />
  </div>
</template>
<script>
import PageHeader from '@pkg/image-repo/components/PageHeader.vue';
import { Banner } from '@components/Banner';

export default { components: { PageHeader, Banner } };
</script>
