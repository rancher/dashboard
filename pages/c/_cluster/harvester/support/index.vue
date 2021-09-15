<script>
import BannerGraphic from '@/components/BannerGraphic';
import IndentedPanel from '@/components/IndentedPanel';
import SupportBundle from '@/components/dialog/SupportBundle';
import CommunityLinks from '@/components/CommunityLinks';

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
        'footer.docs':   'https://docs.harvesterhci.io/',
        'footer.forums': 'https://forums.rancher.com/',
        'footer.slack':  'https://slack.rancher.io',
        'footer.issue':  'https://github.com/harvester/harvester/issues/new/choose',
      },
    };
  },

  computed: {
    title() {
      return 'support.community.title';
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
          <div class="box mb-20 box-primary">
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
        </div>
        <div class="community">
          <CommunityLinks
            :link-options="options"
          />
        </div>
      </div>
    </IndentedPanel>
    <SupportBundle />
  </div>
</template>

<style lang="scss" scoped>
.content {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 70% 30%;
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
</style>
