<script>
import { mapGetters } from 'vuex';
import BannerGraphic from '@shell/components/BannerGraphic';
import IndentedPanel from '@shell/components/IndentedPanel';
import SupportBundle from '../../../../dialog/SupportBundle';
import CommunityLinks from '@shell/components/CommunityLinks';
import { SCHEMA, HCI } from '@shell/config/types';

export default {
  layout: 'home',

  components: {
    BannerGraphic,
    IndentedPanel,
    CommunityLinks,
    SupportBundle,
  },

  data() {
    return {
      options: {
        'footer.docs':   'https://docs.harvesterhci.io/latest/',
        'footer.forums': 'https://forums.rancher.com/c/harvester/',
        'footer.slack':  'https://slack.rancher.io',
        'footer.issue':  'https://github.com/harvester/harvester/issues/new/choose',
      },
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    title() {
      return 'harvester.support.title';
    },

    showSupportBundle() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return !!this.$store.getters[`${ inStore }/byId`](SCHEMA, HCI.SUPPORT_BUNDLE);
    },
  },

  methods: {
    open() {
      this.$store.commit('harvester-common/toggleBundleModal', true);
    },
  },
};
</script>

<template>
  <div>
    <BannerGraphic :title="t(title, {}, true)" />

    <IndentedPanel>
      <div class="content mt-20">
        <div class="promo">
          <div v-if="showSupportBundle" class="box mb-20 box-primary">
            <h2>
              {{ t('harvester.modal.bundle.title') }}
            </h2>
            <div>
              <p class="pb-10">
                {{ t('harvester.modal.bundle.titleDescription') }}
              </p>
              <button class="btn role-secondary btn-sm" type="button" @click="open">
                {{ t('harvester.modal.bundle.title') }}
              </button>
            </div>
          </div>
          <div class="box mb-20 box-primary">
            <h2>
              {{ t('harvester.support.kubeconfig.title') }}
            </h2>
            <div>
              <p class="pb-10">
                {{ t('harvester.support.kubeconfig.titleDescription') }}
              </p>
              <button
                class="btn role-secondary btn-sm"
                type="button"
                @click="currentCluster.downloadKubeConfig()"
              >
                {{ t('harvester.support.kubeconfig.title') }}
              </button>
            </div>
          </div>
        </div>
        <div class="community">
          <CommunityLinks
            :link-options="options"
          />
        </div>
      </div>
    </IndentedPanel>
    <SupportBundle
      v-if="showSupportBundle"
    />
  </div>
</template>

<style lang="scss" scoped>
.content {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 70% 30%;
}

.only-community {
  display: grid;
  grid-template-columns: 100%;
}

.community {
  border-left: 1px solid var(--border);
  padding-left: 20px;
  > h2 {
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 20px;
  }
  .support-link {
    margin: 10px 0;
  }
}

.box {
  padding: 20px;
  border: 1px solid var(--border);

  &.box-primary {
    border-color: var(--primary);
  }

  > h2 {
    font-size: 20px;
    font-weight: 300;
  }

  > div {
    font-weight: 300;
    line-height: 18px;
    opacity: 0.8;
  }
}

.role-secondary {
  &:focus {
    background-color: transparent;
  }
}
</style>
