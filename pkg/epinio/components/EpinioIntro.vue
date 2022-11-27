<script>
import { EPINIO_TYPES } from '@/pkg/epinio/types';
import { createEpinioRoute } from '@/pkg/epinio/utils/custom-routing';

export default {

  name: 'EpinioIntro',

  data() {
    return {
      getStartedLink: createEpinioRoute(`c-cluster-resource`, {
        cluster:  this.$store.getters['clusterId'],
        resource: EPINIO_TYPES.NAMESPACE,
      })
    };
  },
};
</script>
<template>
  <div class="epinio-intro">
    <i class="icon-epinio mb-30" />
    <h1>{{ t('epinio.intro.welcome') }}</h1>
    <p class="mb-30">
      <span>{{ t('epinio.intro.blurb') }}</span>
      <a
        :href="t('epinio.intro.learnMoreLink')"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        {{ t('epinio.intro.learnMore') }} <i class="icon icon-external-link" />
      </a>
    </p>
    <h3 class="mb-30">
      {{ t('epinio.intro.noNamespaces', null, true) }}
    </h3>
    <n-link
      :to="getStartedLink"
      class="btn role-secondary"
    >
      {{ t('epinio.intro.getStarted') }}
    </n-link>
  </div>
</template>
<style lang="scss" scoped>
.epinio-intro {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 100%;

  .icon-epinio {
    font-size: 100px;
  }

  > p > span {
    color: var(--disabled-text);
  }
}
</style>
