<script>
import CountBox from '@/components/CountBox';
import { FLEET } from '@/config/types';

export default {
  name: 'DetailWorkspace',

  components: { CountBox },

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  computed: {
    clustersLabel() {
      return this.t(`typeLabel."${ FLEET.CLUSTER }"`, { count: this.value.counts.cluster });
    },
    clusterGroupsLabel() {
      return this.t(`typeLabel."${ FLEET.CLUSTER_GROUP }"`, { count: this.value.counts.clusterGroup });
    },
    gitRepoLabel() {
      return this.t(`typeLabel."${ FLEET.GIT_REPO }"`, { count: this.value.counts.gitRepo });
    }
  }
};
</script>

<template>
  <div class="mt-20">
    <div class="row">
      <div class="col span-4">
        <CountBox :count="value.counts.gitRepos" :name="gitRepoLabel" :primary-color-var="'--sizzle-3'" />
      </div>
      <div class="col span-4">
        <CountBox :count="value.counts.clusters" :name="clustersLabel" :primary-color-var="'--sizzle-1'" />
      </div>
      <div class="col span-4">
        <CountBox :count="value.counts.clusterGroups" :name="clusterGroupsLabel" :primary-color-var="'--sizzle-2'" />
      </div>
    </div>
  </div>
</template>
