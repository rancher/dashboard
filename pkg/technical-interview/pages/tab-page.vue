<script lang="ts">
import Vue from 'vue';

// shared components
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';

// components
import Tab1 from '../components/tab-1.vue';
import Tab2 from '../components/tab-2.vue';
import Tab3 from '../components/tab-3.vue';
import Tab4 from '../components/tab-4.vue';

interface Data {}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    Tabbed, Tab, Tab1, Tab2, Tab3, Tab4
  },

  layout: 'plain',

  data() {
    return {};
  },

  computed: {},

  methods: {},
});
</script>

<template>
  <div>
    <h1>{{ t("interview.tabPage.title") }}</h1>

    <Tabbed>
      <Tab
        label="Counter"
        name="tab1"
        :weight="4"
      >
        <Tab-1 />
      </Tab>
      <Tab
        label="Compare time"
        name="tab2"
        :weight="3"
      >
        <Tab-2 />
      </Tab>
      <Tab
        label="JSON swap values"
        name="tab3"
        :weight="2"
      >
        <Tab-3 />
      </Tab>
      <Tab
        label="Check palindrome"
        name="tab4"
        :weight="1"
      >
        <Tab-4 />
      </Tab>
    </Tabbed>
  </div>
</template>
