<script>
import { options } from '@shell/config/footer';
import BannerGraphic from '@shell/components/BannerGraphic';
import AsyncButton from '@shell/components/AsyncButton';
import IndentedPanel from '@shell/components/IndentedPanel';
import { Card } from '@components/Card';
import CommunityLinks from '@shell/components/CommunityLinks';
import { CATALOG, MANAGEMENT } from '@shell/config/types';
import { getVendor, setBrand } from '@shell/config/private-label';
import { SETTING } from '@shell/config/settings';
import { findBy } from '@shell/utils/array';
import { addParam } from '@shell/utils/url';

const KEY_REGEX = /^[0-9a-fA-F]{16}$/;

export default {
  layout: 'home',

  components: {
    BannerGraphic,
    IndentedPanel,
    AsyncButton,
    Card,
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
    this.supportSetting = await fetchOrCreateSetting('has-support', 'false');
    this.brandSetting = await fetchOrCreateSetting(SETTING.BRAND, '');
    this.serverUrlSetting = await fetchOrCreateSetting(SETTING.SERVER_URL, '');
    this.uiIssuesSetting = await this.$store.dispatch('management/find', { type: MANAGEMENT.SETTING, id: SETTING.ISSUES });
  },

  data() {
    return {
      apps:                 [],
      vendor:               getVendor(),
      supportKey:           '',
      supportSetting:       null,
      brandSetting:         null,
      uiIssuesSetting:      null,
      serverSetting:        null,
      promos:               [
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

    hasSupport() {
      // NB: This is temporary until API implemented
      return false;
    },

    options() {
      if (!this.uiIssuesSetting?.value) {
        return;
      }

      // Load defaults for suppoet page
      return options(true, this.uiIssuesSetting?.value);
    },

    title() {
      return this.hasSupport ? 'support.suse.title' : 'support.community.title';
    },

    validSupportKey() {
      return !!this.supportKey.match(KEY_REGEX);
    },

    sccLink() {
      return this.hasAWSSupport ? addParam('https://scc.suse.com', 'from_marketplace', '1') : 'https://scc.suse.com';
    }
  },

  methods: {
    async addSubscription(done) {
      try {
        this.supportSetting.value = 'true';
        this.brandSetting.value = 'suse';
        await Promise.all([this.supportSetting.save(), this.brandSetting.save()]);
        setBrand('suse');
        done(true);
        this.$modal.hide('toggle-support');
      } catch {
        done(false);
      }
    },

    async removeSubscription(done) {
      try {
        this.supportSetting.value = 'false';
        this.brandSetting.value = '';
        await Promise.all([this.supportSetting.save(), this.brandSetting.save()]);
        setBrand('');
        done(true);
        this.$modal.hide('toggle-support');
      } catch {
        done(false);
      }
    },

    showDialog(isAdd) {
      this.isRemoveDialog = isAdd;
      this.supportKey = '';
      this.$modal.show('toggle-support');
    },

    dialogOpened() {
      const input = this.$refs.subscriptionIDInput;

      if (input) {
        input.focus();
      }
    },
  }
};
</script>
<template>
  <div>
    <BannerGraphic :title="t(title, {}, true)" />

    <IndentedPanel>
      <div class="content mt-20">
        <div class="promo">
          <div class="box mb-20 box-primary">
            <h2>{{ t('support.suse.access.title') }}</h2>
            <div>
              <p class="pb-10">
                {{ hasAWSSupport ? t("support.suse.access.aws.text") : t("support.suse.access.text") }}
              </p>
              <a v-if="hasAWSSupport" class="mr-5 btn role-secondary btn-sm" :href="supportConfigLink">
                {{ t('support.suse.access.aws.generateConfig') }}
              </a>
              <a :href="sccLink" target="_blank" rel="noopener noreferrer nofollow">
                {{ t('support.suse.access.action') }} <i class="icon icon-external-link" />
              </a>
            </div>
          </div>
          <div class="boxes">
            <div v-for="key in promos" :key="key" class="box">
              <h2>{{ t(`${key}.title`) }}</h2>
              <div>{{ t(`${key}.text`) }}</div>
            </div>
          </div>

          <div v-if="!hasSupport" class="register row">
            <div>
              {{ t('support.subscription.haveSupport') }}
            </div>
            <button class="ml-5 btn role-secondary btn-sm" type="button" @click="showDialog(false)">
              {{ t('support.subscription.addSubscription') }}
            </button>
          </div>
          <div v-if="hasSupport && !hasAWSSupport" class="register row">
            <a class="remove-link" @click="showDialog(true)">
              {{ t('support.subscription.removeSubscription') }}
            </a>
          </div>
        </div>
        <div class="community">
          <CommunityLinks :link-options="options">
            <div v-if="!hasSupport" class="external support-links" :class="{ 'mt-15': !!options}">
              <div class="support-link">
                <a class="support-link" href="https://rancher.com/support-maintenance-terms" target="_blank" rel="noopener noreferrer nofollow">{{ t('support.community.learnMore') }}</a>
              </div>
              <div class="support-link">
                <a class="support-link" href="https://rancher.com/pricing" target="_blank" rel="noopener noreferrer nofollow">{{ t('support.community.pricing') }}</a>
              </div>
            </div>
          </CommunityLinks>
        </div>
      </div>
    </IndentedPanel>
    <modal
      name="toggle-support"
      height="auto"
      :width="340"
      @opened="dialogOpened"
    >
      <Card :show-highlight-border="false" class="toggle-support">
        <template #title>
          {{ isRemoveDialog? t('support.subscription.removeTitle') : t('support.subscription.addTitle') }}
        </template>
        <template #body>
          <div v-if="isRemoveDialog" class="mt-20">
            {{ t('support.subscription.removeBody') }}
          </div>
          <div v-else class="mt-20">
            <p class="pb-10">
              {{ t('support.subscription.addLabel') }}
            </p>
            <input ref="subscriptionIDInput" v-model="supportKey" />
          </div>
        </template>
        <template #actions>
          <button type="button" class="btn role-secondary" @click="$modal.hide('toggle-support')">
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton v-if="!isRemoveDialog" :disabled="!validSupportKey" class="pull-right" @click="addSubscription" />
          <AsyncButton v-else :action-label="t('generic.remove')" class="pull-right" @click="removeSubscription" />
        </template>
      </Card>
    </modal>
  </div>
</template>
<style lang="scss" scoped>
.content {
  display: grid;
  grid-column-gap: 20px;
  grid-row-gap: 20px;
  grid-template-columns: 70% 30%;
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

.community {
  border-left: 1px solid var(--border);
  padding-left: 20px;
  > h2 {
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 20px;
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
