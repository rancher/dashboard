<script>
import { FLEET } from '@shell/config/types';
import { NAME } from '@shell/config/product/fleet';

export default {

  name: 'FleetIntro',

  data() {
    const gitRepoRoute = {
      name:   'c-cluster-product-resource-create',
      params: {
        product:  NAME,
        resource: FLEET.GIT_REPO
      },
    };

    const gitRepoSchema = this.$store.getters['management/schemaFor'](FLEET.GIT_REPO);
    const canCreateRepos = gitRepoSchema && gitRepoSchema.resourceMethods.includes('PUT');

    return {
      gitRepoRoute,
      canCreateRepos
    };
  },
};
</script>
<template>
  <div class="intro-box">
    <i class="icon icon-repository" />
    <div class="title">
      {{ t('fleet.gitRepo.repo.noRepos') }}
    </div>
    <div
      v-if="canCreateRepos"
      class="actions"
    >
      <router-link
        :to="gitRepoRoute"
        class="btn role-secondary"
      >
        {{ t('fleet.gitRepo.repo.addRepo') }}
      </router-link>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.intro-box {
  flex: 0 0 100%;
  height: calc(100vh - 246px); // 2(48 content header + 20 padding + 55 pageheader)
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.title {
  margin-bottom: 15px;
  font-size: $font-size-h2;
}
.icon-repository {
  font-size: 96px;
  margin-bottom: 32px;
}
</style>
