<script>
import { NODE } from '@shell/config/types';
import { HCI } from '../types';
import { allHash } from '@shell/utils/promise';
import { HCI as HCI_ANNOTATIONS } from '@/pkg/harvester/config/labels-annotations';
import PercentageBar from '@shell/components/PercentageBar';
import ProgressBarList from './HarvesterUpgradeProgressBarList';
import BadgeStateFormatter from '@shell/components/formatter/BadgeStateFormatter';
import { PRODUCT_NAME as HARVESTER } from '../config/harvester';
import { mapGetters } from 'vuex';

export default {
  name:       'HarvesterUpgradeHeader',
  components: {
    PercentageBar, ProgressBarList, BadgeStateFormatter
  },

  async fetch() {
    const hash = {};

    if (this.$store.getters['harvester/schemaFor'](HCI.IMAGE)) {
      hash.images = this.$store.dispatch('harvester/findAll', { type: HCI.IMAGE });
    }

    if (this.$store.getters['harvester/schemaFor'](HCI.UPGRADE)) {
      hash.upgrades = this.$store.dispatch('harvester/findAll', { type: HCI.UPGRADE });
    }

    if (this.$store.getters['harvester/schemaFor'](NODE)) {
      hash.nodes = this.$store.dispatch('harvester/findAll', { type: NODE });
    }

    await allHash(hash);
  },

  computed: {
    ...mapGetters(['currentProduct', 'isVirtualCluster']),

    enabled() {
      return this.isVirtualCluster && this.currentProduct.name === HARVESTER;
    },

    latestResource() {
      return this.$store.getters['harvester/all'](HCI.UPGRADE).find( U => U.isLatestUpgrade);
    },

    overallMessage() {
      return this.latestResource?.overallMessage;
    },

    upgradeImage() {
      const id = this.latestResource?.upgradeImage;

      return this.$store.getters['harvester/all'](HCI.IMAGE).find(I => I.id === id);
    },

    imageProgress() {
      return this.upgradeImage?.progress || 0;
    },

    showImage() {
      return !this.latestResource.isUpgradeSucceeded;
    },

    imageMessage() {
      return this.latestResource?.upgradeImageMessage;
    },

    repoReady() {
      return this.latestResource.createRepo;
    },

    isShow() {
      return this.latestResource && !this.latestResource.hasReadMessage;
    },

    nodesStatus() {
      return this.latestResource?.nodeUpgradeMessage;
    },

    sysServiceUpgradeMessage() {
      return this.latestResource?.sysServiceUpgradeMessage;
    },

    sysServiceTotal() {
      return this.sysServiceUpgradeMessage?.[0].percent || 0;
    },

    nodesPercent() {
      return this.latestResource?.nodeTotalPercent || 0;
    },

    repoInfo() {
      return this.latestResource.repoInfo;
    },
  },

  methods: {
    ignoreMessage() {
      this.latestResource.setLabel(HCI_ANNOTATIONS.REAY_MESSAGE, 'true');
      this.latestResource.save();
    }
  }
};
</script>
<template>
  <div v-if="enabled && isShow" class="upgrade">
    <v-popover
      v-tooltip="{
        placement: 'bottom-left',
      }"
      class="hand"
    >
      <slot name="button-content">
        <i class="warning icon-fw icon icon-dot-open dot-icon" />
      </slot>

      <template slot="popover">
        <div class="upgrade-info mb-10">
          <div v-if="repoInfo" class="repoInfo">
            <div v-if="latestResource" class="row mb-5">
              <div class="col span-12">
                <p class="state">
                  {{ t('harvester.upgradePage.repoInfo.upgradeStatus') }}: <BadgeStateFormatter class="ml-5" :row="latestResource" />
                </p>
              </div>
            </div>

            <p class="bordered-section"></p>

            <div class="row mb-5">
              <div class="col span-6">
                {{ t('harvester.upgradePage.repoInfo.os') }}: <span class="text-muted">{{ repoInfo.release.os }}</span>
              </div>

              <div class="col span-6">
                {{ t('harvester.productLabel') }}: <span class="text-muted">{{ repoInfo.release.harvester }}</span>
              </div>
            </div>

            <div class="row mb-5">
              <div class="col span-6">
                {{ t('harvester.upgradePage.repoInfo.harvesterChart') }}: <span class="text-muted">{{ repoInfo.release.harvesterChart }}</span>
              </div>

              <div class="col span-6">
                {{ t('harvester.upgradePage.repoInfo.monitoringChart') }}: <span class="text-muted">{{ repoInfo.release.monitoringChart }}</span>
              </div>
            </div>

            <div class="row mb-5">
              <div class="col span-6">
                {{ t('harvester.upgradePage.repoInfo.kubernetes') }}: <span class="text-muted">{{ repoInfo.release.kubernetes }}</span>
              </div>

              <div class="col span-6">
                {{ t('product.rancher') }}: <span class="text-muted">{{ repoInfo.release.rancher }}</span>
              </div>
            </div>

            <p class="bordered-section"></p>
          </div>

          <p v-if="overallMessage" class="text-warning mb-20">
            {{ overallMessage }}
          </p>

          <div v-if="showImage">
            <h4>{{ t('harvester.upgradePage.upgradeImage') }}<span class="float-r text-info">{{ imageProgress }}%</span></h4>
            <PercentageBar :value="imageProgress" preferred-direction="MORE" />
            <p class="text-warning">
              {{ imageMessage }}
            </p>
            <p class="bordered-section"></p>
          </div>

          <h4>{{ t('harvester.upgradePage.createRepository') }} <span class="float-r text-info">{{ repoReady.isReady ? t('harvester.upgradePage.succeeded') : t('harvester.upgradePage.pending') }}</span></h4>
          <p v-if="repoReady.message" class="text-warning">
            {{ repoReady.message }}
          </p>
          <p class="bordered-section"></p>

          <ProgressBarList :title="t('harvester.upgradePage.upgradeNode')" :precent="nodesPercent" :list="nodesStatus" />
          <p class="bordered-section"></p>

          <ProgressBarList :title="t('harvester.upgradePage.upgradeSysService')" :precent="sysServiceTotal" :list="sysServiceUpgradeMessage" />
        </div>

        <div v-if="latestResource.isUpgradeSucceeded" class="successTip">
          <button class="btn role-primary" @click="ignoreMessage()">
            {{ t('harvester.upgradePage.dismissMessage') }}
          </button>
        </div>
      </template>
    </v-popover>
  </div>
</template>

<style lang="scss" scoped>
.upgrade {
  height: 100%;
  min-width: 40px;
  display: flex;
  align-items: center;

  .dot-icon {
    font-size: 24px;
    vertical-align: middle;
    color: #00a483;
  }
}

.upgrade-info {
  min-width: 550px;

  .repoInfo {
    .col span {
      word-break: break-all
    }

    p.state {
      display: flex;
      align-items: center;
    }
  }

  .float-r {
    float: right;
  }

  p {
    word-break: break-word;
    margin-top: 5px;
  }
}

.successTip {
  display: flex;
  flex-direction: row-reverse
}
</style>
