<script lang="ts">
import Vue, { PropType } from 'vue';
import ApplicationCard from '@shell/components/cards/ApplicationCard.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { ExampleResource } from '../types';

interface Data {
}

// Data, Methods, Computed, Props
export default Vue.extend<Data, any, any, any>({
  components: {
    ApplicationCard,
    Tabbed,
    Tab,
  },
  props: {
    value: {
      type:     Object as PropType<ExampleResource>,
      required: true
    },
    initialValue: {
      type:     Object as PropType<ExampleResource>,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },

  data() {
    return {};
  },

});
</script>

<template>
  <div>
    <div class="application-details">
      <ApplicationCard>
        <!-- Icon slot -->
        <template v-slot:cardIcon>
          <i class="icon icon-fw" :class="'icon-linux'"></i>
        </template>

        <!-- Routes links slot -->
        <template v-slot:top-left>
          <h1>This is an example of a custom card</h1>
        </template>

        <template v-slot:top-right>
          Top right info
        </template>

        <!-- Resources count slot -->
        <template v-slot:resourcesCount>
          Main Info
        </template>
      </ApplicationCard>
    </div>

    <h3 class="mt-20">
      {{ t('example.example-resource.detail.tabLabel') }}
    </h3>

    <div>
      <Tabbed>
        <Tab label-key="example.example-resource.detail.tab1.label" name="instances" :weight="3">
          {{ t('example.example-resource.detail.tab1.description') }}
        </Tab>
        <Tab label-key="example.example-resource.detail.tab2.label" name="services" :weight="2">
          {{ t('example.example-resource.detail.tab2.description') }}
        </Tab>
        <Tab label-key="example.example-resource.detail.tab3.label" name="configs" :weight="1">
          {{ t('example.example-resource.detail.tab3.description') }}
        </Tab>
      </Tabbed>
    </div>
  </div>
</template>
