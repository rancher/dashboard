
<script>
import { FLEET } from '@shell/config/types';
import { NAME } from '@shell/config/product/fleet';
export default {
  name: 'NoWorkspaces',

  props: {
    canView: {
      type:    Boolean,
      default: false,
    },
  },
  data() {
    const formRoute = {
      name:   `c-cluster-product-resource-create`,
      params: { resource: FLEET.WORKSPACE, product: NAME }
    };

    return { hasWorkspaces: false, formRoute };
  },
};
</script>
<template>
  <div class="intro-box">
    <i class="icon icon-repository" />
    <div class="title">
      <span v-html="t('fleet.gitRepo.repo.noWorkspaces', null, true)" />
    </div>
    <div
      v-if="canView"
      class="actions"
    >
      <n-link
        :to="formRoute"
        class="btn role-secondary"
      >
        {{ t('fleet.gitRepo.workspace.addWorkspace') }}
      </n-link>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.intro-box {
  height: calc(100vh - var(--header-height)*2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.title {
  margin-bottom: 15px;
  font-size: $font-size-h2;
  text-align: center;
  max-width: 600px;
}
.icon-repository {
  font-size: 96px;
  margin-bottom: 32px;
}
</style>
