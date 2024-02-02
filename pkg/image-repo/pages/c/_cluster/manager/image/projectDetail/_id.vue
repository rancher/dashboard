<template>
  <VersionSwitchLayout>
    <PageHeader>
      <template #title>
        {{ t('harborConfig.image') }}
      </template>
    </PageHeader>
    <template #default="{apiRequest}">
      <ProjectDetailV1
        :project-id="projectId"
        :api-request="apiRequest"
      />
    </template>
    <template #v2="{apiRequest}">
      <ProjectDetailV2
        :project-id="projectId"
        :api-request="apiRequest"
      />
    </template>
  </VersionSwitchLayout>
</template>

<script>
import PageHeader from '@pkg/image-repo/components/PageHeader.vue';
import VersionSwitchLayout from '@pkg/image-repo/components/VersionSwitchLayout.vue';
import ProjectDetailV2 from '@pkg/image-repo/components/ProjectDetailV2.vue';
import ProjectDetailV1 from '@pkg/image-repo/components/ProjectDetailV1.vue';

export default {
  data() {
    return { projectId: parseInt(this?.$route?.params?.id, 10) };
  },
  components: {
    PageHeader,
    VersionSwitchLayout,
    ProjectDetailV2,
    ProjectDetailV1
  }
};
</script>
