<script>
import dayjs from 'dayjs';
import { mapGetters } from 'vuex';
import { HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import ModalWithCard from '@/components/ModalWithCard';
import LabeledSelect from '@/components/form/LabeledSelect';
import Banner from '@/components/Banner';

export default {
  name: 'Upgrade',

  components: {
    ModalWithCard, LabeledSelect, Banner
  },

  async fetch() {
    const res = await allHash({
      upgradeVersion: this.$store.dispatch('cluster/findAll', { type: HCI.SETTING }),
      upgrade:        this.$store.dispatch('cluster/findAll', { type: HCI.UPGRADE })
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
      const settings = this.$store.getters['cluster/all'](HCI.SETTING);

      const upgradeVersion = settings.find( S => S.id === 'upgradable-versions');

      return upgradeVersion?.upgradeableVersion || [];
    },

    currentVersion() {
      const serverVersion = this.$store.getters['cluster/byId'](HCI.SETTING, 'server-version');

      return serverVersion.currentVersion || '';
    },

    // version() {
    //   return this.versionOptions[0]?.value || '';
    // }
  },

  watch: {
    upgrade: {
      handler(neu) {
        let upgradeMessage = [];
        const list = neu || [];

        const currentResource = list.find( O => !!O.isCurrentUpgrade);

        upgradeMessage = currentResource ? currentResource.upgradeMessage : [];

        this.$set(this, 'upgradeMessage', upgradeMessage);
      },
      deep: true
    },

    versionOptions: {
      handler(neu) {
        const version = neu[0]?.value || '';

        this.version = version;
      },
      deep: true,
    }
  },

  methods: {
    async handleUpgrade() {
      const name = `upgrade-${ dayjs().format('MMDD-HHmmss') }`;

      const upgradeValue = {
        type:     HCI.UPGRADE,
        metadata: {
          name,
          namespace: 'harvester-system'
        },
        spec: { version: this.version }
      };

      const proxyResource = await this.$store.dispatch('cluster/create', upgradeValue);

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
        <t k="harvester.dashboard.upgrade.upgrade" />
      </button>
    </header>

    <ModalWithCard ref="deleteTip" name="deleteTip" :width="500">
      <template #title>
        <t k="harvester.dashboard.upgrade.upgradeApp" />
      </template>

      <template #content>
        <div class="currentVersion">
          <span> <t k="harvester.dashboard.upgrade.currentVersion" /> </span>
          <span class="version">{{ currentVersion }}</span>
        </div>

        <p class="bordered-section"></p>

        <div v-if="selectMode">
          <LabeledSelect
            v-model="version"
            class="mb-20"
            :label="t('harvester.dashboard.upgrade.versionLabel')"
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
            <t k="harvester.dashboard.upgrade.upgrade" />
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
