<script>
import { mapGetters } from 'vuex';
import { HCI } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import ModalWithCard from '@shell/components/ModalWithCard';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Banner } from '@components/Banner';

export default {
  name: 'HarvesterUpgrade',

  components: {
    ModalWithCard, LabeledSelect, Banner
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const res = await allHash({
      upgradeVersion: this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.SETTING }),
      versions:       this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.VERSION }),
      upgrade:        this.$store.dispatch(`${ inStore }/findAll`, { type: HCI.UPGRADE }),
    });

    this.upgrade = res.upgrade;
  },

  data() {
    return {
      upgrade:         [],
      upgradeMessage:  [],
      errors:          '',
      selectMode:     true,
      version:        ''
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    versionOptions() {
      const versions = this.$store.getters['harvester/all'](HCI.VERSION);

      return versions.map(V => V.metadata.name);
    },

    currentVersion() {
      const serverVersion = this.$store.getters['harvester/byId'](HCI.SETTING, 'server-version');

      return serverVersion.currentVersion || '';
    }
  },

  watch: {
    upgrade: {
      handler(neu) {
        let upgradeMessage = [];
        const list = neu || [];

        const currentResource = list.find( O => !!O.isLatestUpgrade);

        upgradeMessage = currentResource ? currentResource.upgradeMessage : [];

        this.$set(this, 'upgradeMessage', upgradeMessage);
      },
      deep: true
    }
  },

  methods: {
    async handleUpgrade() {
      const upgradeValue = {
        type:     HCI.UPGRADE,
        metadata: {
          generateName: 'hvst-upgrade-',
          namespace:    'harvester-system'
        },
        spec: { version: this.version }
      };

      const proxyResource = await this.$store.dispatch('harvester/create', upgradeValue);

      try {
        await proxyResource.save();

        this.cancel();
      } catch (err) {
        if (err?.message !== '') {
          this.errors = err.message;
        }
      }
    },

    cancel() {
      this.$refs.deleteTip.hide();
      this.errors = '';
    },

    open() {
      this.$refs.deleteTip.open();
    },

    handleMode() {
      this.selectMode = !this.selectMode;
    }
  }
};
</script>

<template>
  <div>
    <header class="header mb-0">
      <h1>
        <t
          k="harvester.dashboard.header"
          :cluster="currentCluster.nameDisplay"
        />
      </h1>
      <button v-if="versionOptions.length" type="button" class="btn bg-warning btn-sm" @click="open">
        <t k="harvester.upgradePage.upgrade" />
      </button>
    </header>

    <ModalWithCard ref="deleteTip" name="deleteTip" :width="500">
      <template #title>
        <t k="harvester.upgradePage.upgradeApp" />
      </template>

      <template #content>
        <div class="currentVersion">
          <span> <t k="harvester.upgradePage.currentVersion" /> </span>
          <span class="version">{{ currentVersion }}</span>
        </div>

        <p class="bordered-section"></p>

        <div v-if="selectMode">
          <LabeledSelect
            v-model="version"
            class="mb-20"
            :label="t('harvester.upgradePage.versionLabel')"
            :options="versionOptions"
            :clearable="true"
          />

          <Banner v-if="errors.length" color="warning">
            {{ errors }}
          </Banner>
        </div>
      </template>

      <template #footer>
        <div class="footer">
          <button class="btn role-secondary btn-sm mr-20" @click.prevent="cancel">
            <t k="generic.close" />
          </button>
          <button class="btn role-tertiary bg-primary btn-sm mr-20" @click.prevent="handleUpgrade">
            <t k="harvester.upgradePage.upgrade" />
          </button>
        </div>
      </template>
    </ModalWithCard>
  </div>
</template>

<style lang="scss" scoped>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .banner-icon {
    display: flex;
    align-items: center;
  }

  .banner-content {
    display: flex;
  }

  .banner-message {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 15px;
  }

  .icon {
    font-size: 20px;
    width: 20px;
    line-height: 23px;
  }

  .currentVersion {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
    .version {
      font-size: 16px;
      font-weight: bold;
    }
  }
</style>
