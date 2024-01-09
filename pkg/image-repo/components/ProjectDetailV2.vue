<template>
  <div class="project">
    <div class="title">
      {{ project?.name }}
    </div>
    <Tab
      :tabs="tabs"
    >
      <template v-slot:summary>
        <Summary
          :loading="loading"
          :apiRequest="apiRequest"
          :project="project"
        />
      </template>
      <template v-slot:image>
        <ImageStore
          :loading="loading"
          :apiRequest="apiRequest"
          :project="project"
        />
      </template>
      <template v-slot:member>
        <Member
          :loading="loading"
          :apiRequest="apiRequest"
          :project="project"
        />
      </template>
      <template v-slot:tag>
        <div>tag</div>
      </template>
      <template v-slot:log>
        <div>log</div>
      </template>
      <template v-slot:access>
        <div>access</div>
      </template>
    </Tab>
  </div>
</template>

<script>
import Tab from '@pkg/image-repo/components/tab/Tab.vue';
import Summary from '@pkg/image-repo/components/v2/Summary.vue';
import ImageStore from '@pkg/image-repo/components/v2/ImageStore.vue';
import Member from '@pkg/image-repo/components/v2/Member.vue';

export default {
  components: {
    Tab,
    Summary,
    ImageStore,
    Member
  },
  props: {
    apiRequest: {
      type:     Object,
      required: true
    },
    projectId: {
      type:     String,
      required: true
    },
  },
  async fetch() {
    this.loading = true;
    try {
      const project = await this.apiRequest.getProjectDetail(this.projectId);

      this.project = project;
      this.loading = false;
    } catch (e) {
      this.loading = false;
    }
  },
  data() {
    return {
      loading: false,
      project: {},
      tabs:    [
        {
          label: 'Summary',
          name:  'summary'
        },
        {
          label: 'Image Store',
          name:  'image'
        },
        {
          label: 'Member',
          name:  'member'
        },
        {
          label: 'Tag',
          name:  'tag'
        },
        {
          label: 'Log',
          name:  'log'
        },
        {
          label: 'Access Level',
          name:  'access'
        },
      ]
    };
  }
};
</script>
<style lang="scss" scoped>
  .project {
    .title {
      padding: 10px;
      font-size: 1.5em;
    }
  }
</style>
