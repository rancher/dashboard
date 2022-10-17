<script>
import { Banner } from '@components/Banner';

export default {
  name: 'HarvesterUpgradeInfo',

  components: { Banner },

  props: {
    version: {
      type:    String,
      default: ''
    }
  },

  computed: {
    releaseVersion() {
      return !!this.version ? `https://github.com/harvester/harvester/releases/tag/${ this.version }` : `https://github.com/harvester/harvester/releases`;
    }
  },
};
</script>

<template>
  <div>
    <Banner color="warning">
      <strong>{{ t('harvester.upgradePage.upgradeInfo.warning') }}:</strong>
      <p class="mb-5" v-html="t('harvester.upgradePage.upgradeInfo.doc', {}, true)">
      </p>

      <p class="mb-5">
        {{ t('harvester.upgradePage.upgradeInfo.tip') }}
      </p>

      <p class="mb-5">
        {{ t('harvester.upgradePage.upgradeInfo.moreNotes') }} <a :href="releaseVersion" target="_blank">{{ t('generic.moreInfo') }} </a>
      </p>
    </Banner>
  </div>
</template>
