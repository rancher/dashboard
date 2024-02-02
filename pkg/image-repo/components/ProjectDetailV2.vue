<template>
  <div
    v-loading="loading"
    class="project"
  >
    <div class="title">
      {{ project?.name }}
    </div>
    <Tab
      :tabs="tabs"
    >
      <template v-slot:summary>
        <Summary
          :apiRequest="apiRequest"
          :project="project"
        />
      </template>
      <template v-slot:image>
        <ImageStore
          :apiRequest="apiRequest"
          :project="project"
        />
      </template>
      <template v-slot:member>
        <Member
          :apiRequest="apiRequest"
          :project="project"
          :currentUser="currentUser"
          :harborSysntemInfo="harborSysntemInfo"
          @refresh="refresh"
        />
      </template>
      <template v-slot:tag>
        <Labels
          :apiRequest="apiRequest"
          :project="project"
        />
      </template>
      <template v-slot:log>
        <Logs
          :apiRequest="apiRequest"
          :project="project"
        />
      </template>
      <template v-slot:access>
        <Access
          :currentUser="currentUser"
          :apiRequest="apiRequest"
          :project="project"
          @refresh="refresh"
        />
      </template>
    </Tab>
  </div>
</template>

<script>
import Tab from '@pkg/image-repo/components/tab/Tab.vue';
import Summary from '@pkg/image-repo/components/v2/Summary.vue';
import ImageStore from '@pkg/image-repo/components/v2/ImageStore.vue';
import Member from '@pkg/image-repo/components/v2/Member.vue';
import Labels from '@pkg/image-repo/components/v2/Labels.vue';
import Logs from '@pkg/image-repo/components/v2/Log.vue';
import Access from '@pkg/image-repo/components/v2/Access.vue';

export default {
  components: {
    Tab,
    Summary,
    ImageStore,
    Member,
    Labels,
    Logs,
    Access,
  },
  props: {
    apiRequest: {
      type:     Object,
      required: true
    },
    projectId: {
      type:     Number,
      required: true
    },
  },
  async fetch() {
    await this.init();
  },
  data() {
    return {
      loading:           false,
      project:           {},
      currentUser:       {},
      harborSysntemInfo: {},
      tabs:              [
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
  },
  methods: {
    async init() {
      this.loading = true;
      const maxRetries = 3;
      let retries = 0;

      while (retries < maxRetries) {
        try {
          const project = await this.apiRequest.getProjectDetail(this.projectId);

          this.project = project;
          break;
        } catch (e) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      retries = 0;
      while (retries < maxRetries) {
        try {
          const currentUser = await this.apiRequest.fetchCurrentHarborUser();

          this.currentUser = currentUser;
          break;
        } catch (e) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      retries = 0;
      while (retries < maxRetries) {
        try {
          const harborSysntemInfo = await this.apiRequest.fetchSystemInfo();

          if (!harborSysntemInfo.harbor_version) {
            this.harborSysntemInfo = {
              ...harborSysntemInfo,
              supportSummary:          false,
              supportRoleLimitedGuest: false,
              supportRoleMaster:       false
            };
          } else {
            const subPos = harborSysntemInfo.harbor_version.indexOf('-');
            const version = harborSysntemInfo.harbor_version.substring(1, subPos).split('.').map((item) => parseInt(item, 10));

            this.harborSysntemInfo = {
              ...harborSysntemInfo,
              supportSummary:          version[0] > 1 || (version[0] >= 1 && version[1] > 8),
              supportRoleLimitedGuest: version[0] > 1 || (version[0] >= 1 && version[1] > 9),
              supportRoleMaster:       version[0] > 1 || (version[0] >= 1 && version[1] > 7)
            };
          }
          break;
        } catch (e) {
          retries++;
          if (retries === maxRetries) {
            this.loading = false;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      this.loading = false;
    },
    async refresh() {
      await this.init();
    },
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
