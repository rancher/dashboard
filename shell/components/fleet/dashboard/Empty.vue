
<script>
export default {
  name: 'FleetDashboardEmpty',

  props: {
    permissions: {
      type:     Object,
      required: true
    },
  },

  data() {
    return { getStartedLink: { name: 'c-cluster-fleet-application-create' } };
  }
};
</script>
<template>
  <div
    class="fleet-empty-dashboard"
    aria-hidden="true"
    :data-testid="'fleet-empty-dashboard'"
  >
    <i class="icon-fleet mb-30" />
    <h1>{{ t('fleet.dashboard.welcome') }}</h1>
    <p class="mb-30">
      <span>{{ t('fleet.dashboard.gitOpsScale') }}</span>
      <a
        :href="t('fleet.dashboard.learnMoreLink')"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        {{ t('fleet.dashboard.learnMore') }} <i class="icon icon-external-link" />
      </a>
      <span class="sr-only">{{ t('generic.opensInNewTab') }}</span>
    </p>
    <template v-if="permissions.gitRepos || permissions.helmOps">
      <h3 class="mb-30">
        {{ t('fleet.dashboard.noApplications', null, true) }}
      </h3>
      <router-link
        :to="getStartedLink"
        class="btn role-secondary"
      >
        {{ t('fleet.dashboard.getStarted') }}
      </router-link>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  .fleet-empty-dashboard {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    min-height: 100%;

    .icon-fleet {
      font-size: 100px;
      color: var(--disabled-text);
    }

    > p > span {
      color: var(--disabled-text);
    }

    .sr-only {
      visibility: hidden;
    }
  }
</style>
