<script>
import EmberPage from '@shell/components/EmberPage';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { project } from '@shell/store/type-map';

const PAGES = {
  pipelines:     'pipeline/pipelines',
  configuration: 'pipeline',
};

export default {
  components: {
    EmberPage,
    Tabbed,
    Tab
  },

  data() {
    return { activeTab: null };
  },

  computed: {
    pipelinesPage() {
      const prj = project(this.$store.getters);

      if (!!prj && this.activeTab) {
        const id = prj.id.replace('/', ':');
        const suffix = PAGES[this.activeTab];

        return `/p/${ id }/${ suffix }`;
      }

      return '';
    }
  },

  methods: {
    tabChanged(tab) {
      this.activeTab = tab.tab.name;
    },

    intercept(target) {
      if (target === 'authenticated.project.pipeline.settings') {
        // User went to the config page from the pipelines page, so change the active tab
        this.$refs.tabs.select('configuration');
      }
    }
  }

};
</script>

<template>
  <div class="pipelines">
    <Tabbed
      ref="tabs"
      :use-hash="false"
      :no-content="true"
      @changed="tabChanged"
    >
      <Tab
        name="pipelines"
        label-key="legacy.pipelines"
        :weight="3"
      />
      <Tab
        name="configuration"
        label-key="legacy.configuration"
        :weight="2"
      />
    </Tabbed>
    <div
      id="legacy-pipelines"
      class="embed-pipelines"
    >
      <EmberPage
        v-if="pipelinesPage"
        inline="legacy-pipelines"
        :src="pipelinesPage"
        :force-inline-reuse="true"
        @before-nav="intercept"
      />
    </div>
  </div>
</template>

<style scoped lang='scss'>
  .pipelines {
    display: flex;

    .embed-pipelines {
      flex: 1;
    }
  }
</style>
