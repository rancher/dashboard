<script>
import SimpleBox from '@/components/SimpleBox';
import { AS, _YAML } from '@/config/query-params';

export default {

  name: 'FleetIntro',

  components: { SimpleBox },

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
  <SimpleBox>
    <div class="intro-box">
      <div class="title">
        You don't have repositories connected
      </div>
      <div class="actions">
        <n-link :to="formRoute" class="btn role-secondary">
          {{ t('fleet.gitRepo.repo.addRepo') }}
        </n-link>
      </div>
    </div>
  </SimpleBox>
</template>
<style lang="scss" scoped>
.intro-box {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.title {
  margin-bottom: 15px
}
</style>
