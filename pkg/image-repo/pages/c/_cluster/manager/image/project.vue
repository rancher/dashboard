<template>
  <VersionSwitchLayout>
    <PageHeader>
      <template #title>
        {{ t('harborConfig.image') }}
      </template>
    </PageHeader>
    <template #default="{apiRequest}">
      <ProjectV1 :api-request="apiRequest" />
    </template>
    <template #v2="{apiRequest}">
      <ProjectV2 :api-request="apiRequest" />
    </template>
  </VersionSwitchLayout>
</template>

<script>
import PageHeader from '@pkg/image-repo/components/PageHeader.vue';
import VersionSwitchLayout from '@pkg/image-repo/components/VersionSwitchLayout.vue';
import ProjectV1 from '@pkg/image-repo/components/ProjectV1.vue';
import ProjectV2 from '@pkg/image-repo/components/ProjectV2.vue';

export default {
  components: {
    PageHeader,
    VersionSwitchLayout,
    ProjectV1,
    ProjectV2
  }
};
</script>
