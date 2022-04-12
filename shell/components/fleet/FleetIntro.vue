<script>
import { AS, _YAML } from '@shell/config/query-params';

export default {

  name: 'FleetIntro',

  data() {
    const params = { ...this.$route.params };

    const formRoute = { name: `${ this.$route.name }-create`, params };

    const hasEditComponent = this.$store.getters['type-map/hasCustomEdit'](this.resource);

    const yamlRoute = {
      name:  `${ this.$route.name }-create`,
      params,
      query: { [AS]: _YAML },
    };

    return {
      formRoute,
      yamlRoute,
      hasEditComponent,
    };
  },
};
</script>
<template>
  <div class="intro-box">
    <i class="icon icon-repository"></i>
    <div class="title">
      {{ t('fleet.gitRepo.repo.noRepos') }}
    </div>
    <div class="actions">
      <n-link :to="formRoute" class="btn role-secondary">
        {{ t('fleet.gitRepo.repo.addRepo') }}
      </n-link>
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
