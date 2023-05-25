<script>
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { mapGetters } from 'vuex';
import { hasLeader, leaderChanges, failedProposals } from '@shell/utils/grafana';
import { CATALOG } from '@shell/config/types';

export default {
  components: { Banner, Loading },
  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;
    const res = await this.$store.dispatch(`${ inStore }/find`, { type: CATALOG.APP, id: 'cattle-monitoring-system/rancher-monitoring' });
    const monitoringVersion = res?.currentVersion;
    const leader = await hasLeader(monitoringVersion, this.$store.dispatch, this.currentCluster.id);

    this.hasLeader = leader ? this.t('generic.yes') : this.t('generic.no');
    this.leaderChanges = await leaderChanges(monitoringVersion, this.$store.dispatch, this.currentCluster.id);
    this.failedProposals = await failedProposals(monitoringVersion, this.$store.dispatch, this.currentCluster.id);
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
  <Banner
    v-else
    class="banner"
    color="info"
  >
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
            margin-right: 5px;
        }

        & ::v-deep label {
            color: var(--info);
        }
    }

</style>
