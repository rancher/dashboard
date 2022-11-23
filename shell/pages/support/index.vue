<script>
import BannerGraphic from '@shell/components/BannerGraphic';
import IndentedPanel from '@shell/components/IndentedPanel';
import CommunityLinks from '@shell/components/CommunityLinks';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { getVendor } from '@shell/config/private-label';
import { SETTING } from '@shell/config/settings';
import { findBy } from '@shell/utils/array';
import { addParam } from '@shell/utils/url';
import { isRancherPrime } from '@shell/config/version';

export default {
  layout: 'home',

  components: {
    BannerGraphic,
    IndentedPanel,
    CommunityLinks
  },

  async fetch() {
    const fetchOrCreateSetting = async(id, val) => {
      let setting;

      try {
        setting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id });
      } catch {
        const schema = this.$store.getters['management/schemaFor'](MANAGEMENT.SETTING);
        const url = schema.linkFor('collection');

        setting = await this.$store.dispatch('management/create', {
          type:     MANAGEMENT.SETTING,
          metadata: { name: id },
          value:    val,
          default:  val || ''
        });

        setting.save({ url });
      }

      return setting;
    };

    if ( this.$store.getters['management/canList'](CATALOG.APP) ) {
      this.apps = await this.$store.dispatch('management/findAll', { type: CATALOG.APP });
    }
    this.brandSetting = await fetchOrCreateSetting(SETTING.BRAND, '');
    this.serverUrlSetting = await fetchOrCreateSetting(SETTING.SERVER_URL, '');
    this.uiIssuesSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES });
  },

  data() {
    return {
      apps:            [],
      vendor:          getVendor(),
      supportKey:      '',
      brandSetting:    null,
      uiIssuesSetting: null,
      serverSetting:   null,
      promos:          [
        'support.promos.one',
        'support.promos.two',
        'support.promos.three',
        'support.promos.four',
      ]
    };
  },

  computed: {
    cspAdapter() {
      return findBy(this.apps, 'metadata.name', 'rancher-csp-adapter' );
    },

    hasSupport() {
      return this.hasAWSSupport || isRancherPrime();
    },

    hasAWSSupport() {
      return !!this.cspAdapter;
    },

    serverUrl() {
      if (process.client) {
        // Client-side rendered: use the current window location
        return window.location.origin;
      }

      // Server-side rendered
      return this.serverSetting?.value || '';
    },

    supportConfigLink() {
      if (!this.cspAdapter) {
        return false;
      }

      return `${ this.serverUrl }/v1/generateSUSERancherSupportConfig`;
    },

    title() {
      return this.hasSupport ? 'support.suse.title' : 'support.community.title';
    },

    sccLink() {
      return this.hasAWSSupport ? addParam('https://scc.suse.com', 'from_marketplace', '1') : 'https://scc.suse.com';
    }
  },

};
</script>
<template>
  <div>
    <BannerGraphic :title="t(title, {}, true)" />

    <IndentedPanel>
      <div class="content mt-20">
        <div class="promo col main-panel">
          <div class="box mb-20 box-primary">
            <h2>{{ t('support.suse.access.title') }}</h2>
            <div
              v-if="!hasSupport"
              class="external support-links mt-20"
            >
              <div class="support-link">
                <a
                  class="support-link"
                  href="https://rancher.com/support-maintenance-terms"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >{{ t('support.community.learnMore') }}</a>
              </div>
              <div class="support-link">
                <a
                  class="support-link"
                  href="https://rancher.com/pricing"
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >{{ t('support.community.pricing') }}</a>
              </div>
            </div>
            <div v-else>
              <p class="pb-10">
                {{ hasAWSSupport ? t("support.suse.access.aws.text") : t("support.suse.access.text") }}
              </p>
              <a
                v-if="hasAWSSupport"
                class="mr-5 btn role-secondary btn-sm"
                :href="supportConfigLink"
              >
                {{ t('support.suse.access.aws.generateConfig') }}
              </a>
              <a
                :href="sccLink"
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                {{ t('support.suse.access.action') }} <i class="icon icon-external-link" />
              </a>
            </div>
          </div>
          <div class="boxes">
            <div
              v-for="key in promos"
              :key="key"
              class="box"
            >
              <h2>{{ t(`${key}.title`) }}</h2>
              <div>{{ t(`${key}.text`) }}</div>
            </div>
          </div>
        </div>
        <CommunityLinks
          :is-support-page="true"
          class="community col side-panel span-3"
        />
      </div>
    </IndentedPanel>
  </div>
</template>
<style lang="scss" scoped>
.content {

    display: flex;
    align-items: stretch;
    .col {
      margin: 0
    }
    .main-panel {
      flex: auto;
    }

    .side-panel {
      margin-left: 1.75%;
    }
  }

.toggle-support {
    height: 100%;

    &.card-container {
      box-shadow: none;
    }

    &::v-deep .card-actions {
      display: flex;
      justify-content: space-between;
    }
}

.support-link:not(:first-child) {
  margin: 15px 0 0 0;
}

.register {
  display: flex;
  align-items: center;
  margin-top: 20px;
  font-size: 16px;
}
.remove-link {
  cursor: pointer;
  font-size: 14px;
}
.boxes {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 50% 50%;
  margin-right: 20px;
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
