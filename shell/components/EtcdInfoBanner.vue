<script>
import Banner from '@shell/components/Banner';
import Loading from '@shell/components/Loading';
import { mapGetters } from 'vuex';
import { hasLeader, leaderChanges, failedProposals } from '@shell/utils/grafana';

export default {
  components: { Banner, Loading },
  async fetch() {
    const leader = await hasLeader(this.$store.dispatch, this.currentCluster.id);

    this.hasLeader = leader ? this.t('generic.yes') : this.t('generic.no');
    this.leaderChanges = await leaderChanges(this.$store.dispatch, this.currentCluster.id);
    this.failedProposals = await failedProposals(this.$store.dispatch, this.currentCluster.id);
  },
  data() {
    return {
      hasLeader:       this.t('generic.no'),
      leaderChanges:   0,
      failedProposals: 0
    };
  },
  computed: { ...mapGetters(['currentCluster']) }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <Banner v-else class="banner" color="info">
    <div class="datum">
      <label>{{ t('etcdInfoBanner.hasLeader') }}</label> {{ hasLeader }}
    </div>
    <div class="datum">
      <label>{{ t('etcdInfoBanner.leaderChanges') }}</label> {{ leaderChanges }}
    </div>
    <div class="datum">
      <label>{{ t('etcdInfoBanner.failedProposals') }}</label> {{ failedProposals }}
    </div>
  </Banner>
</template>

<style lang='scss' scoped>
    .banner {
        display: flex;
        justify-content: space-evenly;
        align-items: center;

        .datum {
            text-align: center;
        }

        & ::v-deep label {
            color: var(--info);
        }
    }

</style>
