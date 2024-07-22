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
    let monitoringVersion = '';

    if (this.$store.getters[`${ inStore }/canList`](CATALOG.APP)) {
      try {
        const res = await this.$store.dispatch(`${ inStore }/find`, { type: CATALOG.APP, id: 'cattle-monitoring-system/rancher-monitoring' });

        monitoringVersion = res?.currentVersion;
      } catch (err) {

      }
    }

    const leader = await hasLeader(monitoringVersion, this.$store.dispatch, this.currentCluster.id);

    this.hasLeader = leader ? 'Yes' : 'No';
    this.leaderChanges = await leaderChanges(monitoringVersion, this.$store.dispatch, this.currentCluster.id);
    this.failedProposals = await failedProposals(monitoringVersion, this.$store.dispatch, this.currentCluster.id);
  },
  data() {
    return {
      hasLeader:       'No',
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
      <label>{{ t('etcdInfoBanner.hasLeader') }}</label> {{ hasLeader }},
    </div>
    <div class="datum">
      <label>{{ t('etcdInfoBanner.leaderChanges') }}</label> {{ leaderChanges }},
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

        & :deep() label {
            color: var(--info);
        }
    }

</style>
