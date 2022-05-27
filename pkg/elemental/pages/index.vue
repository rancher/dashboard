<script>
import { mapGetters } from 'vuex';
import { ELEMENTAL_SCHEMA_IDS } from '../types';
import { createElementalRoute } from '../utils/custom-routing';
import Loading from '@shell/components/Loading';

export default {
  name:       'Dashboard',
  components: { Loading },
  async fetch() {
    const machineRegistrations = await this.$store.dispatch('management/findAll', { type: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS });

    if (!machineRegistrations?.length) {
      this.showGetStarted = true;
    }
  },
  data() {
    return {
      showGetStarted: false,
      getStartedLink: createElementalRoute('resource-create', { resource: ELEMENTAL_SCHEMA_IDS.MACHINE_REGISTRATIONS })
    };
  },
  computed: { ...mapGetters({ someElementalState: 'elemental/someElementalState' }) },
  methods:  {
    toggleState() {
      this.$store.dispatch('elemental/elementalStateChange', { val: !this.someElementalState });
    }
  },
};
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <!-- Get Started -->
    <div v-else-if="showGetStarted">
      <h1>{{ t('elemental.dashboard.title') }}</h1>
      <div
        class="elemental-empty-dashboard"
      >
        <i class="icon-fleet mb-30" />
        <h3 class="mb-30">
          {{ t('elemental.dashboard.welcomeText') }}
        </h3>
        <n-link
          :to="getStartedLink"
          class="btn role-primary"
        >
          {{ t('elemental.dashboard.getStarted') }}
        </n-link>
      </div>
    </div>
    <div v-else>
      <h2>Some content for dashboard view to be defined...</h2>
    </div>
    <!-- <h1>OS ELEMENTAL!!! {{ someElementalState }}</h1>
    <button type="button" @click="toggleState">
      TOGGLE STATE
    </button> -->
  </div>
</template>

<style lang="scss" scoped>
.elemental-empty-dashboard {
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
}
</style>
