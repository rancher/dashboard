<template>
  <VersionSwitchLayout>
    <PageHeader>
      <template #title>
        {{ t('harborConfig.image') }}
      </template>
    </PageHeader>
    <template #default="{apiRequest}">
      <ProjectDetailV1 :api-request="apiRequest" />
    </template>
    <template #v2="{apiRequest}">
      <ProjectDetailV2 :api-request="apiRequest" />
    </template>
  </VersionSwitchLayout>
</template>

<script>
import PageHeader from '@pkg/image-repo/components/PageHeader.vue';
import VersionSwitchLayout from '@pkg/image-repo/components/VersionSwitchLayout.vue';
import ProjectDetailV2 from '@pkg/image-repo/components/ProjectDetailV2.vue';
import ProjectDetailV1 from '@pkg/image-repo/components/ProjectDetailV1.vue';

export default {
  async asyncData({ route, req, store }) {
    console.log(route);
    console.log(req);
    console.log(store);

    return {};
  },
  components: {
    PageHeader,
    VersionSwitchLayout,
    ProjectDetailV2,
    ProjectDetailV1
  }
};
</script>
